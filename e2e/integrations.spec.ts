import { createHmac } from "crypto";
import { PrismaClient } from "@prisma/client";
import { expect, Page, test } from "@playwright/test";
import { io } from "socket.io-client";

const prisma = new PrismaClient();
const API_BASE_URL = "http://localhost:5000";

test.afterAll(async () => {
  await prisma.$disconnect();
});

function encode(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function query(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join("&");
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("input[type=email]", email);
  await page.fill("input[type=password]", password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 30_000 });
}

test("auth claims, chat token, and legacy order APIs are protected", async ({ page }) => {
  await login(page, "anna.buyer@tfdtronic.com", "password");

  const sessionBefore = await (await page.request.get("/api/auth/session")).json();
  const csrf = await (await page.request.get("/api/auth/csrf")).json();
  const sessionAfter = await (
    await page.request.post("/api/auth/session", {
      data: {
        csrfToken: csrf.csrfToken,
        data: { role: "admin", shopStatus: "ACTIVE" },
      },
    })
  ).json();

  expect(sessionAfter.user.role).toBe(sessionBefore.user.role);
  expect(sessionAfter.user.shopStatus).toBe(sessionBefore.user.shopStatus);
  expect(sessionAfter.user.role).not.toBe("admin");

  const chatTokenResponse = await page.request.get("/api/chat-token");
  expect(chatTokenResponse.status()).toBe(200);
  const { token: chatToken } = await chatTokenResponse.json();

  await new Promise<void>((resolve, reject) => {
    const socket = io(API_BASE_URL, {
      auth: { token: chatToken },
      transports: ["websocket"],
      timeout: 5_000,
    });
    socket.on("connect", () => {
      socket.disconnect();
      resolve();
    });
    socket.on("connect_error", reject);
  });

  const backendToken = await (await page.request.get("/api/backend-token")).json();
  const badChat = await page.request.post(`${API_BASE_URL}/api/chat/conversations`, {
    headers: { Authorization: `Bearer ${backendToken.token}` },
    data: { recipientId: "seller-gadget-pro", productId: "invalid-product" },
  });
  expect(badChat.status()).toBe(404);

  const legacyOrder = await page.request.post(`${API_BASE_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${backendToken.token}` },
    data: {},
  });
  expect(legacyOrder.status()).toBe(410);

  const legacyItems = await page.request.get(`${API_BASE_URL}/api/order-product`, {
    headers: { Authorization: `Bearer ${backendToken.token}` },
  });
  expect(legacyItems.status()).toBe(403);
});

test("buyer-facing integration UI surfaces render", async ({ page }) => {
  const product = await prisma.product.findFirst({
    where: {
      sellerId: "seller-gadget-pro",
      status: "PUBLISHED",
      inStock: { gt: 0 },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      mainImage: true,
      sellerId: true,
      seller: { select: { shopName: true, email: true } },
    },
  });
  expect(product).toBeTruthy();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeEnabled();

  await login(page, "anna.buyer@tfdtronic.com", "password");

  await page.goto(`/product/${product!.slug}`);
  await expect(page.getByRole("heading", { name: product!.title })).toBeVisible();
  await expect(page.getByRole("button", { name: /add to wishlist|saved to wishlist/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /chat with seller/i })).toBeVisible();

  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: /messages/i })).toBeVisible();
  await expect(page.getByText("Conversations", { exact: true })).toBeVisible();

  try {
    await page.request.put("/api/account/cart", {
      data: {
        items: [
          {
            id: product!.id,
            title: product!.title,
            price: product!.price,
            image: product!.mainImage,
            amount: 1,
            sellerId: product!.sellerId,
            sellerName: product!.seller?.shopName || product!.seller?.email || "Seller",
            slug: product!.slug,
          },
        ],
      },
    });

    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByText("Payment Method")).toBeVisible();
    await expect(page.getByRole("button", { name: /VNPay/i })).toBeVisible();
    await expect(page.getByText(/Bank QR/i)).toBeVisible();
    await expect(page.getByText(/Cash on Delivery/i)).toBeVisible();
  } finally {
    await page.request.put("/api/account/cart", { data: { items: [] } });
  }
});

test("VNPay pending order is idempotent, hidden from seller, and released on failed IPN", async ({
  browser,
  page,
}) => {
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  test.skip(!hashSecret, "VNPAY_HASH_SECRET is required for the VNPay integration test");

  await login(page, "anna.buyer@tfdtronic.com", "password");
  const product = await prisma.product.findFirst({
    where: {
      sellerId: "seller-gadget-pro",
      status: "PUBLISHED",
      inStock: { gt: 5 },
    },
    select: { id: true, price: true, inStock: true, sellerId: true },
  });
  expect(product).toBeTruthy();

  let orderId = "";
  try {
    const payload = {
      name: "VNPay",
      lastname: "Test",
      phone: "0900000000",
      email: "anna.buyer@tfdtronic.com",
      address: "Test address",
      postalCode: "700000",
      city: "HCM",
      country: "VN",
      items: [
        {
          productId: product!.id,
          quantity: 1,
          unitPrice: product!.price,
          sellerId: "spoofed-seller",
        },
      ],
      paymentMethod: "VNPAY",
    };
    const idempotencyKey = `vnpay-e2e-${Date.now()}`;
    const checkout = await page.request.post("/api/customer-orders/checkout", {
      headers: { "Idempotency-Key": idempotencyKey },
      data: payload,
    });
    const checkoutBody = await checkout.json();
    expect(checkout.status(), JSON.stringify(checkoutBody)).toBe(201);
    orderId = checkoutBody.order.orderId;

    const repeated = await page.request.post("/api/customer-orders/checkout", {
      headers: { "Idempotency-Key": idempotencyKey },
      data: payload,
    });
    expect((await repeated.json()).order.orderId).toBe(orderId);

    const pending = await prisma.customer_order.findUnique({
      where: { id: orderId },
      include: { payments: true, subOrders: true },
    });
    expect(pending?.payments[0].status).toBe("PENDING");
    expect(pending?.subOrders[0].merchantId).toBe(product!.sellerId);
    expect((await prisma.product.findUnique({ where: { id: product!.id } }))?.inStock).toBe(
      product!.inStock - 1,
    );

    const sellerContext = await browser.newContext({ baseURL: "http://localhost:3000" });
    const sellerPage = await sellerContext.newPage();
    await login(sellerPage, "gadget.seller@tfdtronic.com", "password");
    const sellerToken = await (await sellerPage.request.get("/api/backend-token")).json();
    const sellerOrders = await (
      await sellerPage.request.get(`${API_BASE_URL}/api/seller/orders?limit=100`, {
        headers: { Authorization: `Bearer ${sellerToken.token}` },
      })
    ).json();
    expect(sellerOrders.items.some((item: any) => item.order?.id === orderId)).toBeFalsy();
    await sellerContext.close();

    const paymentUrl = new URL(checkoutBody.paymentUrl);
    const params = Object.fromEntries(paymentUrl.searchParams.entries());
    delete params.vnp_SecureHash;
    params.vnp_ResponseCode = "24";
    params.vnp_TransactionStatus = "02";
    params.vnp_TransactionNo = `TEST${Date.now()}`;
    const signature = createHmac("sha512", hashSecret!).update(query(params)).digest("hex");
    const ipnUrl = `/api/payments/vnpay/ipn?${query(params)}&vnp_SecureHash=${signature}`;

    expect((await (await page.request.get(ipnUrl)).json()).RspCode).toBe("00");
    expect((await (await page.request.get(ipnUrl)).json()).RspCode).toBe("02");

    const finished = await prisma.customer_order.findUnique({
      where: { id: orderId },
      include: { payments: { include: { events: true } } },
    });
    expect(finished?.status).toBe("canceled");
    expect(finished?.payments[0].status).toBe("FAILED");
    expect(finished?.payments[0].events).toHaveLength(1);
    expect((await prisma.product.findUnique({ where: { id: product!.id } }))?.inStock).toBe(
      product!.inStock,
    );
  } finally {
    if (orderId) {
      await prisma.$transaction(async (tx) => {
        await tx.notification.deleteMany({ where: { message: { contains: orderId } } });
        await tx.paymentEvent.deleteMany({ where: { payment: { orderId } } });
        await tx.payment.deleteMany({ where: { orderId } });
        await tx.customer_order.delete({ where: { id: orderId } });
      });
    }
  }
});

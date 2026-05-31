import { Browser, BrowserContext, expect, Page, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:5000";

type NotificationTypeValue =
  | "ORDER_UPDATE"
  | "PAYMENT_STATUS"
  | "PROMOTION"
  | "SYSTEM_ALERT"
  | "NEW_ORDER";

type NotificationPriorityValue = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface AuthenticatedActor {
  context: BrowserContext;
  page: Page;
  token: string;
  userId: string;
}

interface CreatedNotification {
  id: string;
  owner: AuthenticatedActor;
  title: string;
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/profile", { timeout: 30000 });
}

async function getBackendToken(page: Page) {
  const response = await page.request.get("/api/backend-token");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.token).toEqual(expect.any(String));
  return body.token as string;
}

async function authenticatedActor(browser: Browser, email: string, password: string): Promise<AuthenticatedActor> {
  const context = await browser.newContext({ baseURL: "http://localhost:3000" });
  const page = await context.newPage();

  await signIn(page, email, password);

  const sessionResponse = await page.request.get("/api/auth/session");
  expect(sessionResponse.status()).toBe(200);
  const session = await sessionResponse.json();
  expect(session?.user?.id).toEqual(expect.any(String));

  return {
    context,
    page,
    token: await getBackendToken(page),
    userId: session.user.id as string,
  };
}

async function createNotification(
  admin: AuthenticatedActor,
  owner: AuthenticatedActor,
  input: {
    title: string;
    message: string;
    type: NotificationTypeValue;
    priority?: NotificationPriorityValue;
    metadata?: Record<string, unknown>;
  },
): Promise<CreatedNotification> {
  const response = await admin.page.request.post(`${API_BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: {
      userId: owner.userId,
      priority: "NORMAL",
      ...input,
    },
  });

  expect(response.status()).toBe(201);
  const notification = await response.json();
  expect(notification.id).toEqual(expect.any(String));
  expect(notification.type).toBe(input.type);

  return { id: notification.id as string, owner, title: input.title };
}

async function deleteNotification(actor: AuthenticatedActor, notificationId: string) {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${actor.token}` },
  });

  expect([200, 404]).toContain(response.status);
}

async function searchNotifications(page: Page, marker: string) {
  await page.goto("/notifications", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Notification Center" })).toBeVisible({ timeout: 30000 });

  const searchInput = page.getByPlaceholder("Search notifications...");
  await expect(searchInput).toBeEnabled();
  await page.waitForLoadState("networkidle");

  const searchResponse = page.waitForResponse((response) => {
    if (response.request().method() !== "GET" || !response.url().startsWith(`${API_BASE_URL}/api/notifications/`)) {
      return false;
    }

    const url = new URL(response.url());
    return url.searchParams.get("search") === marker;
  });

  await searchInput.fill(marker);
  await page
    .locator("form", { has: page.getByPlaceholder("Search notifications...") })
    .getByRole("button", { name: "Search" })
    .click();
  expect((await searchResponse).status()).toBe(200);
  await expect(searchInput).toHaveValue(marker);
}

async function selectTypeFilter(page: Page, type: NotificationTypeValue | "all") {
  const typeSelect = page.locator("select").first();
  const filterResponse = page.waitForResponse((response) => {
    if (response.request().method() !== "GET" || !response.url().startsWith(`${API_BASE_URL}/api/notifications/`)) {
      return false;
    }

    const url = new URL(response.url());
    return type === "all"
      ? !url.searchParams.has("type")
      : url.searchParams.get("type") === type;
  });

  await typeSelect.selectOption(type);
  expect((await filterResponse).status()).toBe(200);
  await expect(typeSelect).toHaveValue(type);
}

async function fetchNotifications(actor: AuthenticatedActor, query = "") {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${actor.userId}${query}`, {
    headers: { Authorization: `Bearer ${actor.token}` },
  });

  expect(response.status).toBe(200);
  return response.json();
}

test.describe("Notification Center", () => {
  test("handles role-specific notification types, filters, mark-read, delete, and mailbox isolation", async ({ browser }) => {
    test.setTimeout(120000);

    const marker = `E2E-NOTIF-${Date.now()}`;
    const created: CreatedNotification[] = [];
    const deletedIds = new Set<string>();

    const admin = await authenticatedActor(browser, "admin@tfdtronic.com", "admin123");
    const buyer = await authenticatedActor(browser, "buyer@tfdtronic.com", "buyer123");
    const seller = await authenticatedActor(browser, "gadget.seller@tfdtronic.com", "password");

    try {
      const buyerOrder = await createNotification(admin, buyer, {
        title: `${marker} buyer order update`,
        message: `${marker} buyer order has been confirmed.`,
        type: "ORDER_UPDATE",
        priority: "NORMAL",
        metadata: { orderId: `${marker}-ORDER` },
      });
      const buyerPayment = await createNotification(admin, buyer, {
        title: `${marker} buyer payment status`,
        message: `${marker} buyer payment is pending confirmation.`,
        type: "PAYMENT_STATUS",
        priority: "HIGH",
        metadata: { orderId: `${marker}-PAYMENT` },
      });
      const buyerPromo = await createNotification(admin, buyer, {
        title: `${marker} buyer promotion`,
        message: `${marker} buyer voucher is available.`,
        type: "PROMOTION",
        priority: "LOW",
        metadata: { promoCode: `${marker}-SAVE` },
      });
      const sellerNewOrder = await createNotification(admin, seller, {
        title: `${marker} seller new order`,
        message: `${marker} seller received a new order.`,
        type: "NEW_ORDER",
        priority: "HIGH",
        metadata: { orderId: `${marker}-SELLER-ORDER` },
      });
      const sellerSystem = await createNotification(admin, seller, {
        title: `${marker} seller system alert`,
        message: `${marker} seller compliance alert.`,
        type: "SYSTEM_ALERT",
        priority: "URGENT",
      });
      const adminSystem = await createNotification(admin, admin, {
        title: `${marker} admin system alert`,
        message: `${marker} admin platform alert.`,
        type: "SYSTEM_ALERT",
        priority: "HIGH",
      });

      created.push(buyerOrder, buyerPayment, buyerPromo, sellerNewOrder, sellerSystem, adminSystem);

      await searchNotifications(buyer.page, marker);
      await expect(buyer.page.getByText(buyerOrder.title)).toBeVisible({ timeout: 30000 });
      await expect(buyer.page.getByText(buyerPayment.title)).toBeVisible();
      await expect(buyer.page.getByText(buyerPromo.title)).toBeVisible();
      await expect(buyer.page.getByText(sellerNewOrder.title)).toHaveCount(0);

      await selectTypeFilter(buyer.page, "ORDER_UPDATE");
      await expect(buyer.page.getByText(buyerOrder.title)).toBeVisible();
      await expect(buyer.page.getByText(buyerPayment.title)).toHaveCount(0);

      await selectTypeFilter(buyer.page, "PAYMENT_STATUS");
      await expect(buyer.page.getByText(buyerPayment.title)).toBeVisible();
      await expect(buyer.page.getByText(buyerOrder.title)).toHaveCount(0);

      await selectTypeFilter(buyer.page, "PROMOTION");
      await expect(buyer.page.getByText(buyerPromo.title)).toBeVisible();

      await searchNotifications(seller.page, marker);
      await selectTypeFilter(seller.page, "NEW_ORDER");
      await expect(seller.page.getByText(sellerNewOrder.title)).toBeVisible({ timeout: 30000 });
      await expect(seller.page.getByText(sellerSystem.title)).toHaveCount(0);

      const markReadButton = seller.page.getByRole("button", { name: /Mark as read/i }).first();
      await expect(markReadButton).toBeVisible();
      await markReadButton.click({ force: true, timeout: 10000 });
      await expect
        .poll(async () => {
          const sellerNewOrderResponse = await fetchNotifications(
            seller,
            `?type=NEW_ORDER&search=${encodeURIComponent(marker)}`,
          );
          const sellerNewOrderRecord = sellerNewOrderResponse.notifications.find(
            (notification: { id: string }) => notification.id === sellerNewOrder.id,
          );
          return sellerNewOrderRecord?.isRead === true;
        }, { timeout: 10000 })
        .toBe(true);

      seller.page.once("dialog", (dialog) => dialog.accept());
      const deleteButton = seller.page.getByRole("button", { name: "Delete notification" }).first();
      await expect(deleteButton).toBeVisible();
      await deleteButton.click({ force: true, timeout: 10000 });
      await expect
        .poll(async () => {
          const sellerAfterDelete = await fetchNotifications(
            seller,
            `?type=NEW_ORDER&search=${encodeURIComponent(marker)}`,
          );
          return sellerAfterDelete.notifications.some(
            (notification: { id: string }) => notification.id === sellerNewOrder.id,
          );
        }, { timeout: 10000 })
        .toBe(false);
      deletedIds.add(sellerNewOrder.id);

      await searchNotifications(admin.page, marker);
      await selectTypeFilter(admin.page, "SYSTEM_ALERT");
      await expect(admin.page.getByText(adminSystem.title)).toBeVisible({ timeout: 30000 });
      await expect(admin.page.getByText(sellerSystem.title)).toHaveCount(0);

      const buyerTryingSellerMailbox = await buyer.page.request.get(
        `${API_BASE_URL}/api/notifications/${seller.userId}`,
        { headers: { Authorization: `Bearer ${buyer.token}` } },
      );
      expect(buyerTryingSellerMailbox.status()).toBe(403);

      const buyerTryingSellerUnreadCount = await buyer.page.request.get(
        `${API_BASE_URL}/api/notifications/${seller.userId}/unread-count`,
        { headers: { Authorization: `Bearer ${buyer.token}` } },
      );
      expect(buyerTryingSellerUnreadCount.status()).toBe(403);
    } finally {
      for (const notification of created) {
        if (!deletedIds.has(notification.id)) {
          await deleteNotification(notification.owner, notification.id);
        }
      }

      await buyer.context.close();
      await seller.context.close();
      await admin.context.close();
    }
  });

  test("rejects invalid notification creation requests", async ({ browser }) => {
    const admin = await authenticatedActor(browser, "admin@tfdtronic.com", "admin123");
    const buyer = await authenticatedActor(browser, "buyer@tfdtronic.com", "buyer123");

    try {
      const invalidTypeResponse = await admin.page.request.post(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${admin.token}` },
        data: {
          userId: buyer.userId,
          title: "Invalid notification type",
          message: "This request should be rejected.",
          type: "UNKNOWN_TYPE",
          priority: "NORMAL",
        },
      });
      expect(invalidTypeResponse.status()).toBe(400);

      const nonAdminCreateResponse = await buyer.page.request.post(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${buyer.token}` },
        data: {
          userId: buyer.userId,
          title: "Unauthorized create",
          message: "Buyer should not create notifications directly.",
          type: "SYSTEM_ALERT",
          priority: "NORMAL",
        },
      });
      expect(nonAdminCreateResponse.status()).toBe(403);
    } finally {
      await buyer.context.close();
      await admin.context.close();
    }
  });
});

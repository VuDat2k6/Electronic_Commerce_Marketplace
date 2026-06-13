import { Browser, expect, Page, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:5000";
const PRODUCT_ID = "prod-garmin-fenix";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  let exposedPasswordInUrl = false;
  const captureNavigation = (frame: { url: () => string }) => {
    exposedPasswordInUrl ||= frame.url().includes("password=");
  };
  page.on("framenavigated", captureNavigation);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("/");
  page.off("framenavigated", captureNavigation);
  expect(exposedPasswordInUrl).toBeFalsy();
}

async function getBackendToken(page: Page) {
  const response = await page.request.get("/api/backend-token");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.token).toEqual(expect.any(String));
  return body.token as string;
}

async function authenticatedPage(browser: Browser, email: string, password: string) {
  const context = await browser.newContext({ baseURL: "http://localhost:3000" });
  const page = await context.newPage();
  await signIn(page, email, password);
  return { context, page };
}

test.describe("Admin moderation notifications", () => {
  test("warning reaches the owning seller while buyer mailbox access remains denied", async ({ browser }) => {
    const admin = await authenticatedPage(browser, "admin@tfdtronic.com", "admin123");
    const adminToken = await getBackendToken(admin.page);
    const headers = { Authorization: `Bearer ${adminToken}` };

    const productResponse = await admin.page.request.get(
      `${API_BASE_URL}/api/products/moderation/${PRODUCT_ID}`,
      { headers },
    );
    expect(productResponse.status()).toBe(200);
    const product = await productResponse.json();
    const sellerId = product.seller.id as string;
    const reason = `E2E verification ${Date.now()}: confirm listing compliance information.`;
    const title = `Compliance warning: ${product.title}`;

    const warningResponse = await admin.page.request.post(
      `${API_BASE_URL}/api/products/moderation/${PRODUCT_ID}/warnings`,
      {
        headers,
        data: {
          violationType: "POLICY_VIOLATION",
          priority: "NORMAL",
          reason,
        },
      },
    );
    expect(warningResponse.status()).toBe(201);
    const notificationId = (await warningResponse.json()).notificationId as string;

    const seller = await authenticatedPage(browser, "gadget.seller@tfdtronic.com", "password");
    const sellerToken = await getBackendToken(seller.page);

    try {
      await seller.page.goto("/notifications", { waitUntil: "domcontentloaded" });
      await expect(seller.page.getByText(title)).toBeVisible({ timeout: 30000 });
      await expect(seller.page.getByText(reason, { exact: false })).toBeVisible();

      const buyer = await authenticatedPage(browser, "buyer@tfdtronic.com", "buyer123");
      const buyerToken = await getBackendToken(buyer.page);
      const deniedResponse = await buyer.page.request.get(
        `${API_BASE_URL}/api/notifications/${sellerId}`,
        { headers: { Authorization: `Bearer ${buyerToken}` } },
      );
      expect(deniedResponse.status()).toBe(403);
      await buyer.context.close();
    } finally {
      const cleanupResponse = await seller.page.request.delete(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${sellerToken}` } },
      );
      expect(cleanupResponse.status()).toBe(200);
      await seller.context.close();
      await admin.context.close();
    }
  });
});

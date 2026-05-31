import { expect, test, type Page } from "@playwright/test";

const BACKEND_URL = "http://localhost:5000";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/profile", { timeout: 30000 });
}

async function backendToken(page: Page) {
  const response = await page.request.get("/api/backend-token");
  expect(response.status()).toBe(200);
  return (await response.json()).token as string;
}

test.describe("Admin product moderation warning", () => {
  test("short warning reason remains clickable and shows validation guidance", async ({ page }) => {
    await login(page, "admin@tfdtronic.com", "admin123");
    await page.goto("/admin/products/prod-garmin-fenix", { waitUntil: "domcontentloaded" });

    await page.getByLabel("Reason and required action").fill("bad");
    const sendButton = page.getByRole("button", { name: /Send warning to seller/i });

    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    await expect(page.getByText("Enter at least 10 characters")).toBeVisible();
  });

  test("warning reaches owning seller and remains private from buyers", async ({ page }) => {
    await login(page, "admin@tfdtronic.com", "admin123");
    const adminToken = await backendToken(page);
    const headers = { Authorization: `Bearer ${adminToken}` };

    const productResponse = await page.request.get(
      `${BACKEND_URL}/api/products/moderation/prod-garmin-fenix`,
      { headers },
    );
    expect(productResponse.status()).toBe(200);
    const product = await productResponse.json();

    const reason = `Automated compliance verification ${Date.now()}: confirm listing specifications.`;
    const warningResponse = await page.request.post(
      `${BACKEND_URL}/api/products/moderation/${product.id}/warnings`,
      {
        headers,
        data: {
          violationType: "MISLEADING_INFORMATION",
          priority: "NORMAL",
          reason,
        },
      },
    );
    expect(warningResponse.status()).toBe(201);
    const { notificationId } = await warningResponse.json();

    await page.context().clearCookies();
    await login(page, "gadget.seller@tfdtronic.com", "password");
    const sellerToken = await backendToken(page);

    try {
      await page.goto("/notifications", { waitUntil: "domcontentloaded" });
      await expect(page.getByText(`Compliance warning: ${product.title}`)).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(reason, { exact: false })).toBeVisible();

      await page.context().clearCookies();
      await login(page, "buyer@tfdtronic.com", "buyer123");
      const buyerToken = await backendToken(page);
      const deniedMailboxResponse = await page.request.get(
        `${BACKEND_URL}/api/notifications/${product.seller.id}`,
        { headers: { Authorization: `Bearer ${buyerToken}` } },
      );
      expect(deniedMailboxResponse.status()).toBe(403);
    } finally {
      const cleanupResponse = await page.request.delete(
        `${BACKEND_URL}/api/notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${sellerToken}` } },
      );
      expect(cleanupResponse.ok()).toBeTruthy();
    }
  });
});

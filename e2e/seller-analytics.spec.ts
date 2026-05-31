import { expect, test, type Page } from "@playwright/test";

const BACKEND_URL = "http://localhost:5000";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

async function backendToken(page: Page) {
  const response = await page.request.get("/api/backend-token");
  expect(response.status()).toBe(200);
  return (await response.json()).token as string;
}

test.describe("Seller analytics", () => {
  test("analytics totals match seller dashboard revenue source", async ({ page }) => {
    const sellerId = "qypV892p0Ly6ernjU6oL3";

    await signIn(page, "admin@tfdtronic.com", "admin123");
    const adminToken = await backendToken(page);
    const headers = { Authorization: `Bearer ${adminToken}` };

    const dashboardResponse = await page.request.get(
      `${BACKEND_URL}/api/seller/dashboard?sellerId=${sellerId}`,
      { headers },
    );
    expect(dashboardResponse.status()).toBe(200);
    const dashboard = await dashboardResponse.json();

    const analyticsResponse = await page.request.get(
      `${BACKEND_URL}/api/seller/analytics/overview?sellerId=${sellerId}`,
      { headers },
    );
    expect(analyticsResponse.status()).toBe(200);
    const analytics = await analyticsResponse.json();

    expect(analytics.totalProducts).toBe(dashboard.totalProducts);
    expect(analytics.totalOrders).toBe(dashboard.totalOrders);
    expect(analytics.totalRevenue).toBe(dashboard.totalRevenue);
    expect(analytics.recentOrders).toBeGreaterThan(0);
    expect(analytics.recentRevenue).toBeGreaterThan(0);
    expect(analytics.orderStatusBreakdown.pending).toBe(dashboard.pendingOrderCount);
    expect(analytics.topProducts.length).toBeGreaterThan(0);
  });

  test("seller analytics page renders non-zero revenue for a seller with orders", async ({ page }) => {
    await signIn(page, "gadget.seller@tfdtronic.com", "password");

    await page.goto("/seller/analytics", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Analytics & Statistics")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Total Orders")).toBeVisible();
    await expect(page.getByText("30-day total")).toBeVisible();
    await expect(page.getByText("Peak day:", { exact: false })).toBeVisible();
    await expect(page.getByText("Best-Selling Products")).toBeVisible();
    await expect(page.getByText("No sales data yet")).toHaveCount(0);
  });
});

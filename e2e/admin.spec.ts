import { test, expect } from '@playwright/test';

test.use({ actionTimeout: 60000, navigationTimeout: 60000 });

test.describe('Admin Flow', () => {
  test('Admin can view and manage sellers', async ({ page }) => {
    // 1. Go to Login page
    await page.goto('/login');
    await page.waitForTimeout(2000);

    // 2. Login as admin
    await page.fill('input[type="email"]', 'admin@tfdtronic.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.waitForTimeout(1000); // Hydration wait
    await page.click('button:has-text("Sign in")');

    // Wait for navigation
    await page.waitForURL('/');

    // 3. Go to Admin Sellers page
    await page.goto('/admin/sellers');
    await expect(page.locator('h1:has-text("Sellers Management")')).toBeVisible();

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });

    // Check if there are any sellers in the list
    const rows = page.locator('tbody tr');
    if (await rows.count() > 0) {
      await expect(rows.first()).toBeVisible();

      // Click on Details for the first seller
      const detailsLink = rows.first().locator('a:has-text("Details")');
      if (await detailsLink.isVisible()) {
        const href = await detailsLink.getAttribute('href');
        await detailsLink.click();

        if (href) {
          await page.waitForURL(href);
          await expect(page.locator('h1')).toContainText('Seller Details');
        }
      }
    }
  });

  test('Admin can view and manage orders', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@tfdtronic.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.waitForTimeout(1000); // Hydration wait
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/');

    // 2. Go to Admin Orders page
    await page.goto('/admin/orders');
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible({ timeout: 15000 });

    // Check if table loads
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
  });

  test('Admin can view users', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@tfdtronic.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.waitForTimeout(1000); // Hydration wait
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/');

    // 2. Go to Admin Users page
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('Users');
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
  });

  test('Admin product area exposes moderation rather than seller catalog controls', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@tfdtronic.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/');

    const tokenResponse = await page.request.get('/api/backend-token');
    expect(tokenResponse.ok()).toBeTruthy();
    const { token } = await tokenResponse.json();
    const authHeaders = { Authorization: `Bearer ${token}` };
    const moderationResponse = await page.request.get('http://localhost:5000/api/products?mode=admin', {
      headers: authHeaders,
    });
    expect(moderationResponse.status()).toBe(200);
    const moderationData = await moderationResponse.json();
    expect(moderationData.products.length).toBeGreaterThan(0);

    const deniedDeleteResponse = await page.request.delete(
      `http://localhost:5000/api/products/${moderationData.products[0].id}`,
      { headers: authHeaders },
    );
    expect(deniedDeleteResponse.status()).toBe(403);

    await page.goto('/admin/products', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await expect(page.getByRole('heading', { name: 'Product Moderation' })).toBeVisible();
    const reviewLink = page.getByRole('link', { name: /Review/ }).first();
    await expect(reviewLink).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: /Add Product/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Delete|Remove/i })).toHaveCount(0);

    await reviewLink.click();
    await expect(page.getByRole('heading', { name: 'Issue compliance warning' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Send warning to seller' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Delete|Remove|Save Changes|Create Product/i })).toHaveCount(0);
  });

  test('Admin dashboard and platform settings are available', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@tfdtronic.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('/');

    const dashboardResponse = await page.request.get('/api/admin/dashboard');
    expect(dashboardResponse.status()).toBe(200);
    const dashboard = await dashboardResponse.json();
    expect(dashboard.stats.totalUsers).toBeGreaterThan(0);
    expect(dashboard.recentOrders).toEqual(expect.any(Array));

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Live platform data')).toBeVisible();

    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Platform Settings' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Marketplace Identity')).toBeVisible();
  });
});

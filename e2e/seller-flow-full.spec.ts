import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

test.describe('Full Seller Flow', () => {
  test.setTimeout(180000);
  const timestamp = Date.now();
  const testEmail = `buyer_to_seller_${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const shopName = `Shop ${timestamp}`;

  test('Complete flow', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Register as buyer
    await page.goto('/register');
    await page.waitForTimeout(2000);
    await page.fill('input[name="name"]', 'New');
    await page.fill('input[name="lastname"]', 'Seller');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmpassword"]', testPassword);
    await page.check('input[name="terms"]');
    await page.waitForTimeout(1000); // Wait for React hydration
    await page.click('button:has-text("Create account")');
    await page.waitForURL(/.*\/login/);

    // 2. Login as buyer
    await page.goto('/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.waitForTimeout(500);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/.*\/profile|.*\/$/, { timeout: 20000 });

    // 3. Become a seller
    await page.goto('/become-seller');
    await page.fill('input[placeholder="e.g. TechStore VN"]', shopName);
    await page.fill('textarea[placeholder="Tell customers about your shop..."]', 'Great Shop');
    await page.fill('input[placeholder="+84 123 456 789"]', '0123456789');
    await page.fill('input[placeholder="Your location"]', 'Hanoi');
    await page.click('button:has-text("Register as a Seller")');
    await page.waitForURL(/.*\/$/, { timeout: 15000 });

    // 4. Admin Flow: Login as admin
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto('/login');
    await adminPage.fill('input[type="email"]', 'admin@tfdtronic.com');
    await adminPage.fill('input[type="password"]', 'admin123');
    await adminPage.waitForTimeout(500);
    await adminPage.click('button:has-text("Sign in")');
    await adminPage.waitForURL(/.*\/profile|.*\/$/, { timeout: 20000 });

    const sessionResponse = await adminPage.request.get('/api/auth/session');
    expect(sessionResponse.status()).toBe(200);
    const session = await sessionResponse.json();
    const adminId = session?.user?.id as string | undefined;
    expect(adminId).toEqual(expect.any(String));

    const tokenResponse = await adminPage.request.get('/api/backend-token');
    expect(tokenResponse.status()).toBe(200);
    const { token } = await tokenResponse.json();

    await adminPage.goto('/notifications', { waitUntil: 'domcontentloaded' });
    await adminPage.fill('input[placeholder="Search notifications..."]', shopName);
    await adminPage.click('button:has-text("Search")');
    await expect(adminPage.getByText('New seller application').first()).toBeVisible({ timeout: 30000 });
    await expect(adminPage.getByText(shopName, { exact: false }).first()).toBeVisible();

    const notificationResponse = await adminPage.request.get(
      `${API_BASE_URL}/api/notifications/${adminId}?type=SYSTEM_ALERT&search=${encodeURIComponent(shopName)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(notificationResponse.status()).toBe(200);
    const notificationBody = await notificationResponse.json();
    const matchingNotification = notificationBody.notifications.find(
      (notification: { id: string; message: string }) => notification.message.includes(shopName),
    );
    expect(matchingNotification).toBeTruthy();

    const cleanupResponse = await adminPage.request.delete(
      `${API_BASE_URL}/api/notifications/${matchingNotification.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(cleanupResponse.status()).toBe(200);

    // 5. Go to admin sellers dashboard
    adminPage.on('console', msg => console.log('ADMIN PAGE CONSOLE:', msg.text()));
    await adminPage.goto('/admin/sellers');
    await expect(adminPage.locator('h1:has-text("Sellers Management")')).toBeVisible({ timeout: 20000 });

    // Wait for table to load
    await expect(adminPage.locator('table')).toBeVisible({ timeout: 10000 });

    // Find the specific seller and click Approve
    const row = adminPage.locator('tr').filter({ hasText: testEmail });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button:has-text("Approve")').click();

    // 6. Wait for status to change to Suspend (reload to see updated status)
    await adminPage.reload();
    await adminPage.waitForTimeout(2000);
    await expect(adminPage.locator('tr').filter({ hasText: testEmail }).locator('button:has-text("Suspend")')).toBeVisible({ timeout: 15000 });
    await adminContext.close();

    // 7. Verify Seller Dashboard access (Session needs refresh or re-login)
    // Clear cookies to simulate logout
    await context.clearCookies();

    // Login as Seller again
    await page.goto('/login');
    await page.waitForTimeout(2000);
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.waitForTimeout(500);
    await page.waitForTimeout(1000);
    const signInBtn = page.locator('button:has-text("Sign in")');
    await signInBtn.click();
    await page.waitForURL(/.*\/profile|.*\/$/, { timeout: 20000 });

    // Verify seller dashboard access
    await page.goto('/seller/dashboard');
    // Expect the greeting header
    await expect(page.locator('h1:has-text("Good morning!")')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('No orders yet')).toBeVisible();
    await expect(page.getByText('View tracking will appear after analytics is enabled.')).toBeVisible();
    await expect(page.getByText('ORD001')).toHaveCount(0);
    await expect(page.getByText('45.200.000')).toHaveCount(0);
    await expect(page.getByText('1,234')).toHaveCount(0);

    await context.close();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const timestamp = Date.now();
  const testPassword = 'Password123!';

  test('Register, Login, and Profile Flow', async ({ page }, testInfo) => {
    const projectSuffix = testInfo.project.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const testEmail = `testuser_${timestamp}_${projectSuffix}@example.com`;
    // 1. Register
    await page.goto('/register');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await page.fill('input[name="name"]', 'Test');
    await page.fill('input[name="lastname"]', 'User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmpassword"]', testPassword);
    await page.check('input[name="terms"]');

    await page.click('button:has-text("Create account")');

    await page.waitForURL(/.*\/login/);

    // 2. Login
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign in")');

    // Wait for successful login (usually redirects to / or /account)
    await page.waitForURL(/.*\/account|.*\/$/);
    await page.waitForLoadState('domcontentloaded');

    // 3. Check Session Persistence
    await page.goto('/account/orders', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('My Orders').first()).toBeVisible();
    expect(page.url()).toContain('/account/orders');

    // 4. Header session state and buyer account actions
    await expect(page.getByRole('link', { name: 'Login', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Register', exact: true })).toHaveCount(0);
    const openAccountControls = async () => {
      const desktopMenuButton = page.getByRole('button', { name: 'Open account menu' });
      if (await desktopMenuButton.isVisible()) {
        await desktopMenuButton.click();
        return true;
      }
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
      return false;
    };
    await openAccountControls();
    await expect(page.getByRole('link', { name: 'My orders', exact: true })).toBeVisible();
    await expect(page.getByText('Become a seller')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

    // 5. Session remains synchronized after browser refresh
    await page.reload();
    await openAccountControls();
    await expect(page.getByText('Become a seller')).toBeVisible();

    // 6. Logout returns header to guest state
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.waitForURL('/');
    await expect(page.getByRole('link', { name: 'Login', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register', exact: true })).toBeVisible();
  });
});

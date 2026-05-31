import { test, expect } from '@playwright/test';

test('Test Registration Only', async ({ page }) => {
  const timestamp = Date.now();
  const testEmail = `buyer_${timestamp}@tfdtronic.com`;
  const password = 'Password123!';

  await page.goto('/register');
    await page.waitForTimeout(2000);
  await page.fill('input[name="name"]', 'Buyer');
  await page.fill('input[name="lastname"]', 'One');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmpassword"]', password);
  await page.check('input[name="terms"]');

  await page.click('button:has-text("Create account")');

  await page.waitForURL(/.*\/login/, { timeout: 10000 });
  console.log("Navigated to /login");
  console.log("Navigated to /login");

  const toastErrors = await page.locator('.go3958317564').allTextContents(); // react-hot-toast class
  console.log('Toast Errors:', toastErrors);

  await page.screenshot({ path: 'test-reg-error.png' });
});

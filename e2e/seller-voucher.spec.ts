import { expect, Page, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/profile', { timeout: 30000 });
}

async function getBackendToken(page: Page) {
  const response = await page.request.get('/api/backend-token');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.token).toEqual(expect.any(String));
  return body.token as string;
}

test.describe('Seller voucher management', () => {
  test('active seller can create and list a voucher from the dashboard UI', async ({ page }) => {
    const code = `E2EVOUCH${Date.now()}`;

    await signIn(page, 'gadget.seller@tfdtronic.com', 'password');

    await page.goto('/seller/dashboard', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /Create Voucher/i }).click();
    await expect(page).toHaveURL(/\/seller\/vouchers$/);

    await page.getByRole('button', { name: /Create Voucher/i }).click();
    await expect(page.getByRole('heading', { name: 'Create New Voucher' })).toBeVisible();

    await page.getByPlaceholder('E.g. SUMMER20').fill(code);
    await page.getByPlaceholder('E.g. Summer 20% Off').fill('E2E Seller Voucher');
    await page.locator('textarea').fill('Automated seller voucher used to verify voucher creation.');
    await page.getByPlaceholder('E.g. 20').fill('10');
    await page.getByPlaceholder('E.g. 100000').nth(0).fill('100000');
    await page.getByPlaceholder('E.g. 100000').nth(1).fill('50000');
    await page.getByPlaceholder('Leave blank = unlimited').fill('3');
    await page.locator('input[type="date"]').fill('2026-12-31');

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.locator('code').filter({ hasText: code })).toBeVisible({ timeout: 30000 });

    const token = await getBackendToken(page);
    const listResponse = await page.request.get(`${API_BASE_URL}/api/seller/vouchers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listResponse.status()).toBe(200);

    const vouchers = await listResponse.json();
    const createdVoucher = vouchers.find((voucher: { id: string; code: string }) => voucher.code === code);
    expect(createdVoucher).toBeTruthy();

    const deleteResponse = await page.request.delete(`${API_BASE_URL}/api/seller/vouchers/${createdVoucher.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([204, 404]).toContain(deleteResponse.status());
  });
});

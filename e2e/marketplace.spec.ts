import { test, expect } from '@playwright/test';

test.describe('Marketplace Flow', () => {
  test('Homepage, Search, and Cart Flow', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();

    const desktopSearchInput = page.getByLabel('Search products');
    const isDesktopSearchVisible = await desktopSearchInput.isVisible();
    if (!isDesktopSearchVisible) {
      await page.getByRole('button', { name: 'Toggle search' }).click();
    }
    const searchInput = isDesktopSearchVisible
      ? desktopSearchInput
      : page.getByPlaceholder('Search electronics...');
    const searchButton = isDesktopSearchVisible
      ? page.getByRole('button', { name: 'Search' })
      : page.getByRole('button', { name: 'Go', exact: true });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Sony');
    await Promise.all([
      page.waitForURL(/\/search\?search=Sony/, { waitUntil: 'domcontentloaded' }),
      searchButton.click(),
    ]);
    await expect(page.getByText(/Search results for/)).toBeVisible();

    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a[href*="/product/"]').first()).toBeVisible({ timeout: 30000 });

    await page.goto('/product/garmin-fenix-7x-pro-solar', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Garmin Fenix 7X Pro Solar').first()).toBeVisible();
    await page.waitForTimeout(1500); // Let session-aware client purchase controls hydrate.
    await Promise.all([
      page.waitForURL(/\/login\?callbackUrl=%2Fproduct%2Fgarmin-fenix-7x-pro-solar/, { waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: 'Add to cart' }).click(),
    ]);
    await expect(page.getByText('Welcome Back')).toBeVisible();

    await page.goto('/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/login\?callbackUrl=%2Fcart|\/login\?callbackUrl=\/cart/, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('Guest product-card cart action routes through login', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/^Test Product/)).toHaveCount(0);
    const addButton = page.getByRole('button', { name: /^Add .+ to cart$/ }).first();
    await expect(addButton).toBeEnabled({ timeout: 30000 });

    await Promise.all([
      page.waitForURL(/\/login\?callbackUrl=%2Fproduct%2F/, { waitUntil: 'domcontentloaded' }),
      addButton.click(),
    ]);
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Seller Flow', () => {
  test('Navigate to Add Product page and create a product', async ({ page }) => { page.on('console', msg => console.log(msg.text())); page.on('pageerror', err => console.log(err.message));
    // 1. Go to Login page
    await page.goto('/login');
    await page.waitForTimeout(2000);

    // 2. Login as a seller
    await page.fill('input[type="email"]', 'gadget.seller@tfdtronic.com');
    await page.fill('input[type="password"]', 'password');
    await page.waitForTimeout(1000); // Hydration wait
    await page.click('button:has-text("Sign in")');

    // Wait for navigation to homepage or dashboard
    await page.waitForURL('/');

    // 3. Go to Seller Products page
    await page.goto('/seller/products');
    await expect(page.locator('h1:has-text("My Products")')).toBeVisible();

    // 4. Click Add Product
    const addProductBtn = page.locator('a:has-text("+ Add Product")');
    await expect(addProductBtn).toBeVisible();
    await page.goto('/seller/products/new');

    // 5. Verify Add Product page
    await expect(page.locator('h1:has-text("Add Product")')).toBeVisible({ timeout: 15000 });

    // 6. Fill out the form
    const randomSuffix = Math.floor(Math.random() * 100000);
    const productTitle = `Test Product ${randomSuffix}`;

    await page.fill('input[name="title"]', productTitle);
    await page.fill('input[name="price"]', '999000');
    await page.fill('input[name="inStock"]', '10');

    // Handle category dropdown
    // Wait for categories to load
    await expect(page.locator('select[name="categoryId"] option').nth(1)).toBeAttached({ timeout: 10000 });
    const categoryOptions = await page.locator('select[name="categoryId"] option').allTextContents();
    if (categoryOptions.length > 1) {
      await page.selectOption('select[name="categoryId"]', { index: 1 });
    }

    await page.fill('input[name="manufacturer"]', 'Test Manufacturer');
    await page.fill('textarea[name="description"]', 'This is a test description.');

    // Submit form
    await page.click('button:has-text("Create Product")');

    // Verify redirection to products list and success toast
    await expect(page.locator('h1:has-text("My Products")')).toBeVisible({ timeout: 15000 });
    const createdProductRow = page.locator('tr').filter({ hasText: productTitle });
    await expect(createdProductRow).toBeVisible();

    // Keep subsequent storefront and checkout tests free of temporary seller listings.
    page.once('dialog', dialog => dialog.accept());
    await createdProductRow.getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('tr').filter({ hasText: productTitle })).toHaveCount(0);
  });
});

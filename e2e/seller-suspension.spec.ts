import { test, expect, Page, type BrowserContext } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/profile', { timeout: 30000 });
}

async function backendToken(page: Page) {
  const response = await page.request.get('/api/backend-token');
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.token as string;
}

test.describe('Seller suspension enforcement', () => {
  test('suspended seller loses seller API access and products cannot be purchased', async ({ browser }) => {
    test.setTimeout(180000);

    const adminContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
    const sellerContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
    const buyerContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
    const adminPage = await adminContext.newPage();
    const sellerPage = await sellerContext.newPage();
    const buyerPage = await buyerContext.newPage();

    let sellerId = '';
    let suspendedLoginContext: BrowserContext | null = null;

    try {
      await signIn(adminPage, 'admin@tfdtronic.com', 'admin123');
      const adminToken = await backendToken(adminPage);

      const productsResponse = await adminPage.request.get(`${API_BASE_URL}/api/products?mode=admin&limit=100`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(productsResponse.status()).toBe(200);
      const productsBody = await productsResponse.json();
      const product = productsBody.products.find(
        (item: { seller?: { id: string; email: string }; status: string; inStock: number }) =>
          item.seller?.email === 'gadget.seller@tfdtronic.com' &&
          item.status === 'PUBLISHED' &&
          item.inStock > 0,
      );
      expect(product).toBeTruthy();
      sellerId = product.seller.id;

      await signIn(sellerPage, 'gadget.seller@tfdtronic.com', 'password');
      const staleSellerToken = await backendToken(sellerPage);
      const sellerProductsBeforeSuspend = await sellerPage.request.get(`${API_BASE_URL}/api/seller/products`, {
        headers: { Authorization: `Bearer ${staleSellerToken}` },
      });
      expect(sellerProductsBeforeSuspend.status()).toBe(200);

      const suspendResponse = await adminPage.request.patch(`${API_BASE_URL}/api/admin/sellers/${sellerId}/suspend`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { reason: 'E2E suspension enforcement check' },
      });
      expect(suspendResponse.status()).toBe(200);

      const sellerProductsAfterSuspend = await sellerPage.request.get(`${API_BASE_URL}/api/seller/products`, {
        headers: { Authorization: `Bearer ${staleSellerToken}` },
      });
      expect(sellerProductsAfterSuspend.status()).toBe(403);
      const sellerProductsAfterSuspendBody = await sellerProductsAfterSuspend.json();
      expect(sellerProductsAfterSuspendBody.code).toBe('SELLER_NOT_ACTIVE');

      const publicProductResponse = await sellerPage.request.get(`${API_BASE_URL}/api/slugs/${product.slug}`);
      expect(publicProductResponse.status()).toBe(404);

      await sellerPage.goto(`/shop/${sellerId}`, { waitUntil: 'domcontentloaded' });
      await expect(sellerPage.getByText(product.title).first()).toHaveCount(0);
      await expect(sellerPage.getByText('No products available')).toBeVisible({ timeout: 30000 });

      await sellerPage.goto('/seller/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(sellerPage.getByText('Shop suspended')).toBeVisible({ timeout: 30000 });
      await sellerPage.getByLabel('Open account menu').click();
      await expect(sellerPage.getByText('Seller status')).toBeVisible({ timeout: 30000 });
      await sellerPage.getByText('Seller status').click();
      await sellerPage.waitForURL(/\/seller\/status/, { timeout: 30000 });
      await expect(sellerPage.getByText('What is restricted')).toBeVisible({ timeout: 30000 });

      suspendedLoginContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
      const suspendedLoginPage = await suspendedLoginContext.newPage();
      await suspendedLoginPage.goto('/seller/dashboard', { waitUntil: 'domcontentloaded' });
      await suspendedLoginPage.waitForURL(/\/login/, { timeout: 30000 });
      await suspendedLoginPage.fill('input[type="email"]', 'gadget.seller@tfdtronic.com');
      await suspendedLoginPage.fill('input[type="password"]', 'password');
      await suspendedLoginPage.click('button:has-text("Sign in")');
      await expect(suspendedLoginPage.getByText('Shop suspended')).toBeVisible({ timeout: 30000 });
      expect(new URL(suspendedLoginPage.url()).pathname).toBe('/seller/status');

      await signIn(buyerPage, 'buyer@tfdtronic.com', 'buyer123');
      const checkoutResponse = await buyerPage.request.post('/api/customer-orders/checkout', {
        data: {
          name: 'Suspension',
          lastname: 'Buyer',
          phone: '0123456789',
          email: 'suspension-buyer@example.com',
          address: '123 Test Street',
          postalCode: '700000',
          city: 'Ho Chi Minh City',
          country: 'Vietnam',
          items: [
            {
              productId: product.id,
              quantity: 1,
              unitPrice: product.price,
              sellerId,
            },
          ],
          paymentMethod: 'COD',
        },
      });
      expect(checkoutResponse.status()).toBe(400);
      const checkoutBody = await checkoutResponse.json();
      expect(checkoutBody.error).toContain('not active');
    } finally {
      if (sellerId) {
        const adminToken = await backendToken(adminPage);
        await adminPage.request.patch(`${API_BASE_URL}/api/admin/sellers/${sellerId}/approve`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }

      await buyerContext.close();
      await sellerContext.close();
      await suspendedLoginContext?.close();
      await adminContext.close();
    }
  });
});

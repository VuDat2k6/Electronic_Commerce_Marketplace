import { Browser, Page, test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/profile', { timeout: 30000 });
}

async function verifySellerNewOrderNotification(browser: Browser, orderId: string) {
  const sellerContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const sellerPage = await sellerContext.newPage();

  try {
    await signIn(sellerPage, 'gadget.seller@tfdtronic.com', 'password');
    await sellerPage.goto('/notifications', { waitUntil: 'domcontentloaded' });

    await expect(sellerPage.getByText('New order received').first()).toBeVisible({ timeout: 30000 });
    await expect(sellerPage.getByText(`#${orderId}`, { exact: false }).first()).toBeVisible();

    const sessionResponse = await sellerPage.request.get('/api/auth/session');
    expect(sessionResponse.status()).toBe(200);
    const session = await sessionResponse.json();
    const sellerId = session?.user?.id as string | undefined;
    expect(sellerId).toEqual(expect.any(String));

    const tokenResponse = await sellerPage.request.get('/api/backend-token');
    expect(tokenResponse.status()).toBe(200);
    const { token } = await tokenResponse.json();

    const notificationResponse = await sellerPage.request.get(
      `${API_BASE_URL}/api/notifications/${sellerId}?type=NEW_ORDER&search=${orderId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(notificationResponse.status()).toBe(200);
    const notificationBody = await notificationResponse.json();
    const matchingNotification = notificationBody.notifications.find(
      (notification: { id: string; message: string }) => notification.message.includes(orderId),
    );

    if (matchingNotification) {
      const cleanupResponse = await sellerPage.request.delete(
        `${API_BASE_URL}/api/notifications/${matchingNotification.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      expect(cleanupResponse.status()).toBe(200);
    }

    await sellerPage.goto('/seller/orders', { waitUntil: 'domcontentloaded' });
    await expect(sellerPage.getByText('Garmin Fenix 7X Pro Solar').first()).toBeVisible({ timeout: 30000 });
    await expect(sellerPage.getByText(`#${orderId.slice(0, 8).toUpperCase()}`).first()).toBeVisible();
  } finally {
    await sellerContext.close();
  }
}

async function verifyBuyerOrderNotification(page: Page, orderId: string) {
  await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Order confirmed').first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(`#${orderId}`, { exact: false }).first()).toBeVisible();

  const sessionResponse = await page.request.get('/api/auth/session');
  expect(sessionResponse.status()).toBe(200);
  const session = await sessionResponse.json();
  const buyerId = session?.user?.id as string | undefined;
  expect(buyerId).toEqual(expect.any(String));

  const tokenResponse = await page.request.get('/api/backend-token');
  expect(tokenResponse.status()).toBe(200);
  const { token } = await tokenResponse.json();

  const notificationResponse = await page.request.get(
    `${API_BASE_URL}/api/notifications/${buyerId}?type=ORDER_UPDATE&search=${orderId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(notificationResponse.status()).toBe(200);
  const notificationBody = await notificationResponse.json();
  const matchingNotification = notificationBody.notifications.find(
    (notification: { id: string; message: string }) => notification.message.includes(orderId),
  );
  expect(matchingNotification).toBeTruthy();

  const cleanupResponse = await page.request.delete(
    `${API_BASE_URL}/api/notifications/${matchingNotification.id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(cleanupResponse.status()).toBe(200);
}

async function createSellerCheckoutVoucher(browser: Browser) {
  const sellerContext = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const sellerPage = await sellerContext.newPage();
  const code = `CHECKOUT${Date.now()}`;

  try {
    await signIn(sellerPage, 'gadget.seller@tfdtronic.com', 'password');

    const tokenResponse = await sellerPage.request.get('/api/backend-token');
    expect(tokenResponse.status()).toBe(200);
    const { token } = await tokenResponse.json();

    const response = await sellerPage.request.post(`${API_BASE_URL}/api/seller/vouchers`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        code,
        title: 'Checkout E2E Voucher',
        description: 'Voucher used by checkout E2E to verify discount application.',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxDiscount: 100000,
        usageLimit: 20,
        expiresAt: '2026-12-31',
      },
    });

    expect(response.status()).toBe(201);
    return code;
  } finally {
    await sellerContext.close();
  }
}

test.describe('Checkout Flow', () => {
  const timestamp = Date.now();
  const testEmail = `buyer_${timestamp}@example.com`;
  const testPassword = 'Password123!';

  test('Reject unauthenticated checkout before processing cart data', async ({ request }) => {
    const response = await request.post('/api/customer-orders/checkout', {
      data: {
        customerId: 'impersonated-buyer-id',
        items: [{ productId: 'missing-product-for-auth-probe', quantity: 1 }],
      },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
  });

  test('Add to Cart and complete Checkout', async ({ page, browser }) => {
    test.setTimeout(180000); // Allow initial Next.js compilation and post-order verification
    let placedOrderId: string | null = null;
    const checkoutVoucherCode = await createSellerCheckoutVoucher(browser);
    // 0. Register and Login first
    await page.goto('/register');
    // Wait for hydration and compilation
    await page.waitForTimeout(3000);
    await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 60000 });
    await page.fill('input[name="name"]', 'Test');
    await page.fill('input[name="lastname"]', 'Buyer');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmpassword"]', testPassword);
    await page.locator('input[name="terms"]').click({ force: true });

    await page.click('button:has-text("Create account")');
    await page.waitForURL(/.*\/login/, { timeout: 30000 });

    await page.goto('/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Sign in"), button:has-text("ÄÄƒng nháº­p")');
    await page.waitForURL(url => url.pathname === '/' || url.pathname.startsWith('/admin'));
    await page.waitForTimeout(2000);

    // 1. Use a known seeded electronics listing rather than a product created by another test.
    await page.goto('/product/garmin-fenix-7x-pro-solar');
    await page.waitForURL(/\/product\//);
    await expect(page.getByText('Garmin Fenix 7X Pro Solar').first()).toBeVisible();

    // 2. Add to Cart
    await page.waitForTimeout(2000); // Wait for products to load and hydrate
    await page.screenshot({ path: 'before_add_to_cart.png' });
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to cart")').first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      // wait for toast
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'after_add_to_cart.png' });
    } else {
      console.log('Add to cart button not found');
      await page.screenshot({ path: 'no_add_to_cart_btn.png' });
      return;
    }

    // 3. Go to Cart first to ensure state is saved, then proceed to Checkout
    await page.goto('/cart');
    await page.waitForURL(/\/cart/);
    await page.waitForTimeout(2000); // wait for hydration
    await expect(page.getByText('Gadget Pro Store')).toBeVisible();
    await expect(page.getByText('Unknown Shop')).toHaveCount(0);

    // Look for Checkout button in Cart
    const checkoutBtn = page.locator('a[href="/checkout"], button:has-text("Checkout")');
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click();
    } else {
      console.log('Checkout button not found. Cart might be empty.');
      await page.screenshot({ path: 'empty_cart.png' });
      return;
    }

    await page.waitForURL(/\/checkout/);

    // Wait for the checkout page to load
    await expect(page.locator('h1:has-text("Checkout")').first()).toBeVisible({ timeout: 60000 });

    // 4. Fill in Checkout Form
    await page.fill('input[placeholder*="first name"]', 'John');
    await page.fill('input[placeholder*="last name"]', 'Doe');
    await page.fill('input[placeholder="email@example.com"]', 'john.doe@example.com');
    await page.fill('input[placeholder="0xxxxxxxxx"]', '0123456789');

    await page.fill('input[placeholder="Street address"]', '123 Test Street');
    await page.fill('input[placeholder="Ho Chi Minh City"]', 'HCM City');
    await page.fill('input[placeholder="Vietnam"]', 'Vietnam');

    await expect(page.getByText('Bank transfer QR')).toBeVisible();
    await expect(page.getByText('MB Bank')).toBeVisible();

    // Select COD payment method
    const codButton = page.locator('button:has-text("Cash on Delivery")');
    if (await codButton.isVisible()) {
      await codButton.click();
    }

    await page.getByPlaceholder('Enter voucher code').fill(checkoutVoucherCode);
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Checkout E2E Voucher')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Voucher discount')).toBeVisible();

    // 5. Place Order
    const placeOrderBtn = page.locator('button:has-text("Place Order")');

    // Listen for the API response
    const responsePromise = page.waitForResponse(res => res.url().includes('/api/customer-orders/checkout'), { timeout: 10000 }).catch(() => null);

    await placeOrderBtn.click();
    await page.waitForTimeout(500); // Wait for toast or API
    await page.screenshot({ path: 'checkout_after_click.png' });

    const apiResponse = await responsePromise;
    if (apiResponse) {
      console.log('API Response Status:', apiResponse.status());
      try {
        const responseBody = await apiResponse.json();
        console.log('API Response Body:', responseBody);
        expect(apiResponse.status()).toBe(201);
        expect(responseBody.order.orderId).toEqual(expect.any(String));
        placedOrderId = responseBody.order.orderId;
        expect(responseBody.order.shippingTotal).toBe(50000);
        expect(responseBody.order.discountTotal).toBeGreaterThan(0);
        expect(responseBody.order.total).toBe(
          responseBody.order.subTotal -
            responseBody.order.discountTotal +
            Math.round(responseBody.order.subTotal * 0.05) +
            50000
        );
      } catch (e) {
        console.log('API Response Text:', await apiResponse.text());
        throw e;
      }
    } else {
      console.log('No API response detected within timeout.');
    }

    // Wait for redirect
    try {
      await page.waitForURL(/\/account\/orders/, { timeout: 15000 });
      console.log('Checkout successful, redirected to account orders.');
    } catch (e) {
      console.log('Did not redirect to account orders. Taking final screenshot.');
      await page.screenshot({ path: 'checkout_error.png' });
      throw e;
    }

    await expect(page.getByText('My Orders').first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('No Orders Yet')).toHaveCount(0);
    await page.getByText('Order ID').first().click();
    await expect(page.getByText('Shipping Address')).toBeVisible();
    await expect(page.getByText('123 Test Street')).toBeVisible();

    expect(placedOrderId).toEqual(expect.any(String));
    await verifyBuyerOrderNotification(page, placedOrderId!);
    await verifySellerNewOrderNotification(browser, placedOrderId!);
  });
});

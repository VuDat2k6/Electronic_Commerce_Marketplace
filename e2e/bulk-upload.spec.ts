import { expect, Page, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:5000';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
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

test.describe('Seller bulk upload', () => {
  test('active seller can upload CSV and validation errors do not crash the batch', async ({ page }) => {
    test.setTimeout(120000);

    await signIn(page, 'gadget.seller@tfdtronic.com', 'password');
    const token = await backendToken(page);
    const suffix = Date.now();
    const csv = [
      'title,price,manufacturer,inStock,mainImage,description,slug,categoryId',
      `"Bulk E2E Laptop ${suffix}",21990000,Lenovo,7,/product_placeholder.jpg,"Bulk upload E2E laptop",bulk-e2e-laptop-${suffix},Laptops`,
      `"Bulk E2E Audio ${suffix}",4990000,Sony,11,/product_placeholder.jpg,"Bulk upload E2E headphones",bulk-e2e-audio-${suffix},Audio`,
      `"Bulk E2E Invalid ${suffix}",abc,Sony,3,/product_placeholder.jpg,"Invalid price row",bulk-e2e-invalid-${suffix},Audio`,
    ].join('\n');

    let batchId = '';
    try {
      const uploadResponse = await page.request.post(`${API_BASE_URL}/api/bulk-upload`, {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
          file: {
            name: `bulk-e2e-${suffix}.csv`,
            mimeType: 'text/csv',
            buffer: Buffer.from(csv),
          },
        },
      });

      expect(uploadResponse.status()).toBe(201);
      const uploadBody = await uploadResponse.json();
      batchId = uploadBody.batchId as string;
      expect(uploadBody.successful).toBe(2);
      expect(uploadBody.errors).toBe(1);
      expect(uploadBody.status).toBe('PARTIAL');

      const detailResponse = await page.request.get(`${API_BASE_URL}/api/bulk-upload/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(detailResponse.status()).toBe(200);
      const detailBody = await detailResponse.json();
      expect(detailBody.items.filter((item: { status: string }) => item.status === 'CREATED')).toHaveLength(2);
      expect(detailBody.items.filter((item: { status: string }) => item.status === 'ERROR')).toHaveLength(1);
    } finally {
      if (batchId) {
        const deleteResponse = await page.request.delete(`${API_BASE_URL}/api/bulk-upload/${batchId}?deleteProducts=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        expect([200, 404]).toContain(deleteResponse.status());
      }
    }
  });
});

import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/shop',
  '/cart',
  '/login',
  '/register',
  '/become-seller',
];

test.describe('Automated Issue Scanner', () => {
  for (const route of ROUTES) {
    test(`Scan route: ${route}`, async ({ page }) => {
      const errors: string[] = [];
      const failedRequests: string[] = [];

      // Capture console errors
      page.on('pageerror', (err) => {
        errors.push(`Page error: ${err.message}`);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(`Console error: ${msg.text()}`);
        }
      });

      // Capture failed network requests
      page.on('response', (response) => {
        if (response.status() >= 400 && response.status() !== 404) {
          failedRequests.push(`Failed request: ${response.url()} (${response.status()})`);
        }
      });

      // Navigate to the route
      await page.goto(route);

      // Wait for network to be idle
      await page.waitForLoadState('networkidle');

      // Check if there are any errors
      if (errors.length > 0) {
        console.log(`\nErrors on ${route}:`);
        errors.forEach((e) => console.log(e));
      }

      if (failedRequests.length > 0) {
        console.log(`\nFailed requests on ${route}:`);
        failedRequests.forEach((e) => console.log(e));
      }

      // Basic visual check: Ensure the page has a body and is not a 404 page if it's supposed to exist
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('404 - Page Not Found'); // Assuming Next.js default 404
    });
  }
});

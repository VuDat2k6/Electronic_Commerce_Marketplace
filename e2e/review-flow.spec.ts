import { test, expect } from "@playwright/test";

test.use({ actionTimeout: 120000, navigationTimeout: 120000 });

test.describe("Comprehensive Review Flow", () => {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const buyer1Email = `buyer1_${randomSuffix}@example.com`;
  const buyer2Email = `buyer2_${randomSuffix}@example.com`;
  const sellerEmail = "seller@example.com";
  const password = "Password123!";
  const reviewComment = `Amazing product, works perfectly! ID: ${Math.floor(Math.random() * 100000)}`;

  test("E2E Review Flow: Buy, Review, View as Other Buyer, View as Seller", async ({
    page,
    browser,
  }) => {
    test.setTimeout(300000); // 5 minutes for this comprehensive flow

    const productSearchTerm = "Garmin"; // Using an existing product for test

    // ==========================================
    // STEP 1: Buyer 1 Registers and Buys Product
    // ==========================================

    // Register Buyer 1
    await page.goto("/register");
    await page.waitForTimeout(3000); // Wait for React Hydration
    await page.waitForSelector('input[name="name"]', { state: "visible" });
    await page.fill('input[name="name"]', "Buyer");
    await page.fill('input[name="lastname"]', "One");
    await page.fill('input[name="email"]', buyer1Email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmpassword"]', password);
    await page.check('input[name="terms"]');
    await page.click('button:has-text("Create account")');
    await page.waitForURL(/.*\/login/);

    // Login Buyer 1
    await page.fill('input[type="email"]', buyer1Email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL("/");

    // Go directly to the product
    await page.goto("/product/garmin-fenix-7x-pro-solar");
    await expect(
      page.locator('h1:has-text("Garmin Fenix 7X Pro Solar")').first(),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("In stock").first()).toBeVisible({
      timeout: 30000,
    });

    // Read detailed reviews (Expect none or some, but tab should work)
    await page.click('button:has-text("Reviews")');
    // Ensure "Write a Review" form is visible
    await expect(page.locator('h3:has-text("Write a Review")')).toBeVisible({
      timeout: 30000,
    });

    // Order it
    await page.click('button:has-text("Add to cart")');
    await page.waitForTimeout(1500); // Wait for toast
    await page.goto("/cart");
    await page.waitForURL(/.*\/cart/);

    // Go to Checkout
    const checkoutBtn = page.locator(
      'a[href="/checkout"], button:has-text("Checkout")',
    );
    await expect(checkoutBtn).toBeVisible({ timeout: 30000 });
    await checkoutBtn.click();
    await page.waitForURL(/.*\/checkout/);

    // Fill Checkout Details
    await page.getByLabel("First Name").fill("Buyer");
    await page.getByLabel("Last Name").fill("One");
    await page.getByLabel("Email").fill(buyer1Email);
    await page.getByLabel("Address").fill("123 Main St");
    await page.getByLabel("City").fill("Tech City");
    await page.getByLabel("Country").fill("Vietnam");
    await page.getByLabel("Postal Code").fill("12345");
    await page.getByLabel("Phone Number").fill("1234567890");
    // Select COD
    await page.click('button:has-text("Cash on Delivery")');

    // Place order
    await page.click('button:has-text("Place Order")');
    await page.waitForURL("/");
    // Add a wait to ensure the order is fully processed in the database
    await page.waitForTimeout(2000);

    // ==========================================
    // STEP 2: Buyer 1 Writes Review
    // ==========================================

    // Go back to the product
    await page.goto("/product/garmin-fenix-7x-pro-solar");
    await expect(
      page.locator('h1:has-text("Garmin Fenix 7X Pro Solar")').first(),
    ).toBeVisible({ timeout: 30000 });

    // Write a review
    await page.click('button:has-text("Reviews")');
    const buyerOneReviewForm = page.locator("form").filter({ hasText: "Rating" });
    await buyerOneReviewForm.locator('button[type="button"]').nth(4).click();
    await buyerOneReviewForm.locator('textarea[id="comment"]').fill(reviewComment);
    const reviewCreationResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/reviews") &&
        response.request().method() === "POST",
    );
    await buyerOneReviewForm.getByRole("button", { name: "Submit Review" }).click();
    expect((await reviewCreationResponse).status()).toBe(201);

    // Verify review is posted
    await expect(page.locator("article").filter({ hasText: reviewComment })).toBeVisible({
      timeout: 10000,
    });

    // Logout
    await page.goto("/api/auth/signout");
    await page.click('button:has-text("Sign out")');

    // ==========================================
    // STEP 3: Buyer 2 Sees Review
    // ==========================================

    // Register Buyer 2
    await page.goto("/register");
    await page.waitForTimeout(3000); // Wait for React Hydration
    await page.waitForSelector('input[name="name"]', { state: "visible" });
    await page.fill('input[name="name"]', "Buyer");
    await page.fill('input[name="lastname"]', "Two");
    await page.fill('input[name="email"]', buyer2Email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmpassword"]', password);
    await page.check('input[name="terms"]');
    await page.click('button:has-text("Create account")');
    await page.waitForURL(/.*\/login/);

    // Login Buyer 2
    await page.goto("/login");
    await page.waitForTimeout(3000); // Wait for React Hydration
    await page.fill('input[type="email"]', buyer2Email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL("/");

    // Check Product Page for Buyer 1's review
    await page.goto("/product/garmin-fenix-7x-pro-solar");
    await expect(
      page.locator('h1:has-text("Garmin Fenix 7X Pro Solar")').first(),
    ).toBeVisible({ timeout: 30000 });
    await page.click('button:has-text("Reviews")');

    // Ensure Buyer 2 sees the review
    await expect(page.locator("article").filter({ hasText: reviewComment })).toBeVisible({
      timeout: 30000,
    });

    // Ensure Buyer 2 CANNOT write a review (since they didn't buy it)
    const buyerTwoReviewForm = page.locator("form").filter({ hasText: "Rating" });
    await buyerTwoReviewForm.locator('button[type="button"]').first().click();
    const rejectedReviewResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/reviews") &&
        response.request().method() === "POST",
    );
    await buyerTwoReviewForm.getByRole("button", { name: "Submit Review" }).click();
    expect((await rejectedReviewResponse).status()).toBe(403);

    // Check for any toast and log its content to help debug
    const toastLocator = page.locator(".go3958317564");
    await toastLocator
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => console.log("No toast found"));
    const toastText = (await toastLocator.isVisible())
      ? await toastLocator.textContent()
      : "";
    console.log("TOAST CONTENT:", toastText);

    // It should either block at frontend or backend
    expect(toastText).toMatch(
      /You must purchase this product before reviewing it\.|Please select a rating/,
    );

    // Logout
    await page.goto("/api/auth/signout");
    await page.click('button:has-text("Sign out")');

    // ==========================================
    // STEP 4: Seller Sees Review in Dashboard
    // ==========================================

    // Login as Seller (we know gadget.seller owns Garmin product, if not this might fail, but let's assume Gadget Seller owns it)
    await page.goto("/login");
    await page.fill('input[type="email"]', "gadget.seller@tfdtronic.com");
    await page.fill('input[type="password"]', "password");
    await page.click('button:has-text("Sign in")');
    await page.waitForURL("/");

    // Go to Seller Reviews
    await page.goto("/seller/reviews");
    await expect(page.locator('h1:has-text("Customer Reviews")')).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator(`text=${reviewComment}`)).toBeVisible({
      timeout: 30000,
    });
  });
});

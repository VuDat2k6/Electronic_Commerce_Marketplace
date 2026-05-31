import { expect, test } from "@playwright/test";

test.describe("Product inventory presentation", () => {
  test("in-stock product displays purchase actions", async ({ page }) => {
    await page.goto("/product/garmin-fenix-7x-pro-solar");

    const productImage = page.getByRole("img", { name: "Garmin Fenix 7X Pro Solar" }).first();
    await expect(productImage).toBeVisible();
    await expect
      .poll(() => productImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
      .toBe(true);
    await expect(page.getByText("In stock").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Now" })).toBeVisible();
  });

  test("out-of-stock product hides quantity and purchase actions", async ({ page }) => {
    await page.goto("/product/samsung-galaxy-s24-ultra-512gb-titanium-black-camera-house");

    await expect(page.getByText("Out of stock").first()).toBeVisible();
    await expect(page.getByText("Quantity:")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add to cart" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Buy Now" })).toHaveCount(0);
  });
});

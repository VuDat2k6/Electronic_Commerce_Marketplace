import { expect, test } from "@playwright/test";

test.describe("Marketplace filters", () => {
  test("desktop filters apply only on command", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "Mobile Chrome", "Desktop sidebar is hidden on mobile.");
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    const initialUrl = page.url();
    const sidebar = page.locator("aside");

    await sidebar.getByText("Out of stock").click();
    expect(page.url()).toBe(initialUrl);

    await sidebar.getByRole("button", { name: "Apply" }).click();
    await page.waitForURL(/outOfStock=false/);
    expect(page.url()).toContain("inStock=true");
  });

  test("mobile filter drawer closes after applying staged filters", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "Mobile Chrome", "Mobile drawer is hidden on desktop.");
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    const initialUrl = page.url();

    await page.getByRole("button", { name: "Filters" }).click();
    const drawer = page.locator("div.fixed").filter({ hasText: "Apply when you are done" });
    await expect(drawer).toBeVisible();
    await drawer.getByText("Out of stock").click();
    expect(page.url()).toBe(initialUrl);

    await drawer.getByRole("button", { name: "Apply" }).click();
    await page.waitForURL(/outOfStock=false/);
    await expect(drawer).toHaveCount(0);
  });
});

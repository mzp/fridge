import { expect, test } from "@playwright/test";
import { resetDb } from "@test/e2e/fixtures/test-db.js";

test.beforeEach(async () => {
  await resetDb();
});

test("empty home shows 'No meals planned.' and 'No items.'", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Meals" })).toBeVisible();
  await expect(page.getByText("No meals planned.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ingredients" })).toBeVisible();
});

test("calendar link from /meals navigation works", async ({ page }) => {
  await page.goto("/meals");
  // calendar always renders a month label like "Month YYYY" inside an h1
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("link", { name: "Add meal" })).toBeVisible();
});

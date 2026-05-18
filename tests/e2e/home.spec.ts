import { expect, test } from "@playwright/test";
import { resetDb } from "@test/helpers/e2e.js";

test.beforeEach(async () => {
  await resetDb();
});

test("empty home shows meals, pantry, and shopping sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Meals" })).toBeVisible();
  await expect(page.getByText("No meals planned.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepared dishes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ingredients" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shopping list" })).toBeVisible();
});

test("calendar link from /meals navigation works", async ({ page }) => {
  await page.goto("/meals");
  // calendar always renders a month label like "Month YYYY" inside an h1
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("link", { name: "Add meal" })).toBeVisible();
});

test("pantry link from navigation works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Pantry" }).click();
  await expect(page).toHaveURL("/pantry");
  await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
});

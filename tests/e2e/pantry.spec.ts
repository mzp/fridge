import { expect, test } from "@playwright/test";
import { resetDb, FUTURE_DATE as STOCK_DATE } from "@test/helpers/e2e.js";

test.beforeEach(async () => {
  await resetDb();
});

test("create pantry item: shows up in pantry under Ingredients", async ({ page }) => {
  await page.goto("/pantry/new");
  await page.getByLabel("Name").fill("卵");
  await page.getByLabel("Quantity").fill("6");
  await page.getByLabel("Unit").fill("個");
  await page.getByLabel("Stock date").fill(STOCK_DATE);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL("/");
  await page.goto("/pantry");
  await expect(page.getByRole("link", { name: "卵" })).toBeVisible();
});

test("edit pantry item: updated quantity is reflected on detail", async ({ page }) => {
  await page.goto("/pantry/new");
  await page.getByLabel("Name").fill("牛乳");
  await page.getByLabel("Quantity").fill("1");
  await page.getByLabel("Unit").fill("L");
  await page.getByLabel("Stock date").fill(STOCK_DATE);
  await page.getByRole("button", { name: "Save" }).click();

  await page.goto("/pantry");
  await page.getByRole("link", { name: "牛乳" }).click();
  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Quantity").fill("2");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/\/pantry\/\d+$/);
  await expect(page.getByText("2L", { exact: true })).toBeVisible();
});

test("delete pantry item: removes it from pantry", async ({ page }) => {
  await page.goto("/pantry/new");
  await page.getByLabel("Name").fill("削除野菜");
  await page.getByLabel("Quantity").fill("3");
  await page.getByLabel("Stock date").fill(STOCK_DATE);
  await page.getByRole("button", { name: "Save" }).click();

  await page.goto("/pantry");
  await page.getByRole("link", { name: "削除野菜" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveURL("/");
  await page.goto("/pantry");
  await expect(page.getByText("削除野菜")).toHaveCount(0);
});

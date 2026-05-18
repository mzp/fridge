import { expect, test } from "@playwright/test";
import { resetDb } from "@test/helpers/e2e.js";

test.beforeEach(async () => {
  await resetDb();
});

test("add to shopping list, then purchase: appears on home as pantry", async ({ page }) => {
  await page.goto("/shopping");
  await page.getByRole("link", { name: "+ Add item" }).click();
  await page.getByLabel("Name").fill("豆腐");
  await page.getByLabel("Quantity").fill("2");
  await page.getByLabel("Unit").fill("丁");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page).toHaveURL("/shopping");
  await expect(page.getByText("豆腐")).toBeVisible();

  await page.getByRole("button", { name: "Purchase" }).click();
  await expect(page).toHaveURL(/\/pantry\/\d+$/);

  await page.goto("/");
  await expect(page.getByRole("link", { name: "豆腐" })).toBeVisible();
});

test("edit shopping item: unit change is reflected on the list", async ({ page }) => {
  await page.goto("/shopping/new");
  await page.getByLabel("Name").fill("玉ねぎ");
  await page.getByLabel("Quantity").fill("1");
  await page.getByLabel("Unit").fill("袋");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("1袋")).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Unit").fill("個");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL("/shopping");
  await expect(page.getByText("1個")).toBeVisible();
});

test("remove from shopping list: disappears", async ({ page }) => {
  await page.goto("/shopping/new");
  await page.getByLabel("Name").fill("削除アイテム");
  await page.getByLabel("Quantity").fill("1");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("削除アイテム")).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).click();

  await expect(page).toHaveURL("/shopping");
  await expect(page.getByText("削除アイテム")).toHaveCount(0);
  await expect(page.getByText("Shopping list is empty.")).toBeVisible();
});

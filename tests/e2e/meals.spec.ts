import { expect, test } from "@playwright/test";
import { FUTURE_DATE, resetDb } from "@test/helpers/e2e.js";

test.beforeEach(async () => {
  await resetDb();
});

test("create meal: appears on home and on calendar", async ({ page }) => {
  await page.goto("/meals/new");
  await page.getByLabel("Date").fill(FUTURE_DATE);
  await page.getByLabel("Main").fill("カレーライス");
  await page.getByLabel("Hot side").fill("きんぴら");
  await page.getByLabel("Soup").fill("味噌汁");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "カレーライス" })).toBeVisible();
  await expect(page.getByText("きんぴら")).toBeVisible();
  await expect(page.getByText("味噌汁")).toBeVisible();

  await page.goto(`/meals?month=${FUTURE_DATE.slice(0, 7)}`);
  await expect(page.getByRole("link", { name: "カレーライス" })).toBeVisible();
});

test("edit meal: updated values show on detail page", async ({ page }) => {
  await page.goto("/meals/new");
  await page.getByLabel("Date").fill(FUTURE_DATE);
  await page.getByLabel("Main").fill("肉じゃが");
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("link", { name: "肉じゃが" }).click();
  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Main").fill("ハンバーグ");
  await page.getByLabel("Soup").fill("味噌汁");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("ハンバーグ")).toBeVisible();
  await expect(page.getByText("味噌汁")).toBeVisible();
});

test("delete meal: removes it from home", async ({ page }) => {
  await page.goto("/meals/new");
  await page.getByLabel("Date").fill(FUTURE_DATE);
  await page.getByLabel("Main").fill("削除予定");
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("link", { name: "削除予定" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("削除予定")).toHaveCount(0);
});

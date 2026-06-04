import { createTestDb } from "@test/helpers/db.js";
import { mountRoute } from "@test/helpers/routes.js";
import { describe, expect, it } from "vitest";
import { meals } from "@/db/schema.js";
import { Meal } from "@/model/meal.js";
import { createMealRoutes } from "@/web/routes/meals.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function createMealApp(db = createTestDb()) {
  return mountRoute("/meals", createMealRoutes(db));
}

describe("GET /meals", () => {
  it("shows current month name", async () => {
    const db = createTestDb();
    const res = await createMealApp(db).request("/meals");
    expect(res.status).toBe(200);
    const html = await res.text();
    const [year, month] = Meal.todayString().split("-").map(Number) as [number, number];
    expect(html).toContain(`${MONTH_NAMES[month - 1]} ${year}`);
  });

  it("shows specified month with ?month param", async () => {
    const db = createTestDb();
    const res = await createMealApp(db).request("/meals?month=2026-03");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("March 2026");
  });

  it("shows the sides and soup in a calendar cell, not just the main", async () => {
    const db = createTestDb();
    db.insert(meals)
      .values({
        date: Meal.todayString(),
        main: "鮭の塩焼き",
        hot_side: "肉じゃが",
        soup: "味噌汁",
      })
      .run();
    const res = await createMealApp(db).request("/meals");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("鮭の塩焼き");
    expect(html).toContain("肉じゃが");
    expect(html).toContain("味噌汁");
  });
});

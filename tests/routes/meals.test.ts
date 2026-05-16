import { createTestDb } from "@test/helpers/db.js";
import { mountRoute } from "@test/helpers/routes.js";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema.js";
import { createMealRoutes } from "@/web/routes/meals.js";

function createMealApp(db = createTestDb()) {
  return mountRoute("/meals", createMealRoutes(db));
}

describe("GET /meals", () => {
  it("shows current month name", async () => {
    const db = createTestDb();
    const res = await createMealApp(db).request("/meals");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("May 2026");
  });

  it("shows specified month with ?month param", async () => {
    const db = createTestDb();
    const res = await createMealApp(db).request("/meals?month=2026-03");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("March 2026");
  });

  it("shows dish name in calendar cell", async () => {
    const db = createTestDb();
    db.insert(schema.meals).values({ date: "2026-05-15", main_dish: "カレーライス" }).run();
    const res = await createMealApp(db).request("/meals?month=2026-05");
    const html = await res.text();
    expect(html).toContain("カレーライス");
  });
});

describe("POST /meals/:id/delete", () => {
  it("deletes the meal and redirects to /", async () => {
    const db = createTestDb();
    const [meal] = db
      .insert(schema.meals)
      .values({ date: "2026-05-15", main_dish: "カレーライス" })
      .returning()
      .all();

    const res = await createMealApp(db).request(`/meals/${meal?.id}/delete`, { method: "POST" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");
    expect(db.select().from(schema.meals).all()).toHaveLength(0);
  });
});

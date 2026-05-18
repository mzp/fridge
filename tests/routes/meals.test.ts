import { createTestDb } from "@test/helpers/db.js";
import { mountRoute } from "@test/helpers/routes.js";
import { describe, expect, it } from "vitest";
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
});

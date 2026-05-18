import { createTestDb } from "@test/helpers/db.js";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema.js";
import { createHomeRoutes } from "@/web/routes/home.js";

function createHomeApp(db = createTestDb()) {
  return createHomeRoutes(db);
}

describe("GET /", () => {
  it("shows past 2 days and future meals, hides older ones", async () => {
    const db = createTestDb();
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

    db.insert(schema.meals)
      .values([
        { date: threeDaysAgo, main_dish: "過去の料理" },
        { date: today, main_dish: "カレーライス", side_dish: "サラダ" },
        { date: tomorrow, main_dish: "肉じゃが" },
      ])
      .run();

    const res = await createHomeApp(db).request("/");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("カレーライス");
    expect(html).toContain("サラダ");
    expect(html).toContain("肉じゃが");
    expect(html).not.toContain("過去の料理");
  });

  it("shows shopping-list rows, all prepared dishes, and only urgent ingredients", async () => {
    const db = createTestDb();
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    db.insert(schema.pantry)
      .values([
        { name: "りんご", quantity: 3, stock_date: null },
        { name: "作り置き", quantity: 1, stock_date: weekAgo, category: "prepared" },
        { name: "期限切れの牛乳", quantity: 1, stock_date: weekAgo, best_before_days: 3 },
        { name: "卵", quantity: 6, unit: "個", stock_date: todayString, best_before_days: 2 },
        { name: "米", quantity: 5, unit: "kg", stock_date: todayString, best_before_days: 30 },
      ])
      .run();

    const html = await (await createHomeApp(db).request("/")).text();
    expect(html).toContain("Prepared dishes");
    expect(html).toContain("作り置き");
    expect(html).toContain("期限切れの牛乳");
    expect(html).toContain("卵");
    expect(html).toContain("Shopping list");
    expect(html).toContain("りんご");
    expect(html).not.toContain("米");
  });
});

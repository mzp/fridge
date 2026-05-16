import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { describe, expect, it } from "vitest";
import type { Db } from "@/db/index.js";
import * as schema from "@/db/schema.js";
import { createApp } from "@/web/app.js";

function createTestDb(): Db {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "db/migrations" });
  return db;
}

describe("GET /meals", () => {
  it("shows current month name", async () => {
    const db = createTestDb();
    const res = await createApp(db).request("/meals");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("May 2026");
  });

  it("shows specified month with ?month param", async () => {
    const db = createTestDb();
    const res = await createApp(db).request("/meals?month=2026-03");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("March 2026");
  });

  it("shows dish name in calendar cell", async () => {
    const db = createTestDb();
    db.insert(schema.meals).values({ date: "2026-05-15", main_dish: "カレーライス" }).run();
    const res = await createApp(db).request("/meals?month=2026-05");
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

    const res = await createApp(db).request(`/meals/${meal?.id}/delete`, { method: "POST" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");
    expect(db.select().from(schema.meals).all()).toHaveLength(0);
  });
});

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

    const res = await createApp(db).request("/");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("カレーライス");
    expect(html).toContain("サラダ");
    expect(html).toContain("肉じゃが");
    expect(html).not.toContain("過去の料理");
  });

  it("shows 'No meals planned.' when there are no upcoming meals", async () => {
    const db = createTestDb();

    const res = await createApp(db).request("/");
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("No meals planned.");
  });

  it("shows pantry items on the top page", async () => {
    const db = createTestDb();
    db.insert(schema.pantry)
      .values({
        name: "卵",
        quantity: 6,
        unit: "個",
        purchased_at: "2026-05-15",
        status: "in_stock",
      })
      .run();

    const res = await createApp(db).request("/");
    const html = await res.text();
    expect(html).toContain("卵");
    expect(html).toContain("No meals planned.");
  });
});

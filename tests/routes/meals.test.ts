import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";
import { createApp } from "@/web/app.js";
import * as schema from "@/db/schema.js";
import type { Db } from "@/db/index.js";

function createTestDb(): Db {
  const sqlite = new Database(":memory:");
  sqlite.exec(
    "CREATE TABLE meals (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, main_dish TEXT NOT NULL, side_dish TEXT)",
  );
  return drizzle(sqlite, { schema });
}

describe("GET /", () => {
  it("shows meals from today onwards", async () => {
    const db = createTestDb();
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    db.insert(schema.meals).values([
      { date: yesterday, main_dish: "過去の料理" },
      { date: today, main_dish: "カレーライス", side_dish: "サラダ" },
      { date: tomorrow, main_dish: "肉じゃが" },
    ]).run();

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
});

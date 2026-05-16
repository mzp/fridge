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

function seedItem(db: Db) {
  return db
    .insert(schema.pantry)
    .values({ name: "卵", quantity: 6, unit: "個", purchased_at: "2026-05-15", status: "in_stock" })
    .returning()
    .get();
}

describe("GET /pantry/new", () => {
  it("shows the new item form", async () => {
    const res = await createApp(createTestDb()).request("/pantry/new");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Add item");
    expect(html).toContain("<form");
  });
});

describe("POST /pantry", () => {
  it("creates a new item and redirects to /", async () => {
    const db = createTestDb();
    const res = await createApp(db).request("/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "name=%E7%89%9B%E4%B9%B3&quantity=2&unit=%E6%9C%AC&purchased_at=2026-05-15&best_before_days=7",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");

    const item = db.select().from(schema.pantry).all();
    expect(item).toHaveLength(1);
    expect(item[0]?.name).toBe("牛乳");
  });
});

describe("GET /pantry/:id", () => {
  it("shows the detail page", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createApp(db).request(`/pantry/${item.id}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("卵");
    expect(html).toContain("Edit");
    expect(html).toContain("Mark as consumed");
  });

  it("returns 404 for unknown id", async () => {
    const res = await createApp(createTestDb()).request("/pantry/999");
    expect(res.status).toBe(404);
  });

  it("shows 'No usage logged yet.' when no logs exist", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createApp(db).request(`/pantry/${item.id}`);
    const html = await res.text();
    expect(html).toContain("No usage logged yet.");
  });

  it("shows usage log entries on the detail page", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    db.insert(schema.pantryLogs)
      .values({ pantry_id: item.id, delta: -2, recorded_at: "2026-05-15", note: "塩焼き" })
      .run();

    const res = await createApp(db).request(`/pantry/${item.id}`);
    const html = await res.text();
    expect(html).toContain("塩焼き");
    expect(html).toContain("2026-05-15");
  });
});

describe("GET /pantry/:id/edit", () => {
  it("shows the edit form prefilled with existing values", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createApp(db).request(`/pantry/${item.id}/edit`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("卵");
    expect(html).toContain(`value="6"`);
  });
});

describe("POST /pantry/:id", () => {
  it("updates the item and redirects to detail page", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createApp(db).request(`/pantry/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `name=%E5%8D%B5&quantity=10&unit=%E5%80%8B&purchased_at=2026-05-15&best_before_days=`,
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`/pantry/${item.id}`);

    const updated = db.select().from(schema.pantry).all();
    expect(updated[0]?.quantity).toBe(10);
  });
});

describe("POST /pantry/:id/consume", () => {
  it("marks the item as consumed and redirects to /", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createApp(db).request(`/pantry/${item.id}/consume`, { method: "POST" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");

    const updated = db.select().from(schema.pantry).all();
    expect(updated[0]?.status).toBe("consumed");
  });
});

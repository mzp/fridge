import { createTestDb } from "@test/helpers/db.js";
import { mountRoute } from "@test/helpers/routes.js";
import { describe, expect, it } from "vitest";
import type { Db } from "@/db/index.js";
import * as schema from "@/db/schema.js";
import { createShoppingRoutes } from "@/web/routes/shopping.js";

function createShoppingApp(db = createTestDb()) {
  return mountRoute("/shopping", createShoppingRoutes(db));
}

function seedShoppingItem(db: Db, name = "りんご", quantity = 3, unit: string | null = null) {
  return db
    .insert(schema.pantry)
    .values({ name, quantity, unit, stock_date: null, status: "in_stock" })
    .returning()
    .get();
}

const TODAY = new Date().toISOString().slice(0, 10);

describe("GET /shopping", () => {
  it("shows an empty state when the list is empty", async () => {
    const res = await createShoppingApp().request("/shopping");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Shopping list is empty.");
  });

  it("lists items with null stock_date and excludes pantry items", async () => {
    const db = createTestDb();
    seedShoppingItem(db, "りんご", 3);
    db.insert(schema.pantry).values({ name: "卵", quantity: 4, stock_date: "2026-05-10" }).run();
    const html = await (await createShoppingApp(db).request("/shopping")).text();
    expect(html).toContain("りんご");
    expect(html).not.toContain("卵");
  });
});

describe("GET /shopping/:id", () => {
  it("shows a shopping item detail with actions", async () => {
    const db = createTestDb();
    const item = seedShoppingItem(db, "豆腐", 2, "丁");
    const html = await (await createShoppingApp(db).request(`/shopping/${item.id}`)).text();
    expect(html).toContain("豆腐");
    expect(html).toContain("2丁");
    expect(html).toContain(`/shopping/${item.id}/edit`);
    expect(html).toContain(`/shopping/${item.id}/purchase`);
    expect(html).toContain(`/shopping/${item.id}/delete`);
  });

  it("returns 404 for pantry items", async () => {
    const db = createTestDb();
    const item = db
      .insert(schema.pantry)
      .values({ name: "卵", quantity: 4, stock_date: "2026-05-10" })
      .returning()
      .get();
    const res = await createShoppingApp(db).request(`/shopping/${item.id}`);
    expect(res.status).toBe(404);
  });
});

describe("POST /shopping/:id", () => {
  it("updates a shopping item and redirects to the detail", async () => {
    const db = createTestDb();
    const item = seedShoppingItem(db, "玉ねぎ", 1, "袋");
    const body = new URLSearchParams({ name: "玉ねぎ", quantity: "2", unit: "個" });
    const res = await createShoppingApp(db).request(`/shopping/${item.id}`, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`/shopping/${item.id}`);

    const updated = db.select().from(schema.pantry).all()[0];
    expect(updated?.quantity).toBe(2);
    expect(updated?.unit).toBe("個");
  });
});

describe("POST /shopping", () => {
  it("creates a shopping item with null stock_date", async () => {
    const db = createTestDb();
    const body = new URLSearchParams({ name: "牛乳", quantity: "2", unit: "本" });
    const res = await createShoppingApp(db).request("/shopping", {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/shopping");

    const rows = db.select().from(schema.pantry).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.stock_date).toBeNull();
    expect(rows[0]?.quantity).toBe(2);
  });

  it("overwrites quantity and unit when the same name already exists", async () => {
    const db = createTestDb();
    seedShoppingItem(db, "玉ねぎ", 1, "袋");
    const body = new URLSearchParams({ name: "玉ねぎ", quantity: "3", unit: "個" });
    await createShoppingApp(db).request("/shopping", {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    const rows = db.select().from(schema.pantry).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.quantity).toBe(3);
    expect(rows[0]?.unit).toBe("個");
  });
});

describe("POST /shopping/:id/purchase", () => {
  it("sets stock_date to today and redirects to the pantry detail", async () => {
    const db = createTestDb();
    const item = seedShoppingItem(db, "豆腐", 2);
    const res = await createShoppingApp(db).request(`/shopping/${item.id}/purchase`, {
      method: "POST",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`/pantry/${item.id}`);

    const updated = db.select().from(schema.pantry).all();
    expect(updated[0]?.stock_date).toBe(TODAY);
  });

  it("merges into an existing pantry row when (name, today) collides", async () => {
    const db = createTestDb();
    const existing = db
      .insert(schema.pantry)
      .values({ name: "卵", quantity: 4, unit: "個", stock_date: TODAY })
      .returning()
      .get();
    const shoppingItem = seedShoppingItem(db, "卵", 6, "個");
    const res = await createShoppingApp(db).request(`/shopping/${shoppingItem.id}/purchase`, {
      method: "POST",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`/pantry/${existing.id}`);

    const rows = db.select().from(schema.pantry).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.quantity).toBe(10);
  });

  it("returns 404 for unknown shopping id", async () => {
    const res = await createShoppingApp().request("/shopping/999/purchase", { method: "POST" });
    expect(res.status).toBe(404);
  });
});

describe("POST /shopping/:id/delete", () => {
  it("removes a shopping item and redirects to /shopping", async () => {
    const db = createTestDb();
    const item = seedShoppingItem(db, "パン", 1);
    const res = await createShoppingApp(db).request(`/shopping/${item.id}/delete`, {
      method: "POST",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/shopping");
    expect(db.select().from(schema.pantry).all()).toHaveLength(0);
  });
});

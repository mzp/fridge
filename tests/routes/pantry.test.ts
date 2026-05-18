import { createTestDb } from "@test/helpers/db.js";
import { mountRoute } from "@test/helpers/routes.js";
import { describe, expect, it } from "vitest";
import type { Db } from "@/db/index.js";
import * as schema from "@/db/schema.js";
import { createPantryRoutes } from "@/web/routes/pantry.js";

function createPantryApp(db = createTestDb()) {
  return mountRoute("/pantry", createPantryRoutes(db));
}

function seedItem(db: Db) {
  return db
    .insert(schema.pantry)
    .values({ name: "卵", quantity: 6, unit: "個", stock_date: "2026-05-15", status: "in_stock" })
    .returning()
    .get();
}

describe("GET /pantry/new", () => {
  it("shows the new item form", async () => {
    const res = await createPantryApp().request("/pantry/new");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Add item");
    expect(html).toContain("<form");
  });
});

describe("GET /pantry/:id", () => {
  it("shows the detail page", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createPantryApp(db).request(`/pantry/${item.id}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("卵");
    expect(html).toContain("Edit");
    expect(html).toContain("Mark as consumed");
  });

  it("returns 404 for unknown id", async () => {
    const res = await createPantryApp().request("/pantry/999");
    expect(res.status).toBe(404);
  });

  it("shows 'No usage logged yet.' when no logs exist", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createPantryApp(db).request(`/pantry/${item.id}`);
    const html = await res.text();
    expect(html).toContain("No usage logged yet.");
  });

  it("shows usage log entries on the detail page", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    db.insert(schema.pantryLogs)
      .values({ pantry_id: item.id, delta: -2, recorded_at: "2026-05-15", note: "塩焼き" })
      .run();

    const res = await createPantryApp(db).request(`/pantry/${item.id}`);
    const html = await res.text();
    expect(html).toContain("塩焼き");
    expect(html).toContain("2026-05-15");
  });
});

describe("GET /pantry/:id/edit", () => {
  it("shows the edit form prefilled with existing values", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createPantryApp(db).request(`/pantry/${item.id}/edit`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("卵");
    expect(html).toContain(`value="6"`);
  });
});

describe("POST /pantry/:id/consume", () => {
  it("marks the item as consumed and redirects to /", async () => {
    const db = createTestDb();
    const item = seedItem(db);
    const res = await createPantryApp(db).request(`/pantry/${item.id}/consume`, {
      method: "POST",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");

    const updated = db.select().from(schema.pantry).all();
    expect(updated[0]?.status).toBe("consumed");
  });
});

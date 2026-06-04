import { createTestDb } from "@test/helpers/db.js";
import { createTestClient } from "@test/helpers/mcp.js";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema.js";
import { registerPantryTools } from "@/mcp/pantry.js";
import { registerShoppingTools } from "@/mcp/shopping.js";

function registerAll(
  server: Parameters<typeof registerShoppingTools>[0],
  db: Parameters<typeof registerShoppingTools>[1],
) {
  registerPantryTools(server, db);
  registerShoppingTools(server, db);
}

const TODAY = new Date().toISOString().slice(0, 10);

// Shopping-list rows have stock_date null, so their expiry fields are
// date-independent and the full payload can be asserted.
function listItem(overrides: Record<string, unknown>) {
  return {
    id: 1,
    name: "x",
    quantity: 1,
    unit: null,
    stock_date: null,
    best_before_days: null,
    status: "in_stock",
    category: "ingredient",
    expiry_status: "none",
    days_remaining: null,
    ...overrides,
  };
}

function pantryNames(result: unknown): string[] {
  return (
    result as { structuredContent: { items: Array<{ name: string }> } }
  ).structuredContent.items.map((i) => i.name);
}

describe("get_shopping_list", () => {
  it("returns an empty list when nothing is queued", async () => {
    const client = await createTestClient(createTestDb(), registerShoppingTools);
    const res = await client.callTool({ name: "get_shopping_list", arguments: {} });
    expect(res.structuredContent).toEqual({ items: [] });
  });

  it("lists only items with null stock_date", async () => {
    const db = createTestDb();
    db.insert(schema.pantry)
      .values([
        { name: "りんご", quantity: 3, stock_date: null },
        { name: "卵", quantity: 6, unit: "個", stock_date: "2026-05-15" },
      ])
      .run();
    const client = await createTestClient(db, registerShoppingTools);
    const res = await client.callTool({ name: "get_shopping_list", arguments: {} });
    expect(res.structuredContent).toEqual({ items: [listItem({ name: "りんご", quantity: 3 })] });
  });
});

describe("add_shopping_item", () => {
  it("inserts a new item with stock_date null", async () => {
    const db = createTestDb();
    const client = await createTestClient(db, registerShoppingTools);
    const res = await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "牛乳", quantity: 1, unit: "本" },
    });
    expect(res.structuredContent).toEqual({
      ok: true,
      action: "created",
      message: "Added 牛乳 on the shopping list.",
      item: listItem({ name: "牛乳", quantity: 1, unit: "本" }),
    });

    const rows = db.select().from(schema.pantry).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.stock_date).toBeNull();
    expect(rows[0]?.best_before_days).toBeNull();
  });

  it("stores best_before_days when supplied", async () => {
    const db = createTestDb();
    const client = await createTestClient(db, registerShoppingTools);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "鶏肉", quantity: 1, unit: "パック", best_before_days: 3 },
    });
    const rows = db.select().from(schema.pantry).all();
    expect(rows[0]?.best_before_days).toBe(3);
  });

  it("overwrites quantity and unit when the same name already exists on the list", async () => {
    const db = createTestDb();
    const client = await createTestClient(db, registerShoppingTools);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "玉ねぎ", quantity: 1, unit: "袋" },
    });
    const res = await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "玉ねぎ", quantity: 1, unit: "個" },
    });
    expect(res.structuredContent).toEqual({
      ok: true,
      action: "updated",
      message: "Updated 玉ねぎ on the shopping list.",
      item: listItem({ name: "玉ねぎ", quantity: 1, unit: "個" }),
    });
  });
});

describe("purchase_shopping_item", () => {
  it("sets stock_date to today and the item appears in get_pantry", async () => {
    const db = createTestDb();
    const client = await createTestClient(db, registerAll);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "豆腐", quantity: 2, unit: "丁" },
    });
    const res = await client.callTool({
      name: "purchase_shopping_item",
      arguments: { id: 1, best_before_days: 5 },
    });
    expect(res.structuredContent).toMatchObject({
      ok: true,
      action: "stocked",
      message: "Purchased 豆腐 and added it to the pantry.",
      freshness_tracked: true,
      item: {
        id: 1,
        name: "豆腐",
        quantity: 2,
        unit: "丁",
        stock_date: TODAY,
        best_before_days: 5,
        status: "in_stock",
      },
    });

    const shopping = await client.callTool({ name: "get_shopping_list", arguments: {} });
    expect(shopping.structuredContent).toEqual({ items: [] });

    const pantry = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(pantryNames(pantry)).toContain("豆腐");
  });

  it("uses stored best_before_days from add_shopping_item", async () => {
    const db = createTestDb();
    const client = await createTestClient(db, registerAll);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "鶏肉", quantity: 1, unit: "パック", best_before_days: 3 },
    });
    await client.callTool({ name: "purchase_shopping_item", arguments: { id: 1 } });

    const rows = db.select().from(schema.pantry).all();
    expect(rows[0]?.stock_date).toBe(TODAY);
    expect(rows[0]?.best_before_days).toBe(3);
    expect(rows[0]?.status).toBe("in_stock");
  });

  it("marks as purchased (no pantry promotion) when best_before_days is unset", async () => {
    const db = createTestDb();
    const client = await createTestClient(db, registerAll);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "醤油", quantity: 1, unit: "本" },
    });
    const res = await client.callTool({
      name: "purchase_shopping_item",
      arguments: { id: 1 },
    });
    expect(res.structuredContent).toMatchObject({
      ok: true,
      action: "purchased",
      message: "Purchased 醤油 (no freshness tracking).",
      freshness_tracked: false,
      item: { id: 1, name: "醤油", stock_date: null, status: "purchased" },
    });

    const rows = db.select().from(schema.pantry).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.stock_date).toBeNull();
    expect(rows[0]?.status).toBe("purchased");

    const shopping = await client.callTool({ name: "get_shopping_list", arguments: {} });
    expect(shopping.structuredContent).toEqual({ items: [] });

    const pantry = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(pantry.structuredContent).toEqual({ items: [] });
  });

  it("merges with an existing pantry row when name + today collide", async () => {
    const db = createTestDb();
    db.insert(schema.pantry)
      .values({ name: "卵", quantity: 4, unit: "個", stock_date: TODAY })
      .run();
    const client = await createTestClient(db, registerShoppingTools);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "卵", quantity: 6, unit: "個", best_before_days: 7 },
    });
    await client.callTool({
      name: "purchase_shopping_item",
      arguments: { id: 2 },
    });

    const rows = db.select().from(schema.pantry).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.quantity).toBe(10);
    expect(rows[0]?.stock_date).toBe(TODAY);
  });

  it("returns not found for unknown id", async () => {
    const client = await createTestClient(createTestDb(), registerShoppingTools);
    const res = await client.callTool({
      name: "purchase_shopping_item",
      arguments: { id: 999 },
    });
    expect(res.structuredContent).toEqual({
      ok: false,
      action: "not_found",
      message: "Shopping item #999 not found.",
      freshness_tracked: false,
      item: null,
    });
  });

  it("refuses to purchase a pantry item (not in shopping list)", async () => {
    const db = createTestDb();
    const inserted = db
      .insert(schema.pantry)
      .values({ name: "卵", quantity: 4, stock_date: "2026-05-10" })
      .returning()
      .get();
    const client = await createTestClient(db, registerShoppingTools);
    const res = await client.callTool({
      name: "purchase_shopping_item",
      arguments: { id: inserted.id },
    });
    expect(res.structuredContent).toEqual({
      ok: false,
      action: "not_found",
      message: `Shopping item #${inserted.id} not found.`,
      freshness_tracked: false,
      item: null,
    });
  });
});

describe("remove_shopping_item", () => {
  it("removes an item from the shopping list", async () => {
    const db = createTestDb();
    const client = await createTestClient(db, registerShoppingTools);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "パン", quantity: 1 },
    });
    const res = await client.callTool({
      name: "remove_shopping_item",
      arguments: { id: 1 },
    });
    expect(res.structuredContent).toEqual({
      ok: true,
      action: "removed",
      message: "Removed パン from the shopping list.",
      id: 1,
      name: "パン",
    });
    expect(db.select().from(schema.pantry).all()).toHaveLength(0);
  });

  it("refuses to remove a pantry item", async () => {
    const db = createTestDb();
    const inserted = db
      .insert(schema.pantry)
      .values({ name: "卵", quantity: 4, stock_date: "2026-05-10" })
      .returning()
      .get();
    const client = await createTestClient(db, registerShoppingTools);
    const res = await client.callTool({
      name: "remove_shopping_item",
      arguments: { id: inserted.id },
    });
    expect(res.structuredContent).toEqual({
      ok: false,
      action: "not_found",
      message: `Shopping item #${inserted.id} not found.`,
      id: inserted.id,
      name: null,
    });
    expect(db.select().from(schema.pantry).all()).toHaveLength(1);
  });
});

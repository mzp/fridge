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

describe("get_shopping_list", () => {
  it("returns empty message when list is empty", async () => {
    const client = await createTestClient(createTestDb(), registerShoppingTools);
    const res = await client.callTool({ name: "get_shopping_list", arguments: {} });
    expect(res.content).toEqual([{ type: "text", text: "Shopping list is empty." }]);
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
    expect(res.content).toEqual([{ type: "text", text: "[1] りんご x3" }]);
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
    expect(res.content).toEqual([{ type: "text", text: "Added: [1] 牛乳 x1本" }]);

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
    expect(res.content).toEqual([{ type: "text", text: "Updated: [1] 玉ねぎ x1個" }]);
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
    expect(res.content).toEqual([
      {
        type: "text",
        text: `Purchased: [1] 豆腐 x2丁 (stocked: ${TODAY}, best before: 5d)`,
      },
    ]);

    const shopping = await client.callTool({ name: "get_shopping_list", arguments: {} });
    expect(shopping.content).toEqual([{ type: "text", text: "Shopping list is empty." }]);

    const pantry = await client.callTool({ name: "get_pantry", arguments: {} });
    expect((pantry.content as Array<{ text: string }>)[0]?.text).toContain("豆腐 x2丁");
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
    expect(res.content).toEqual([
      { type: "text", text: "Purchased: [1] 醤油 (no freshness tracking)" },
    ]);

    const rows = db.select().from(schema.pantry).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.stock_date).toBeNull();
    expect(rows[0]?.status).toBe("purchased");

    const shopping = await client.callTool({ name: "get_shopping_list", arguments: {} });
    expect(shopping.content).toEqual([{ type: "text", text: "Shopping list is empty." }]);

    const pantry = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(pantry.content).toEqual([{ type: "text", text: "No items in stock." }]);
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
    expect(res.content).toEqual([{ type: "text", text: "Shopping item #999 not found." }]);
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
    expect(res.content).toEqual([
      { type: "text", text: `Shopping item #${inserted.id} not found.` },
    ]);
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
    expect(res.content).toEqual([{ type: "text", text: "Removed: [1] パン" }]);
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
    expect(res.content).toEqual([
      { type: "text", text: `Shopping item #${inserted.id} not found.` },
    ]);
    expect(db.select().from(schema.pantry).all()).toHaveLength(1);
  });
});

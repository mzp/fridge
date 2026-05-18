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
  });

  it("increases quantity when the same name already exists on the list", async () => {
    const db = createTestDb();
    const client = await createTestClient(db, registerShoppingTools);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "りんご", quantity: 2 },
    });
    const res = await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "りんご", quantity: 3 },
    });
    expect(res.content).toEqual([{ type: "text", text: "Increased: [1] りんご x5" }]);
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

  it("merges with an existing pantry row when name + today collide", async () => {
    const db = createTestDb();
    db.insert(schema.pantry)
      .values({ name: "卵", quantity: 4, unit: "個", stock_date: TODAY })
      .run();
    const client = await createTestClient(db, registerShoppingTools);
    await client.callTool({
      name: "add_shopping_item",
      arguments: { name: "卵", quantity: 6, unit: "個" },
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

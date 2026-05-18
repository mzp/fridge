import { createTestDb } from "@test/helpers/db.js";
import { createTestClient } from "@test/helpers/mcp.js";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema.js";
import { registerPantryTools } from "@/mcp/pantry.js";

describe("set_pantry_item", () => {
  it("adds a new item and reads it back via get_pantry", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    const added = await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "卵", quantity: 6, unit: "個", stock_date: "2026-05-15" },
    });
    expect(added.content).toEqual([
      { type: "text", text: "Added: [1] 卵 x6個 (stocked: 2026-05-15)" },
    ]);

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content).toEqual([
      { type: "text", text: "[ingredient]\n[1] 卵 x6個 (stocked: 2026-05-15)" },
    ]);
  });

  it("updates an existing item (same name, same stock_date)", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "牛乳", quantity: 1, stock_date: "2026-05-15" },
    });
    const updated = await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "牛乳", quantity: 2, stock_date: "2026-05-15" },
    });
    expect(updated.content).toEqual([
      { type: "text", text: "Updated: [1] 牛乳 x2 (stocked: 2026-05-15)" },
    ]);
  });

  it("excludes shopping-list entries (stock_date is null) from get_pantry", async () => {
    const db = createTestDb();
    db.insert(schema.pantry)
      .values([
        { name: "りんご", quantity: 3, stock_date: null },
        { name: "卵", quantity: 6, unit: "個", stock_date: "2026-05-15" },
      ])
      .run();
    const client = await createTestClient(db, registerPantryTools);

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    const text = (list.content as Array<{ text: string }>)[0]?.text ?? "";
    expect(text).toContain("卵 x6個");
    expect(text).not.toContain("りんご");
  });

  it("treats same name with different stock_date as separate batches", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "鮭", quantity: 5, unit: "切れ", stock_date: "2026-05-10" },
    });
    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "鮭", quantity: 3, unit: "切れ", stock_date: "2026-05-18" },
    });

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    const text = (list.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
    expect(text).toContain("鮭 x5切れ (stocked: 2026-05-10)");
    expect(text).toContain("鮭 x3切れ (stocked: 2026-05-18)");
  });
});

describe("use_pantry_item", () => {
  it("decrements quantity and logs usage", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "卵", quantity: 6, unit: "個", stock_date: "2026-05-15" },
    });
    const result = await client.callTool({
      name: "use_pantry_item",
      arguments: { id: 1, quantity_used: 2, note: "スクランブルエッグ" },
    });
    expect(result.content).toEqual([{ type: "text", text: "Used 2個 of 卵. Remaining: 4個." }]);

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content).toEqual([
      { type: "text", text: "[ingredient]\n[1] 卵 x4個 (stocked: 2026-05-15)" },
    ]);
  });

  it("marks item as consumed when all quantity is used", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "卵", quantity: 2, stock_date: "2026-05-15" },
    });
    const result = await client.callTool({
      name: "use_pantry_item",
      arguments: { id: 1, quantity_used: 2 },
    });
    expect(result.content).toEqual([
      { type: "text", text: "Used 2 of 卵. Remaining: 0. Marked as consumed." },
    ]);

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content).toEqual([{ type: "text", text: "No items in stock." }]);
  });

  it("uses all remaining stock when use_all is true", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "牛乳", quantity: 3, unit: "本", stock_date: "2026-05-15" },
    });
    const result = await client.callTool({
      name: "use_pantry_item",
      arguments: { id: 1, use_all: true, note: "飲み切り" },
    });
    expect(result.content).toEqual([
      { type: "text", text: "Used 3本 of 牛乳. Remaining: 0本. Marked as consumed." },
    ]);

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content).toEqual([{ type: "text", text: "No items in stock." }]);
  });

  it("returns not found for unknown ID", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    const result = await client.callTool({
      name: "use_pantry_item",
      arguments: { id: 999, quantity_used: 1 },
    });
    expect(result.content).toEqual([{ type: "text", text: "Item #999 not found." }]);
  });
});

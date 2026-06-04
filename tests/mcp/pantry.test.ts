import { createTestDb } from "@test/helpers/db.js";
import { createTestClient } from "@test/helpers/mcp.js";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema.js";
import { registerPantryTools } from "@/mcp/pantry.js";

// A pantry item with no best_before_days has deterministic (date-independent)
// expiry fields, so tests can assert the full structured payload.
function item(overrides: Record<string, unknown>) {
  return {
    id: 1,
    name: "卵",
    quantity: 6,
    unit: "個",
    stock_date: "2026-05-15",
    best_before_days: null,
    status: "in_stock",
    category: "ingredient",
    expiry_status: "none",
    days_remaining: null,
    ...overrides,
  };
}

describe("set_pantry_item", () => {
  it("adds a new item and reads it back via get_pantry", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    const added = await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "卵", quantity: 6, unit: "個", stock_date: "2026-05-15" },
    });
    expect(added.structuredContent).toEqual({
      ok: true,
      action: "created",
      message: "Added 卵 (2026-05-15).",
      item: item({}),
    });

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.structuredContent).toEqual({ items: [item({})] });
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
    expect(updated.structuredContent).toEqual({
      ok: true,
      action: "updated",
      message: "Updated 牛乳 (2026-05-15).",
      item: item({ name: "牛乳", quantity: 2, unit: null }),
    });
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
    const names = (list.structuredContent as { items: Array<{ name: string }> }).items.map(
      (i) => i.name,
    );
    expect(names).toEqual(["卵"]);
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
    expect(list.structuredContent).toEqual({
      items: [
        item({ id: 1, name: "鮭", quantity: 5, unit: "切れ", stock_date: "2026-05-10" }),
        item({ id: 2, name: "鮭", quantity: 3, unit: "切れ", stock_date: "2026-05-18" }),
      ],
    });
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
    expect(result.structuredContent).toEqual({
      ok: true,
      action: "used",
      message: "Used 2個 of 卵. Remaining: 4個.",
      id: 1,
      name: "卵",
      used: 2,
      remaining: 4,
      unit: "個",
      consumed: false,
    });

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.structuredContent).toEqual({ items: [item({ quantity: 4 })] });
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
    expect(result.structuredContent).toEqual({
      ok: true,
      action: "used",
      message: "Used 2 of 卵. Remaining: 0. Marked as consumed.",
      id: 1,
      name: "卵",
      used: 2,
      remaining: 0,
      unit: null,
      consumed: true,
    });

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.structuredContent).toEqual({ items: [] });
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
    expect(result.structuredContent).toEqual({
      ok: true,
      action: "used",
      message: "Used 3本 of 牛乳. Remaining: 0本. Marked as consumed.",
      id: 1,
      name: "牛乳",
      used: 3,
      remaining: 0,
      unit: "本",
      consumed: true,
    });

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.structuredContent).toEqual({ items: [] });
  });

  it("returns not found for unknown ID", async () => {
    const client = await createTestClient(createTestDb(), registerPantryTools);

    const result = await client.callTool({
      name: "use_pantry_item",
      arguments: { id: 999, quantity_used: 1 },
    });
    expect(result.structuredContent).toEqual({
      ok: false,
      action: "not_found",
      message: "Item #999 not found.",
      id: 999,
      name: null,
      used: 0,
      remaining: 0,
      unit: null,
      consumed: false,
    });
  });
});

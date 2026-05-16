import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { describe, expect, it } from "vitest";
import type { Db } from "@/db/index.js";
import * as schema from "@/db/schema.js";
import { registerPantryTools } from "@/mcp/pantry.js";

function createTestDb(): Db {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "db/migrations" });
  return db;
}

async function createTestClient(db: Db) {
  const server = new McpServer({ name: "fridge-test", version: "0.0.0" });
  registerPantryTools(server, db);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

describe("set_pantry_item", () => {
  it("adds a new item and reads it back via get_pantry", async () => {
    const client = await createTestClient(createTestDb());

    const added = await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "卵", quantity: 6, unit: "個", purchased_at: "2026-05-15" },
    });
    expect(added.content).toEqual([
      { type: "text", text: "Added: [1] 卵 x6個 (purchased: 2026-05-15)" },
    ]);

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content).toEqual([{ type: "text", text: "[1] 卵 x6個 (purchased: 2026-05-15)" }]);
  });

  it("updates an existing item (same name, same purchased_at)", async () => {
    const client = await createTestClient(createTestDb());

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "牛乳", quantity: 1, purchased_at: "2026-05-15" },
    });
    const updated = await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "牛乳", quantity: 2, purchased_at: "2026-05-15" },
    });
    expect(updated.content).toEqual([
      { type: "text", text: "Updated: [1] 牛乳 x2 (purchased: 2026-05-15)" },
    ]);
  });

  it("treats same name with different purchased_at as separate batches", async () => {
    const client = await createTestClient(createTestDb());

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "鮭", quantity: 5, unit: "切れ", purchased_at: "2026-05-10" },
    });
    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "鮭", quantity: 3, unit: "切れ", purchased_at: "2026-05-18" },
    });

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content[0]?.text).toContain("鮭 x5切れ (purchased: 2026-05-10)");
    expect(list.content[0]?.text).toContain("鮭 x3切れ (purchased: 2026-05-18)");
  });
});

describe("use_pantry_item", () => {
  it("decrements quantity and logs usage", async () => {
    const client = await createTestClient(createTestDb());

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "卵", quantity: 6, unit: "個", purchased_at: "2026-05-15" },
    });
    const result = await client.callTool({
      name: "use_pantry_item",
      arguments: { id: 1, quantity_used: 2, note: "スクランブルエッグ" },
    });
    expect(result.content).toEqual([{ type: "text", text: "Used 2個 of 卵. Remaining: 4個." }]);

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content).toEqual([{ type: "text", text: "[1] 卵 x4個 (purchased: 2026-05-15)" }]);
  });

  it("marks item as consumed when all quantity is used", async () => {
    const client = await createTestClient(createTestDb());

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "卵", quantity: 2, purchased_at: "2026-05-15" },
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
    const client = await createTestClient(createTestDb());

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "牛乳", quantity: 3, unit: "本", purchased_at: "2026-05-15" },
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
    const client = await createTestClient(createTestDb());

    const result = await client.callTool({
      name: "use_pantry_item",
      arguments: { id: 999, quantity_used: 1 },
    });
    expect(result.content).toEqual([{ type: "text", text: "Item #999 not found." }]);
  });
});

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
      { type: "text", text: "Added: 卵 x6個 (purchased: 2026-05-15)" },
    ]);

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content).toEqual([{ type: "text", text: "卵 x6個 (purchased: 2026-05-15)" }]);
  });

  it("overwrites an existing item", async () => {
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
      { type: "text", text: "Updated: 牛乳 x2 (purchased: 2026-05-15)" },
    ]);
  });
});

describe("consume_pantry_item", () => {
  it("removes item from get_pantry after consuming", async () => {
    const client = await createTestClient(createTestDb());

    await client.callTool({
      name: "set_pantry_item",
      arguments: { name: "卵", quantity: 6, purchased_at: "2026-05-15" },
    });
    await client.callTool({ name: "consume_pantry_item", arguments: { name: "卵" } });

    const list = await client.callTool({ name: "get_pantry", arguments: {} });
    expect(list.content).toEqual([{ type: "text", text: "No items in stock." }]);
  });

  it("returns not found for unknown item", async () => {
    const client = await createTestClient(createTestDb());

    const result = await client.callTool({
      name: "consume_pantry_item",
      arguments: { name: "存在しない食材" },
    });
    expect(result.content).toEqual([{ type: "text", text: 'Item "存在しない食材" not found.' }]);
  });
});

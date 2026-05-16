import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { describe, expect, it } from "vitest";
import type { Db } from "@/db/index.js";
import * as schema from "@/db/schema.js";
import { registerMealTools } from "@/mcp/meals.js";

function createTestDb(): Db {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "db/migrations" });
  return db;
}

async function createTestClient(db: Db) {
  const server = new McpServer({ name: "fridge-test", version: "0.0.0" });
  registerMealTools(server, db);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);

  return client;
}

describe("get_meals", () => {
  it("returns meals set via set_meal within the date range", async () => {
    const client = await createTestClient(createTestDb());

    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "カレーライス" },
    });
    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-16", main_dish: "肉じゃが", side_dish: "ほうれん草のおひたし" },
    });
    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-17", main_dish: "鮭の塩焼き" },
    });

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-16" },
    });

    expect(result.content).toEqual([
      {
        type: "text",
        text: "2026-05-15: カレーライス\n2026-05-16: 肉じゃが | ほうれん草のおひたし",
      },
    ]);
  });

  it("returns no meals message when range has no meals", async () => {
    const client = await createTestClient(createTestDb());

    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "カレーライス" },
    });

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-01-01", to: "2026-01-31" },
    });

    expect(result.content).toEqual([
      {
        type: "text",
        text: "No meals found for the specified date range.",
      },
    ]);
  });

  it("reflects overwrites made via set_meal", async () => {
    const client = await createTestClient(createTestDb());

    const added = await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "カレーライス" },
    });
    expect(added.content).toEqual([{ type: "text", text: "Added meal: 2026-05-15: カレーライス" }]);

    const updated = await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "ビーフカレー", side_dish: "サラダ" },
    });
    expect(updated.content).toEqual([
      { type: "text", text: "Updated meal: 2026-05-15: ビーフカレー | サラダ" },
    ]);

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-15" },
    });

    expect(result.content).toEqual([{ type: "text", text: "2026-05-15: ビーフカレー | サラダ" }]);
  });
});

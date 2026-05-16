import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/index.js";
import * as schema from "@/db/schema.js";
import { meals } from "@/db/schema.js";
import { registerMealTools } from "@/mcp/meals.js";

function createTestDb(): Db {
  const sqlite = new Database(":memory:");
  sqlite.exec(
    "CREATE TABLE meals (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, name TEXT NOT NULL)",
  );
  return drizzle(sqlite, { schema });
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
  let db: Db;
  let client: Client;

  beforeEach(async () => {
    db = createTestDb();
    db.insert(meals)
      .values([
        { date: "2026-05-15", name: "カレーライス" },
        { date: "2026-05-16", name: "肉じゃが" },
        { date: "2026-05-17", name: "鮭の塩焼き" },
      ])
      .run();
    client = await createTestClient(db);
  });

  it("returns meals within the date range", async () => {
    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-16" },
    });

    expect(result.content).toEqual([
      {
        type: "text",
        text: "2026-05-15: カレーライス\n2026-05-16: 肉じゃが",
      },
    ]);
  });

  it("returns no meals message when range has no meals", async () => {
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
});

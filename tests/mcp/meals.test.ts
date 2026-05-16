import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it } from "vitest";
import { registerMealTools } from "@/mcp/meals.js";

async function createTestClient() {
  const server = new McpServer({ name: "fridge-test", version: "0.0.0" });
  registerMealTools(server);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);

  return client;
}

describe("get_meals", () => {
  let client: Client;

  beforeEach(async () => {
    client = await createTestClient();
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

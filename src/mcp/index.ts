import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { db } from "@/db/index.js";
import { runMigrations } from "@/db/migrate.js";
import { registerMealTools } from "@/mcp/meals.js";
import { registerPantryTools } from "@/mcp/pantry.js";
import { registerShoppingTools } from "@/mcp/shopping.js";

runMigrations();

const server = new McpServer({
  name: "fridge",
  version: "1.0.0",
});

registerMealTools(server, db);
registerPantryTools(server, db);
registerShoppingTools(server, db);

const transport = new StdioServerTransport();
await server.connect(transport);

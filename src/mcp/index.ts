import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { db } from "@/db/index.js";
import { registerMealTools } from "@/mcp/meals.js";
import { registerPantryTools } from "@/mcp/pantry.js";
import { registerShoppingTools } from "@/mcp/shopping.js";

const server = new McpServer({
  name: "fridge",
  version: "1.0.0",
});

registerMealTools(server, db);
registerPantryTools(server, db);
registerShoppingTools(server, db);

const transport = new StdioServerTransport();
await server.connect(transport);

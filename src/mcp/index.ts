import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMealTools } from "./meals.js";

const server = new McpServer({
  name: "fridge",
  version: "1.0.0",
});

registerMealTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);

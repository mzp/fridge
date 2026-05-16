import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const meals = [
  { date: "2026-05-15", name: "カレーライス" },
  { date: "2026-05-16", name: "肉じゃが" },
  { date: "2026-05-17", name: "鮭の塩焼き" },
];

export function registerMealTools(server: McpServer) {
  server.tool(
    "get_meals",
    "Get the list of planned meals for a given date range",
    {
      from: z.string().date().describe("Start date (YYYY-MM-DD)"),
      to: z.string().date().describe("End date (YYYY-MM-DD)"),
    },
    ({ from, to }) => {
      const results = meals.filter((m) => m.date >= from && m.date <= to);
      return {
        content: [
          {
            type: "text",
            text:
              results.length > 0
                ? results.map((m) => `${m.date}: ${m.name}`).join("\n")
                : "No meals found for the specified date range.",
          },
        ],
      };
    },
  );
}

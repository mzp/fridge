import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/index.js";
import { meals } from "../db/schema.js";

export function registerMealTools(server: McpServer, db: Db) {
  server.tool(
    "get_meals",
    "Get the list of planned meals for a given date range",
    {
      from: z.string().date().describe("Start date (YYYY-MM-DD)"),
      to: z.string().date().describe("End date (YYYY-MM-DD)"),
    },
    ({ from, to }) => {
      const results = db
        .select()
        .from(meals)
        .where(and(gte(meals.date, from), lte(meals.date, to)))
        .all();

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

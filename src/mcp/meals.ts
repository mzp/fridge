import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/index.js";
import { meals } from "../db/schema.js";

function formatMeal(m: { date: string; main_dish: string; side_dish: string | null }): string {
  return m.side_dish ? `${m.date}: ${m.main_dish} | ${m.side_dish}` : `${m.date}: ${m.main_dish}`;
}

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
                ? results.map(formatMeal).join("\n")
                : "No meals found for the specified date range.",
          },
        ],
      };
    },
  );

  server.tool(
    "set_meal",
    "Set a planned meal for a given date. If a meal already exists for that date, it will be overwritten.",
    {
      date: z.string().date().describe("Date of the meal (YYYY-MM-DD)"),
      main_dish: z.string().describe("Main dish"),
      side_dish: z.string().describe("Side dish (optional)").optional(),
    },
    ({ date, main_dish, side_dish }) => {
      const existing = db.select().from(meals).where(eq(meals.date, date)).get();
      if (existing) {
        const updated = db
          .update(meals)
          .set({ main_dish, side_dish: side_dish ?? null })
          .where(eq(meals.id, existing.id))
          .returning()
          .get();
        return {
          content: [{ type: "text", text: `Updated meal: ${formatMeal(updated)}` }],
        };
      }
      const inserted = db.insert(meals).values({ date, main_dish, side_dish: side_dish ?? null }).returning().get();
      return {
        content: [{ type: "text", text: `Added meal: ${formatMeal(inserted)}` }],
      };
    },
  );
}

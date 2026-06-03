import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { meals } from "@/db/schema.js";
import { loggedTool } from "@/mcp/logged-tool.js";
import { Meal } from "@/model/meal.js";

export function registerMealTools(server: McpServer, db: Db) {
  loggedTool(
    server,
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
                ? results.map((meal) => new Meal(meal).summaryLabel()).join("\n")
                : "No meals found for the specified date range.",
          },
        ],
      };
    },
  );

  loggedTool(
    server,
    "set_meal",
    "Set a planned meal for a given date. If a meal already exists for that date, it will be overwritten. A meal follows the ichiju-sansai structure: a required main dish plus optional staple, warm side, cold side, and soup. Assign each dish to the category that fits its role and temperature.",
    {
      date: z.string().date().describe("Date of the meal (YYYY-MM-DD)"),
      main: z
        .string()
        .describe(
          "Main dish: the protein centerpiece, e.g. grilled fish, a meat dish, or a main-grade salad.",
        ),
      rice: z
        .string()
        .describe(
          "Staple / rice (optional). Defaults to plain white rice when omitted; set it only for notable staples like donburi, takikomi-gohan, or fried rice.",
        )
        .optional(),
      hot_side: z
        .string()
        .describe(
          "Warm side dish (optional): a warm, substantial side such as a simmered dish (nimono), stir-fry, sauté, or glacé. Goes here rather than cold_side when it is served warm.",
        )
        .optional(),
      cold_side: z
        .string()
        .describe(
          "Cold side dish (optional): a cold or light side such as a dressed dish (aemono), pickles, or a salad. Use this rather than hot_side for chilled or raw items.",
        )
        .optional(),
      soup: z
        .string()
        .describe(
          "Soup (optional). Defaults to miso soup when omitted; set it for other soups like tonjiru, pot-au-feu, or corn soup.",
        )
        .optional(),
    },
    ({ date, main, rice, hot_side, cold_side, soup }) => {
      const values = {
        main,
        rice: rice ?? null,
        hot_side: hot_side ?? null,
        cold_side: cold_side ?? null,
        soup: soup ?? null,
      };
      const existing = db.select().from(meals).where(eq(meals.date, date)).get();
      if (existing) {
        const updated = db
          .update(meals)
          .set(values)
          .where(eq(meals.id, existing.id))
          .returning()
          .get();
        return {
          content: [{ type: "text", text: `Updated meal: ${new Meal(updated).summaryLabel()}` }],
        };
      }
      const inserted = db
        .insert(meals)
        .values({ date, ...values })
        .returning()
        .get();
      return {
        content: [{ type: "text", text: `Added meal: ${new Meal(inserted).summaryLabel()}` }],
      };
    },
  );

  loggedTool(
    server,
    "delete_meal",
    "Delete a planned meal for a given date.",
    {
      date: z.string().date().describe("Date of the meal to delete (YYYY-MM-DD)"),
    },
    ({ date }) => {
      const existing = db.select().from(meals).where(eq(meals.date, date)).get();
      if (!existing) {
        return { content: [{ type: "text", text: `No meal found for ${date}.` }] };
      }
      db.delete(meals).where(eq(meals.id, existing.id)).run();
      return {
        content: [{ type: "text", text: `Deleted meal: ${new Meal(existing).summaryLabel()}` }],
      };
    },
  );
}

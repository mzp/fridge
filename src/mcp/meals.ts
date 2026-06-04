import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { meals } from "@/db/schema.js";
import { loggedTool } from "@/mcp/logged-tool.js";
import { Meal, mealJson } from "@/model/meal.js";

export function registerMealTools(server: McpServer, db: Db) {
  loggedTool(
    server,
    "get_meals",
    "Get the list of planned meals for a given date range",
    {
      from: z.string().date().describe("Start date (YYYY-MM-DD)"),
      to: z.string().date().describe("End date (YYYY-MM-DD)"),
    },
    { meals: z.array(mealJson) },
    ({ from, to }) => {
      const results = db
        .select()
        .from(meals)
        .where(and(gte(meals.date, from), lte(meals.date, to)))
        .all();

      return {
        structuredContent: { meals: results.map((meal) => new Meal(meal).toJson()) },
      };
    },
  );

  loggedTool(
    server,
    "set_meal",
    "Create or update the meal for a date. This is a partial update: only the categories you pass are changed, and any category you omit is left untouched, so existing dishes are preserved. A meal follows the ichiju-sansai structure: a main dish plus optional rice, warm side, cold side, and soup. Assign each dish to the category that fits its role and temperature. Pass an empty string to clear a category. `main` is required only when creating a new meal.",
    {
      date: z.string().date().describe("Date of the meal (YYYY-MM-DD)"),
      main: z
        .string()
        .describe(
          "Main dish: the protein centerpiece, e.g. grilled fish, a meat dish, or a main-grade salad. Required when creating a new meal; omit to leave an existing meal's main unchanged.",
        )
        .optional(),
      rice: z
        .string()
        .describe("Rice (optional). Set it to the rice served with the meal.")
        .optional(),
      hot_side: z
        .string()
        .describe(
          "Warm side dish (optional): a warm, substantial side. Goes here rather than cold_side when it is served warm.",
        )
        .optional(),
      cold_side: z
        .string()
        .describe(
          "Cold side dish (optional): a cold or light side. Use this rather than hot_side for chilled or raw items.",
        )
        .optional(),
      soup: z
        .string()
        .describe("Soup (optional). Set it to the soup served with the meal.")
        .optional(),
    },
    {
      ok: z.boolean(),
      action: z.enum(["created", "updated", "unchanged", "error"]),
      message: z.string(),
      meal: mealJson.nullable(),
    },
    ({ date, main, rice, hot_side, cold_side, soup }) => {
      const result = Meal.batchSave(db, date, { main, rice, hot_side, cold_side, soup });
      const messages = {
        created: `Added meal for ${date}.`,
        updated: `Updated meal for ${date}.`,
        unchanged: `No changes; meal for ${date} is unchanged.`,
        error: `Cannot create a meal for ${date} without a main dish.`,
      } as const;
      return {
        structuredContent: {
          ok: result.action !== "error",
          action: result.action,
          message: messages[result.action],
          meal: result.meal ? result.meal.toJson() : null,
        },
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
    {
      ok: z.boolean(),
      action: z.enum(["deleted", "not_found"]),
      message: z.string(),
      meal: mealJson.nullable(),
    },
    ({ date }) => {
      const existing = db.select().from(meals).where(eq(meals.date, date)).get();
      if (!existing) {
        return {
          structuredContent: {
            ok: false,
            action: "not_found",
            message: `No meal found for ${date}.`,
            meal: null,
          },
        };
      }
      db.delete(meals).where(eq(meals.id, existing.id)).run();
      return {
        structuredContent: {
          ok: true,
          action: "deleted",
          message: `Deleted meal for ${date}.`,
          meal: new Meal(existing).toJson(),
        },
      };
    },
  );
}

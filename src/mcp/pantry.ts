import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { pantry, pantryLogs } from "@/db/schema.js";
import { loggedTool } from "@/mcp/logged-tool.js";
import { PantryItem } from "@/model/pantry-item.js";

// Shared output shape for a pantry/shopping row, including derived expiry fields.
export const pantryItemJson = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number(),
  unit: z.string().nullable(),
  stock_date: z.string().nullable(),
  best_before_days: z.number().nullable(),
  status: z.string(),
  category: z.string(),
  expiry_status: z.enum(["none", "expired", "soon", "fresh"]),
  days_remaining: z.number().nullable(),
});

export function registerPantryTools(server: McpServer, db: Db) {
  loggedTool(
    server,
    "get_pantry",
    "Get the list of in-stock pantry items with IDs and expiry status. Each item carries `category` ('prepared' or 'ingredient'), `expiry_status` and `days_remaining` for freshness.",
    {},
    { items: z.array(pantryItemJson) },
    () => {
      const items = db
        .select()
        .from(pantry)
        .where(and(eq(pantry.status, "in_stock"), isNotNull(pantry.stock_date)))
        .all()
        .map((item) => new PantryItem(item));
      const prepared = items.filter((i) => i.belongsToCategory("prepared"));
      const ingredients = items.filter((i) => i.belongsToCategory("ingredient"));
      return {
        structuredContent: {
          items: [...prepared, ...ingredients].map((item) => item.toJson()),
        },
      };
    },
  );

  loggedTool(
    server,
    "set_pantry_item",
    "Add or update a pantry item by (name, stock_date). For recording usage, use use_pantry_item.",
    {
      name: z.string().describe("Item name"),
      quantity: z.number().int().describe("Quantity"),
      unit: z.string().describe("Unit (e.g. pcs, ml, g)").optional(),
      stock_date: z
        .string()
        .date()
        .describe(
          "Stock date (YYYY-MM-DD): purchase date for ingredients, preparation date for prepared dishes",
        ),
      best_before_days: z.number().int().describe("Days until expiry").optional(),
      category: z
        .enum(["ingredient", "prepared"])
        .describe(
          "'ingredient' for raw ingredients (default), 'prepared' for ready-to-eat dishes (e.g. soup, side dish)",
        )
        .optional(),
    },
    {
      ok: z.boolean(),
      action: z.enum(["created", "updated"]),
      message: z.string(),
      item: pantryItemJson,
    },
    ({ name, quantity, unit, stock_date, best_before_days, category }) => {
      const existing = db
        .select()
        .from(pantry)
        .where(and(eq(pantry.name, name), eq(pantry.stock_date, stock_date)))
        .get();

      const values = {
        name,
        quantity,
        unit: unit ?? null,
        stock_date,
        best_before_days: best_before_days ?? null,
        status: existing?.status ?? "in_stock",
        category: category ?? existing?.category ?? "ingredient",
      };

      const result = existing
        ? db.update(pantry).set(values).where(eq(pantry.id, existing.id)).returning().get()
        : db.insert(pantry).values(values).returning().get();

      return {
        structuredContent: {
          ok: true,
          action: existing ? "updated" : "created",
          message: `${existing ? "Updated" : "Added"} ${name} (${stock_date}).`,
          item: new PantryItem(result).toJson(),
        },
      };
    },
  );

  loggedTool(
    server,
    "use_pantry_item",
    "Record usage of a pantry item by ID. Decrements quantity and logs the consumption. The meal for the date is automatically linked on the detail page, so no need to mention it in the note.",
    {
      id: z.number().int().describe("Pantry item ID (from get_pantry)"),
      quantity_used: z
        .number()
        .int()
        .positive()
        .describe("Amount used. Omit when use_all is true.")
        .optional(),
      use_all: z.boolean().describe("Set to true to use all remaining stock.").optional(),
      date: z.string().date().describe("Date of use (YYYY-MM-DD, defaults to today)").optional(),
      note: z
        .string()
        .describe('Optional note, e.g. fractional amount used ("1/4 of one").')
        .optional(),
    },
    {
      ok: z.boolean(),
      action: z.enum(["used", "not_found"]),
      message: z.string(),
      id: z.number(),
      name: z.string().nullable(),
      used: z.number(),
      remaining: z.number(),
      unit: z.string().nullable(),
      consumed: z.boolean(),
    },
    ({ id, quantity_used, use_all, date, note }) => {
      const today = new Date().toISOString().slice(0, 10);
      const item = db.select().from(pantry).where(eq(pantry.id, id)).get();
      if (!item) {
        return {
          structuredContent: {
            ok: false,
            action: "not_found",
            message: `Item #${id} not found.`,
            id,
            name: null,
            used: 0,
            remaining: 0,
            unit: null,
            consumed: false,
          },
        };
      }

      const pantryItem = new PantryItem(item);
      const consumption = pantryItem.consume({ quantityUsed: quantity_used, useAll: use_all });

      db.update(pantry)
        .set({ quantity: consumption.newQuantity, status: consumption.newStatus })
        .where(eq(pantry.id, id))
        .run();

      db.insert(pantryLogs)
        .values({
          pantry_id: id,
          delta: -consumption.actualUsed,
          recorded_at: date ?? today,
          note: note ?? null,
        })
        .run();

      let message = `Used ${pantryItem.quantityLabel(consumption.actualUsed)} of ${pantryItem.record.name}. Remaining: ${pantryItem.quantityLabel(consumption.newQuantity)}.`;
      if (consumption.consumed) message += " Marked as consumed.";

      return {
        structuredContent: {
          ok: true,
          action: "used",
          message,
          id,
          name: pantryItem.record.name,
          used: consumption.actualUsed,
          remaining: consumption.newQuantity,
          unit: pantryItem.record.unit,
          consumed: consumption.consumed,
        },
      };
    },
  );
}

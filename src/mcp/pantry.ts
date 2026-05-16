import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { pantry, pantryLogs } from "@/db/schema.js";
import { PantryItem } from "@/model/pantry-item.js";

function formatItem(item: PantryItem): string {
  let line = `[${item.record.id}] ${item.record.name} x${item.quantityLabel()} (stocked: ${item.record.stock_date}`;
  if (item.record.best_before_days == null) {
    line += ")";
  } else {
    line += `, best before: ${item.record.best_before_days}d)`;
    const status = item.expiryStatus();
    if (status === "expired") line += " [!] expired";
    else if (status === "soon") line += " [!] expires soon";
  }
  return line;
}

export function registerPantryTools(server: McpServer, db: Db) {
  server.tool(
    "get_pantry",
    "Get the list of in-stock pantry items with IDs and expiry warnings",
    {},
    () => {
      const items = db
        .select()
        .from(pantry)
        .where(eq(pantry.status, "in_stock"))
        .all()
        .map((item) => new PantryItem(item));
      if (items.length === 0) {
        return { content: [{ type: "text", text: "No items in stock." }] };
      }
      const prepared = items.filter((i) => i.belongsToCategory("prepared"));
      const ingredients = items.filter((i) => i.belongsToCategory("ingredient"));
      const sections: string[] = [];
      if (prepared.length > 0) sections.push(`[prepared]\n${prepared.map(formatItem).join("\n")}`);
      if (ingredients.length > 0)
        sections.push(`[ingredient]\n${ingredients.map(formatItem).join("\n")}`);
      return { content: [{ type: "text", text: sections.join("\n\n") }] };
    },
  );

  server.tool(
    "set_pantry_item",
    "Add or update a pantry item by (name, stock_date). For recording usage, use use_pantry_item.",
    {
      name: z.string().describe("Item name"),
      quantity: z.number().int().describe("Quantity"),
      unit: z.string().describe("Unit (e.g. 個, ml, g)").optional(),
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

      let result: typeof pantry.$inferSelect;
      let verb: string;

      if (existing) {
        result = db.update(pantry).set(values).where(eq(pantry.id, existing.id)).returning().get();
        verb = "Updated";
      } else {
        result = db.insert(pantry).values(values).returning().get();
        verb = "Added";
      }

      return {
        content: [{ type: "text", text: `${verb}: ${formatItem(new PantryItem(result))}` }],
      };
    },
  );

  server.tool(
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
    ({ id, quantity_used, use_all, date, note }) => {
      const today = new Date().toISOString().slice(0, 10);
      const item = db.select().from(pantry).where(eq(pantry.id, id)).get();
      if (!item) {
        return { content: [{ type: "text", text: `Item #${id} not found.` }] };
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

      let msg = `Used ${pantryItem.quantityLabel(consumption.actualUsed)} of ${pantryItem.record.name}. Remaining: ${pantryItem.quantityLabel(consumption.newQuantity)}.`;
      if (consumption.consumed) msg += " Marked as consumed.";

      return { content: [{ type: "text", text: msg }] };
    },
  );
}

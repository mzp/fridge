import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { pantry, pantryLogs } from "@/db/schema.js";

function daysRemaining(stockDate: string, bestBeforeDays: number): number {
  const purchased = new Date(stockDate).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  const expiresAt = purchased + bestBeforeDays * 86400000;
  return Math.ceil((expiresAt - today) / 86400000);
}

function formatItem(item: typeof pantry.$inferSelect): string {
  const qty = item.unit ? `${item.quantity}${item.unit}` : String(item.quantity);
  let line = `[${item.id}] ${item.name} x${qty} (stocked: ${item.stock_date}`;
  if (item.best_before_days == null) {
    line += ")";
  } else {
    const days = daysRemaining(item.stock_date, item.best_before_days);
    line += `, best before: ${item.best_before_days}d)`;
    if (days < 0) line += " [!] expired";
    else if (days <= 3) line += " [!] expires soon";
  }
  return line;
}

export function registerPantryTools(server: McpServer, db: Db) {
  server.tool(
    "get_pantry",
    "Get the list of in-stock pantry items with IDs and expiry warnings",
    {},
    () => {
      const items = db.select().from(pantry).where(eq(pantry.status, "in_stock")).all();
      if (items.length === 0) {
        return { content: [{ type: "text", text: "No items in stock." }] };
      }
      const prepared = items.filter((i) => i.category === "prepared");
      const ingredients = items.filter((i) => i.category !== "prepared");
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

      return { content: [{ type: "text", text: `${verb}: ${formatItem(result)}` }] };
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

      const actualUsed = use_all ? item.quantity : (quantity_used ?? 0);
      const newQuantity = item.quantity - actualUsed;
      const newStatus = newQuantity <= 0 ? "consumed" : item.status;

      db.update(pantry)
        .set({ quantity: newQuantity, status: newStatus })
        .where(eq(pantry.id, id))
        .run();

      db.insert(pantryLogs)
        .values({
          pantry_id: id,
          delta: -actualUsed,
          recorded_at: date ?? today,
          note: note ?? null,
        })
        .run();

      const qty = item.unit ? `${actualUsed}${item.unit}` : String(actualUsed);
      const remaining = item.unit ? `${newQuantity}${item.unit}` : String(newQuantity);
      let msg = `Used ${qty} of ${item.name}. Remaining: ${remaining}.`;
      if (newQuantity <= 0) msg += " Marked as consumed.";

      return { content: [{ type: "text", text: msg }] };
    },
  );
}

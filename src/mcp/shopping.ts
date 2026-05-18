import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { pantry } from "@/db/schema.js";
import { loggedTool } from "@/mcp/logged-tool.js";
import { PantryItem } from "@/model/pantry-item.js";

function formatShoppingItem(item: PantryItem): string {
  return `[${item.record.id}] ${item.record.name} x${item.quantityLabel()}`;
}

function formatPantryItem(item: PantryItem): string {
  let line = `[${item.record.id}] ${item.record.name} x${item.quantityLabel()} (stocked: ${item.record.stock_date}`;
  if (item.record.best_before_days == null) {
    line += ")";
  } else {
    line += `, best before: ${item.record.best_before_days}d)`;
  }
  return line;
}

export function registerShoppingTools(server: McpServer, db: Db) {
  loggedTool(
    server,
    "get_shopping_list",
    "Get the current shopping list (pantry items not yet purchased; stock_date is null).",
    {},
    () => {
      const items = db
        .select()
        .from(pantry)
        .where(and(isNull(pantry.stock_date), eq(pantry.status, "in_stock")))
        .all()
        .map((item) => new PantryItem(item));
      if (items.length === 0) {
        return { content: [{ type: "text", text: "Shopping list is empty." }] };
      }
      return { content: [{ type: "text", text: items.map(formatShoppingItem).join("\n") }] };
    },
  );

  loggedTool(
    server,
    "add_shopping_item",
    "Add or update a shopping list item by name. If the same name already exists, its quantity and unit are overwritten with the supplied values.",
    {
      name: z.string().describe("Item name (key)"),
      quantity: z.number().int().positive().describe("Final desired quantity"),
      unit: z
        .string()
        .describe("Unit (e.g. 個, ml, g). Overwrites existing unit when supplied.")
        .optional(),
    },
    ({ name, quantity, unit }) => {
      const existing = db
        .select()
        .from(pantry)
        .where(and(eq(pantry.name, name), isNull(pantry.stock_date)))
        .get();

      let result: typeof pantry.$inferSelect;
      let verb: string;

      if (existing) {
        result = db
          .update(pantry)
          .set({ quantity, unit: unit ?? existing.unit })
          .where(eq(pantry.id, existing.id))
          .returning()
          .get();
        verb = "Updated";
      } else {
        result = db
          .insert(pantry)
          .values({
            name,
            quantity,
            unit: unit ?? null,
            stock_date: null,
            best_before_days: null,
            status: "in_stock",
            category: "ingredient",
          })
          .returning()
          .get();
        verb = "Added";
      }

      return {
        content: [{ type: "text", text: `${verb}: ${formatShoppingItem(new PantryItem(result))}` }],
      };
    },
  );

  loggedTool(
    server,
    "purchase_shopping_item",
    "Mark a shopping list item as purchased and promote it to the pantry by setting stock_date.",
    {
      id: z.number().int().describe("Shopping item ID (from get_shopping_list)"),
      stock_date: z
        .string()
        .date()
        .describe("Stock date (YYYY-MM-DD). Defaults to today.")
        .optional(),
      best_before_days: z.number().int().describe("Days until expiry").optional(),
      category: z.enum(["ingredient", "prepared"]).describe("Defaults to 'ingredient'.").optional(),
    },
    ({ id, stock_date, best_before_days, category }) => {
      const today = new Date().toISOString().slice(0, 10);
      const targetDate = stock_date ?? today;

      const item = db
        .select()
        .from(pantry)
        .where(and(eq(pantry.id, id), isNull(pantry.stock_date)))
        .get();
      if (!item) {
        return {
          content: [{ type: "text", text: `Shopping item #${id} not found.` }],
        };
      }

      const clash = db
        .select()
        .from(pantry)
        .where(and(eq(pantry.name, item.name), eq(pantry.stock_date, targetDate)))
        .get();

      let result: typeof pantry.$inferSelect;
      if (clash) {
        result = db
          .update(pantry)
          .set({ quantity: clash.quantity + item.quantity })
          .where(eq(pantry.id, clash.id))
          .returning()
          .get();
        db.delete(pantry).where(eq(pantry.id, id)).run();
      } else {
        result = db
          .update(pantry)
          .set({
            stock_date: targetDate,
            best_before_days: best_before_days ?? null,
            category: category ?? item.category,
          })
          .where(eq(pantry.id, id))
          .returning()
          .get();
      }

      return {
        content: [{ type: "text", text: `Purchased: ${formatPantryItem(new PantryItem(result))}` }],
      };
    },
  );

  loggedTool(
    server,
    "remove_shopping_item",
    "Remove an item from the shopping list without purchasing it.",
    {
      id: z.number().int().describe("Shopping item ID (from get_shopping_list)"),
    },
    ({ id }) => {
      const item = db
        .select()
        .from(pantry)
        .where(and(eq(pantry.id, id), isNull(pantry.stock_date)))
        .get();
      if (!item) {
        return {
          content: [{ type: "text", text: `Shopping item #${id} not found.` }],
        };
      }
      db.delete(pantry).where(eq(pantry.id, id)).run();
      return {
        content: [{ type: "text", text: `Removed: [${id}] ${item.name}` }],
      };
    },
  );
}

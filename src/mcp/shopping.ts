import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { pantry } from "@/db/schema.js";
import { loggedTool } from "@/mcp/logged-tool.js";
import { pantryItemJson } from "@/mcp/pantry.js";
import { PantryItem } from "@/model/pantry-item.js";

export function registerShoppingTools(server: McpServer, db: Db) {
  loggedTool(
    server,
    "get_shopping_list",
    "Get the current shopping list (pantry items not yet purchased; stock_date is null).",
    {},
    { items: z.array(pantryItemJson) },
    () => {
      const items = db
        .select()
        .from(pantry)
        .where(and(isNull(pantry.stock_date), eq(pantry.status, "in_stock")))
        .all()
        .map((item) => new PantryItem(item));
      return { structuredContent: { items: items.map((item) => item.toJson()) } };
    },
  );

  loggedTool(
    server,
    "add_shopping_item",
    "Add or update a shopping list item by name. If the same name already exists, its quantity, unit, and best_before_days are overwritten with the supplied values. Supply best_before_days for perishables (meat, vegetables, dairy) so the item is tracked in the pantry on purchase. Omit best_before_days for shelf-stable goods like seasonings (soy sauce, salt) or canned goods — on purchase they are recorded as purchased without being added to pantry inventory.",
    {
      name: z.string().describe("Item name (key)"),
      quantity: z.number().int().positive().describe("Final desired quantity"),
      unit: z
        .string()
        .describe("Unit (e.g. pcs, ml, g). Overwrites existing unit when supplied.")
        .optional(),
      best_before_days: z
        .number()
        .int()
        .positive()
        .describe(
          "Days until expiry. Set for perishables (meat, vegetables, dairy) — they will move to the pantry on purchase. Omit for shelf-stable items like seasonings or canned goods.",
        )
        .optional(),
    },
    {
      ok: z.boolean(),
      action: z.enum(["created", "updated"]),
      message: z.string(),
      item: pantryItemJson,
    },
    ({ name, quantity, unit, best_before_days }) => {
      const existing = db
        .select()
        .from(pantry)
        .where(and(eq(pantry.name, name), isNull(pantry.stock_date)))
        .get();

      const result = existing
        ? db
            .update(pantry)
            .set({
              quantity,
              unit: unit ?? existing.unit,
              best_before_days: best_before_days ?? null,
            })
            .where(eq(pantry.id, existing.id))
            .returning()
            .get()
        : db
            .insert(pantry)
            .values({
              name,
              quantity,
              unit: unit ?? null,
              stock_date: null,
              best_before_days: best_before_days ?? null,
              status: "in_stock",
              category: "ingredient",
            })
            .returning()
            .get();

      return {
        structuredContent: {
          ok: true,
          action: existing ? "updated" : "created",
          message: `${existing ? "Updated" : "Added"} ${name} on the shopping list.`,
          item: new PantryItem(result).toJson(),
        },
      };
    },
  );

  loggedTool(
    server,
    "purchase_shopping_item",
    "Mark a shopping list item as purchased. If the item has best_before_days set (or supplied here), it is promoted to the pantry with stock_date. Otherwise it is just recorded as purchased (status='purchased') and removed from the shopping list without becoming a pantry inventory entry.",
    {
      id: z.number().int().describe("Shopping item ID (from get_shopping_list)"),
      stock_date: z
        .string()
        .date()
        .describe(
          "Stock date (YYYY-MM-DD). Defaults to today. Ignored when not promoting to pantry.",
        )
        .optional(),
      best_before_days: z
        .number()
        .int()
        .describe(
          "Override stored best_before_days. Setting it forces promotion to pantry even if the shopping item had none.",
        )
        .optional(),
      category: z.enum(["ingredient", "prepared"]).describe("Defaults to 'ingredient'.").optional(),
    },
    {
      ok: z.boolean(),
      action: z.enum(["purchased", "stocked", "not_found"]),
      message: z.string(),
      freshness_tracked: z.boolean(),
      item: pantryItemJson.nullable(),
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
          structuredContent: {
            ok: false,
            action: "not_found",
            message: `Shopping item #${id} not found.`,
            freshness_tracked: false,
            item: null,
          },
        };
      }

      const effectiveBestBeforeDays = best_before_days ?? item.best_before_days;

      if (effectiveBestBeforeDays == null) {
        const result = db
          .update(pantry)
          .set({ status: "purchased" })
          .where(eq(pantry.id, id))
          .returning()
          .get();
        return {
          structuredContent: {
            ok: true,
            action: "purchased",
            message: `Purchased ${result.name} (no freshness tracking).`,
            freshness_tracked: false,
            item: new PantryItem(result).toJson(),
          },
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
            best_before_days: effectiveBestBeforeDays,
            category: category ?? item.category,
          })
          .where(eq(pantry.id, id))
          .returning()
          .get();
      }

      return {
        structuredContent: {
          ok: true,
          action: "stocked",
          message: `Purchased ${result.name} and added it to the pantry.`,
          freshness_tracked: true,
          item: new PantryItem(result).toJson(),
        },
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
    {
      ok: z.boolean(),
      action: z.enum(["removed", "not_found"]),
      message: z.string(),
      id: z.number(),
      name: z.string().nullable(),
    },
    ({ id }) => {
      const item = db
        .select()
        .from(pantry)
        .where(and(eq(pantry.id, id), isNull(pantry.stock_date)))
        .get();
      if (!item) {
        return {
          structuredContent: {
            ok: false,
            action: "not_found",
            message: `Shopping item #${id} not found.`,
            id,
            name: null,
          },
        };
      }
      db.delete(pantry).where(eq(pantry.id, id)).run();
      return {
        structuredContent: {
          ok: true,
          action: "removed",
          message: `Removed ${item.name} from the shopping list.`,
          id,
          name: item.name,
        },
      };
    },
  );
}

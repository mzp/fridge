import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { pantry } from "@/db/schema.js";

function daysRemaining(purchasedAt: string, bestBeforeDays: number): number {
  const purchased = new Date(purchasedAt).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  const expiresAt = purchased + bestBeforeDays * 86400000;
  return Math.ceil((expiresAt - today) / 86400000);
}

function formatItem(item: {
  name: string;
  quantity: number;
  unit: string | null;
  purchased_at: string;
  best_before_days: number | null;
}): string {
  const qty = item.unit ? `${item.quantity}${item.unit}` : String(item.quantity);
  let line = `${item.name} x${qty} (purchased: ${item.purchased_at}`;
  if (item.best_before_days == null) {
    line += ")";
  } else {
    const days = daysRemaining(item.purchased_at, item.best_before_days);
    line += `, best before: ${item.best_before_days}d)`;
    if (days <= 0) line += " [!] expired";
    else if (days <= 3) line += " [!] expires soon";
  }
  return line;
}

export function registerPantryTools(server: McpServer, db: Db) {
  server.tool(
    "get_pantry",
    "Get the list of in-stock pantry items with expiry warnings",
    {},
    () => {
      const items = db.select().from(pantry).where(eq(pantry.status, "in_stock")).all();
      return {
        content: [
          {
            type: "text",
            text: items.length > 0 ? items.map(formatItem).join("\n") : "No items in stock.",
          },
        ],
      };
    },
  );

  server.tool(
    "set_pantry_item",
    "Add or update a pantry item by name. Resets status to in_stock.",
    {
      name: z.string().describe("Item name"),
      quantity: z.number().int().describe("Quantity"),
      unit: z.string().describe("Unit (e.g. 個, ml, g)").optional(),
      purchased_at: z.string().date().describe("Purchase date (YYYY-MM-DD)"),
      best_before_days: z.number().int().describe("Days until expiry").optional(),
    },
    ({ name, quantity, unit, purchased_at, best_before_days }) => {
      const existing = db.select().from(pantry).where(eq(pantry.name, name)).get();
      const values = {
        name,
        quantity,
        unit: unit ?? null,
        purchased_at,
        best_before_days: best_before_days ?? null,
        status: "in_stock",
      };
      if (existing) {
        const updated = db
          .update(pantry)
          .set(values)
          .where(eq(pantry.id, existing.id))
          .returning()
          .get();
        return { content: [{ type: "text", text: `Updated: ${formatItem(updated)}` }] };
      }
      const inserted = db.insert(pantry).values(values).returning().get();
      return { content: [{ type: "text", text: `Added: ${formatItem(inserted)}` }] };
    },
  );

  server.tool(
    "consume_pantry_item",
    "Mark a pantry item as consumed",
    {
      name: z.string().describe("Item name"),
    },
    ({ name }) => {
      const existing = db.select().from(pantry).where(eq(pantry.name, name)).get();
      if (!existing) {
        return { content: [{ type: "text", text: `Item "${name}" not found.` }] };
      }
      db.update(pantry).set({ status: "consumed" }).where(eq(pantry.id, existing.id)).run();
      return { content: [{ type: "text", text: `Marked as consumed: ${name}` }] };
    },
  );
}

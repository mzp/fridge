import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { pantry } from "@/db/schema.js";
import { logger } from "@/logger/web.js";
import { PantryItem } from "@/model/pantry-item.js";
import { ShoppingForm } from "@/web/views/shopping/form.js";
import { ShoppingList } from "@/web/views/shopping/list.js";

export function createShoppingRoutes(db: Db) {
  const app = new Hono();

  app.get("/", (c) => {
    const items = db
      .select()
      .from(pantry)
      .where(and(isNull(pantry.stock_date), eq(pantry.status, "in_stock")))
      .orderBy(pantry.id)
      .all()
      .map((item) => new PantryItem(item));
    return c.html(<ShoppingList items={items} />);
  });

  app.get("/new", (c) => c.html(<ShoppingForm />));

  app.post("/", async (c) => {
    const body = await c.req.parseBody();
    const name = String(body["name"]).trim();
    const quantity = Number(body["quantity"]);
    const unit = body["unit"] ? String(body["unit"]) : null;

    const existing = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.name, name), isNull(pantry.stock_date)))
      .get();

    if (existing) {
      db.update(pantry)
        .set({ quantity: existing.quantity + quantity, unit: unit ?? existing.unit })
        .where(eq(pantry.id, existing.id))
        .run();
      logger.info({ id: existing.id, name, added: quantity }, "shopping_increased");
    } else {
      const inserted = db
        .insert(pantry)
        .values({
          name,
          quantity,
          unit,
          stock_date: null,
          best_before_days: null,
          status: "in_stock",
          category: "ingredient",
        })
        .returning()
        .get();
      logger.info({ id: inserted.id, name }, "shopping_created");
    }
    return c.redirect("/shopping");
  });

  app.post("/:id/purchase", (c) => {
    const id = Number(c.req.param("id"));
    const item = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.id, id), isNull(pantry.stock_date)))
      .get();
    if (!item) return c.notFound();

    const today = new Date().toISOString().slice(0, 10);
    const clash = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.name, item.name), eq(pantry.stock_date, today)))
      .get();

    if (clash) {
      db.update(pantry)
        .set({ quantity: clash.quantity + item.quantity })
        .where(eq(pantry.id, clash.id))
        .run();
      db.delete(pantry).where(eq(pantry.id, id)).run();
      logger.info({ from: id, into: clash.id, name: item.name }, "shopping_purchased_merged");
      return c.redirect(`/pantry/${clash.id}`);
    }

    db.update(pantry).set({ stock_date: today }).where(eq(pantry.id, id)).run();
    logger.info({ id, name: item.name, stock_date: today }, "shopping_purchased");
    return c.redirect(`/pantry/${id}`);
  });

  app.post("/:id/delete", (c) => {
    const id = Number(c.req.param("id"));
    const existing = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.id, id), isNull(pantry.stock_date)))
      .get();
    if (existing) {
      db.delete(pantry).where(eq(pantry.id, id)).run();
      logger.warn({ id, name: existing.name }, "shopping_deleted");
    }
    return c.redirect("/shopping");
  });

  return app;
}

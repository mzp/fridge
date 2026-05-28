import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { pantry } from "@/db/schema.js";
import { logger } from "@/logger/web.js";
import { PantryItem } from "@/model/pantry-item.js";
import { Layout } from "@/web/views/layout.js";
import { ShoppingDetail } from "@/web/views/shopping/detail.js";
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
    return c.html(
      <Layout>
        <main class="page-wide">
          <ShoppingList items={items} />
        </main>
      </Layout>,
    );
  });

  app.get("/new", (c) =>
    c.html(
      <ShoppingForm
        action="/shopping"
        title="Add to shopping list"
        submitLabel="Add"
        cancelHref="/shopping"
      />,
    ),
  );

  app.get("/:id", (c) => {
    const id = Number(c.req.param("id"));
    const item = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.id, id), isNull(pantry.stock_date)))
      .get();
    if (!item) return c.notFound();
    return c.html(<ShoppingDetail item={new PantryItem(item)} />);
  });

  app.get("/:id/edit", (c) => {
    const id = Number(c.req.param("id"));
    const item = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.id, id), isNull(pantry.stock_date)))
      .get();
    if (!item) return c.notFound();
    return c.html(
      <ShoppingForm
        action={`/shopping/${id}`}
        title={`Edit: ${item.name}`}
        item={item}
        submitLabel="Save"
        cancelHref={`/shopping/${id}`}
      />,
    );
  });

  app.post("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const existing = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.id, id), isNull(pantry.stock_date)))
      .get();
    if (!existing) return c.notFound();

    const body = await c.req.parseBody();
    const name = String(body["name"]).trim();
    const quantity = Number(body["quantity"]);
    const unit = body["unit"] ? String(body["unit"]) : null;
    const best_before_days = body["best_before_days"] ? Number(body["best_before_days"]) : null;

    db.update(pantry)
      .set({ name, quantity, unit, best_before_days })
      .where(eq(pantry.id, id))
      .run();
    logger.info({ id, name, quantity, unit, best_before_days }, "shopping_updated");
    return c.redirect(`/shopping/${id}`);
  });

  app.post("/", async (c) => {
    const body = await c.req.parseBody();
    const name = String(body["name"]).trim();
    const quantity = Number(body["quantity"]);
    const unit = body["unit"] ? String(body["unit"]) : null;
    const best_before_days = body["best_before_days"] ? Number(body["best_before_days"]) : null;

    const existing = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.name, name), isNull(pantry.stock_date)))
      .get();

    if (existing) {
      db.update(pantry)
        .set({ quantity, unit: unit ?? existing.unit, best_before_days })
        .where(eq(pantry.id, existing.id))
        .run();
      logger.info({ id: existing.id, name, quantity, best_before_days }, "shopping_overwritten");
    } else {
      const inserted = db
        .insert(pantry)
        .values({
          name,
          quantity,
          unit,
          stock_date: null,
          best_before_days,
          status: "in_stock",
          category: "ingredient",
        })
        .returning()
        .get();
      logger.info({ id: inserted.id, name, best_before_days }, "shopping_created");
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

    if (item.best_before_days == null) {
      db.update(pantry).set({ status: "purchased" }).where(eq(pantry.id, id)).run();
      logger.info({ id, name: item.name }, "shopping_purchased_untracked");
      return c.redirect("/shopping");
    }

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

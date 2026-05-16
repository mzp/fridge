import { desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { meals, pantry, pantryLogs } from "@/db/schema.js";
import { logger } from "@/logger/web.js";
import { PantryItem } from "@/model/pantry-item.js";
import { PantryDetail } from "@/web/views/pantry/detail.js";
import { PantryForm } from "@/web/views/pantry/form.js";

export function createPantryRoutes(db: Db) {
  const app = new Hono();

  app.get("/new", (c) => c.html(<PantryForm action="/pantry" title="Add item" cancelHref="/" />));

  app.post("/", async (c) => {
    const body = await c.req.parseBody();
    const name = String(body["name"]);
    const stock_date = String(body["stock_date"]);
    const inserted = db
      .insert(pantry)
      .values({
        name,
        quantity: Number(body["quantity"]),
        unit: body["unit"] ? String(body["unit"]) : null,
        stock_date,
        best_before_days: body["best_before_days"] ? Number(body["best_before_days"]) : null,
        category: PantryItem.normalizeCategory(body["category"]),
        status: "in_stock",
      })
      .returning()
      .get();
    logger.info({ id: inserted.id, name, stock_date }, "pantry_created");
    return c.redirect("/");
  });

  app.get("/:id", (c) => {
    const item = db
      .select()
      .from(pantry)
      .where(eq(pantry.id, Number(c.req.param("id"))))
      .get();
    if (!item) return c.notFound();
    const logs = db
      .select()
      .from(pantryLogs)
      .where(eq(pantryLogs.pantry_id, item.id))
      .orderBy(desc(pantryLogs.recorded_at))
      .all();
    const logDates = [...new Set(logs.map((l) => l.recorded_at))];
    const mealsByDate: Record<string, { id: number; main_dish: string }> = {};
    if (logDates.length > 0) {
      for (const m of db
        .select({ id: meals.id, date: meals.date, main_dish: meals.main_dish })
        .from(meals)
        .where(inArray(meals.date, logDates))
        .all()) {
        mealsByDate[m.date] = { id: m.id, main_dish: m.main_dish };
      }
    }
    return c.html(
      <PantryDetail item={new PantryItem(item)} logs={logs} mealsByDate={mealsByDate} />,
    );
  });

  app.get("/:id/edit", (c) => {
    const item = db
      .select()
      .from(pantry)
      .where(eq(pantry.id, Number(c.req.param("id"))))
      .get();
    if (!item) return c.notFound();
    return c.html(
      <PantryForm
        action={`/pantry/${item.id}`}
        title={`Edit: ${item.name}`}
        item={item}
        cancelHref={`/pantry/${item.id}`}
      />,
    );
  });

  app.post("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.parseBody();
    db.update(pantry)
      .set({
        name: String(body["name"]),
        quantity: Number(body["quantity"]),
        unit: body["unit"] ? String(body["unit"]) : null,
        stock_date: String(body["stock_date"]),
        best_before_days: body["best_before_days"] ? Number(body["best_before_days"]) : null,
        category: PantryItem.normalizeCategory(body["category"]),
      })
      .where(eq(pantry.id, id))
      .run();
    return c.redirect(`/pantry/${id}`);
  });

  app.post("/:id/consume", (c) => {
    const id = Number(c.req.param("id"));
    db.update(pantry).set({ status: "consumed" }).where(eq(pantry.id, id)).run();
    logger.info({ id }, "pantry_consumed");
    return c.redirect("/");
  });

  app.post("/:id/delete", (c) => {
    const id = Number(c.req.param("id"));
    const existing = db.select().from(pantry).where(eq(pantry.id, id)).get();
    db.delete(pantryLogs).where(eq(pantryLogs.pantry_id, id)).run();
    db.delete(pantry).where(eq(pantry.id, id)).run();
    logger.warn({ id, name: existing?.name ?? null }, "pantry_deleted");
    return c.redirect("/");
  });

  return app;
}

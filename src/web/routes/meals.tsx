import { and, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { meals, pantry, pantryLogs } from "@/db/schema.js";
import { todayString } from "@/lib/date.js";
import { logger } from "@/logger/web.js";
import { Meal } from "@/model/meal.js";
import { Layout } from "@/web/views/layout.js";
import { MealsCalendar } from "@/web/views/meals/calendar.js";
import { MealDetail } from "@/web/views/meals/detail.js";
import { MealForm } from "@/web/views/meals/form.js";

function lastDayOfMonth(year: number, month: number): string {
  return new Date(year, month, 0).toISOString().slice(0, 10);
}

export function createMealRoutes(db: Db) {
  const app = new Hono();

  app.get("/", (c) => {
    const today = todayString();
    const monthParam = c.req.query("month") ?? today.slice(0, 7);
    const [year, month] = monthParam.split("-").map(Number) as [number, number];
    const from = `${monthParam}-01`;
    const to = lastDayOfMonth(year, month);
    const mealResults = db
      .select()
      .from(meals)
      .where(and(gte(meals.date, from), lte(meals.date, to)))
      .orderBy(meals.date)
      .all()
      .map((item) => new Meal(item));
    return c.html(
      <Layout>
        <MealsCalendar meals={mealResults} year={year} month={month} />
      </Layout>,
    );
  });

  app.get("/new", (c) => {
    const date = c.req.query("date");
    return c.html(
      <MealForm
        action="/meals"
        title="Add meal"
        cancelHref="/"
        {...(date ? { item: { date } } : {})}
      />,
    );
  });

  app.post("/", async (c) => {
    const body = await c.req.parseBody();
    const date = String(body["date"]);
    const main = String(body["main"]);
    const dishes = {
      rice: body["rice"] ? String(body["rice"]) : null,
      hot_side: body["hot_side"] ? String(body["hot_side"]) : null,
      cold_side: body["cold_side"] ? String(body["cold_side"]) : null,
      soup: body["soup"] ? String(body["soup"]) : null,
    };
    const existing = db.select().from(meals).where(eq(meals.date, date)).get();
    if (existing) {
      db.update(meals)
        .set({ main, ...dishes })
        .where(eq(meals.id, existing.id))
        .run();
      logger.info({ id: existing.id, date, main }, "meal_updated");
    } else {
      const inserted = db
        .insert(meals)
        .values({ date, main, ...dishes })
        .returning()
        .get();
      logger.info({ id: inserted.id, date, main }, "meal_created");
    }
    return c.redirect("/");
  });

  app.get("/:id", (c) => {
    const item = db
      .select()
      .from(meals)
      .where(eq(meals.id, Number(c.req.param("id"))))
      .get();
    if (!item) return c.notFound();
    const pantryUsage = db
      .select({
        id: pantry.id,
        name: pantry.name,
        delta: pantryLogs.delta,
        unit: pantry.unit,
        note: pantryLogs.note,
      })
      .from(pantryLogs)
      .innerJoin(pantry, eq(pantryLogs.pantry_id, pantry.id))
      .where(eq(pantryLogs.recorded_at, item.date))
      .all();
    return c.html(<MealDetail item={new Meal(item)} pantryUsage={pantryUsage} />);
  });

  app.get("/:id/edit", (c) => {
    const item = db
      .select()
      .from(meals)
      .where(eq(meals.id, Number(c.req.param("id"))))
      .get();
    if (!item) return c.notFound();
    return c.html(
      <MealForm
        action={`/meals/${item.id}`}
        title={`Edit: ${item.date}`}
        item={item}
        cancelHref={`/meals/${item.id}`}
      />,
    );
  });

  app.post("/:id/delete", (c) => {
    const id = Number(c.req.param("id"));
    db.delete(meals).where(eq(meals.id, id)).run();
    logger.warn({ id }, "meal_deleted");
    return c.redirect("/");
  });

  app.post("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.parseBody();
    db.update(meals)
      .set({
        date: String(body["date"]),
        main: String(body["main"]),
        rice: body["rice"] ? String(body["rice"]) : null,
        hot_side: body["hot_side"] ? String(body["hot_side"]) : null,
        cold_side: body["cold_side"] ? String(body["cold_side"]) : null,
        soup: body["soup"] ? String(body["soup"]) : null,
      })
      .where(eq(meals.id, id))
      .run();
    return c.redirect(`/meals/${id}`);
  });

  return app;
}

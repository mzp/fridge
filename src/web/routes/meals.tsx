import { and, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { meals, pantry, pantryLogs } from "@/db/schema.js";
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
    const today = Meal.todayString();
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
    const main_dish = String(body["main_dish"]);
    const side_dish = body["side_dish"] ? String(body["side_dish"]) : null;
    const existing = db.select().from(meals).where(eq(meals.date, date)).get();
    if (existing) {
      db.update(meals).set({ main_dish, side_dish }).where(eq(meals.id, existing.id)).run();
    } else {
      db.insert(meals).values({ date, main_dish, side_dish }).run();
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
    db.delete(meals)
      .where(eq(meals.id, Number(c.req.param("id"))))
      .run();
    return c.redirect("/");
  });

  app.post("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.parseBody();
    db.update(meals)
      .set({
        date: String(body["date"]),
        main_dish: String(body["main_dish"]),
        side_dish: body["side_dish"] ? String(body["side_dish"]) : null,
      })
      .where(eq(meals.id, id))
      .run();
    return c.redirect(`/meals/${id}`);
  });

  return app;
}

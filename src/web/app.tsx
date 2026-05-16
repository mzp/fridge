import { serveStatic } from "@hono/node-server/serve-static";
import { and, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { meals, pantry } from "@/db/schema.js";
import { Layout } from "@/web/views/layout.js";
import { MealDetail } from "@/web/views/meal-detail.js";
import { MealForm } from "@/web/views/meal-form.js";
import { MealsView } from "@/web/views/meals.js";
import { MealsCalendar } from "@/web/views/meals-calendar.js";
import { PantryView } from "@/web/views/pantry.js";
import { PantryDetail } from "@/web/views/pantry-detail.js";
import { PantryForm } from "@/web/views/pantry-form.js";

function lastDayOfMonth(year: number, month: number): string {
  return new Date(year, month, 0).toISOString().slice(0, 10);
}

export function createApp(db: Db) {
  const app = new Hono();

  app.use("/dist.css", serveStatic({ path: "./public/dist.css" }));

  app.get("/", (c) => {
    const today = new Date().toISOString().slice(0, 10);
    const mealResults = db
      .select()
      .from(meals)
      .where(gte(meals.date, today))
      .orderBy(meals.date)
      .all();
    const pantryItems = db.select().from(pantry).where(eq(pantry.status, "in_stock")).all();
    return c.html(
      <Layout>
        <main class="max-w-2xl mx-auto px-4 py-8 space-y-10">
          <MealsView meals={mealResults} />
          <PantryView items={pantryItems} />
        </main>
      </Layout>,
    );
  });

  // Meal calendar
  app.get("/meals", (c) => {
    const today = new Date().toISOString().slice(0, 10);
    const monthParam = c.req.query("month") ?? today.slice(0, 7);
    const [year, month] = monthParam.split("-").map(Number);
    const from = `${monthParam}-01`;
    const to = lastDayOfMonth(year, month);
    const mealResults = db
      .select()
      .from(meals)
      .where(and(gte(meals.date, from), lte(meals.date, to)))
      .orderBy(meals.date)
      .all();
    return c.html(
      <Layout>
        <MealsCalendar meals={mealResults} year={year} month={month} />
      </Layout>,
    );
  });

  // Meal new
  app.get("/meals/new", (c) => {
    const date = c.req.query("date");
    return c.html(
      <MealForm
        action="/meals"
        title="Add meal"
        cancelHref="/"
        item={date ? { date } : undefined}
      />,
    );
  });

  app.post("/meals", async (c) => {
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

  // Meal detail
  app.get("/meals/:id", (c) => {
    const item = db
      .select()
      .from(meals)
      .where(eq(meals.id, Number(c.req.param("id"))))
      .get();
    if (!item) return c.notFound();
    return c.html(<MealDetail item={item} />);
  });

  // Meal edit
  app.get("/meals/:id/edit", (c) => {
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

  app.post("/meals/:id", async (c) => {
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

  // Pantry new
  app.get("/pantry/new", (c) =>
    c.html(<PantryForm action="/pantry" title="Add item" cancelHref="/" />),
  );

  app.post("/pantry", async (c) => {
    const body = await c.req.parseBody();
    db.insert(pantry)
      .values({
        name: String(body["name"]),
        quantity: Number(body["quantity"]),
        unit: body["unit"] ? String(body["unit"]) : null,
        purchased_at: String(body["purchased_at"]),
        best_before_days: body["best_before_days"] ? Number(body["best_before_days"]) : null,
        status: "in_stock",
      })
      .run();
    return c.redirect("/");
  });

  // Pantry detail
  app.get("/pantry/:id", (c) => {
    const item = db
      .select()
      .from(pantry)
      .where(eq(pantry.id, Number(c.req.param("id"))))
      .get();
    if (!item) return c.notFound();
    return c.html(<PantryDetail item={item} />);
  });

  // Pantry edit
  app.get("/pantry/:id/edit", (c) => {
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

  app.post("/pantry/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.parseBody();
    db.update(pantry)
      .set({
        name: String(body["name"]),
        quantity: Number(body["quantity"]),
        unit: body["unit"] ? String(body["unit"]) : null,
        purchased_at: String(body["purchased_at"]),
        best_before_days: body["best_before_days"] ? Number(body["best_before_days"]) : null,
      })
      .where(eq(pantry.id, id))
      .run();
    return c.redirect(`/pantry/${id}`);
  });

  // Consume
  app.post("/pantry/:id/consume", (c) => {
    db.update(pantry)
      .set({ status: "consumed" })
      .where(eq(pantry.id, Number(c.req.param("id"))))
      .run();
    return c.redirect("/");
  });

  return app;
}

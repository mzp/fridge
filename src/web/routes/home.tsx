import { and, eq, gte, isNotNull, isNull } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { meals, pantry, pantryLogs } from "@/db/schema.js";
import { Meal } from "@/model/meal.js";
import { PantryItem } from "@/model/pantry-item.js";
import { Layout } from "@/web/views/layout.js";
import { MealsList } from "@/web/views/meals/list.js";
import { PantryList } from "@/web/views/pantry/list.js";
import { ShoppingSummary } from "@/web/views/shopping/summary.js";

export function createHomeRoutes(db: Db) {
  const app = new Hono();

  app.get("/", (c) => {
    const today = Meal.todayString();
    const twoDaysAgo = Meal.daysBeforeToday(2);
    const mealResults = db
      .select()
      .from(meals)
      .where(gte(meals.date, twoDaysAgo))
      .orderBy(meals.date)
      .all()
      .map((item) => new Meal(item));
    const pantryItems = db
      .select()
      .from(pantry)
      .where(and(eq(pantry.status, "in_stock"), isNotNull(pantry.stock_date)))
      .all()
      .map((item) => new PantryItem(item))
      .sort(PantryItem.compareByExpiry);
    const shoppingItems = db
      .select()
      .from(pantry)
      .where(and(isNull(pantry.stock_date), eq(pantry.status, "in_stock")))
      .orderBy(pantry.id)
      .all()
      .map((item) => new PantryItem(item));
    const usedIds = new Set(
      db
        .select({ pantry_id: pantryLogs.pantry_id })
        .from(pantryLogs)
        .all()
        .map((r) => r.pantry_id),
    );
    return c.html(
      <Layout>
        <main class="max-w-2xl mx-auto px-4 py-8 space-y-10">
          <MealsList meals={mealResults} today={today} />
          <ShoppingSummary items={shoppingItems} />
          <PantryList category="prepared" items={pantryItems} usedIds={usedIds} />
          <PantryList category="ingredient" items={pantryItems} usedIds={usedIds} />
        </main>
      </Layout>,
    );
  });

  return app;
}

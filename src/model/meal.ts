import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db/index.js";
import { meals } from "@/db/schema.js";
import { todayString } from "@/lib/date.js";

export type MealRecord = typeof meals.$inferSelect;

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Build a partial update from only the categories the caller passed.
// Omitted categories are left out (so they keep their value); "" clears one.
function buildPatch(dishes: Dishes): Partial<typeof meals.$inferInsert> {
  const patch: Partial<typeof meals.$inferInsert> = {};
  if (dishes.main !== undefined) patch.main = dishes.main;
  for (const key of ["rice", "hot_side", "cold_side", "soup"] as const) {
    const value = dishes[key];
    if (value !== undefined) patch[key] = value === "" ? null : value;
  }
  return patch;
}

// Outcome of Meal.batchSave: the affected meal, or null when creation was refused.
// Internal to this module; callers consume it through the inferred return type.
type MealSaveResult =
  | { action: "created" | "updated" | "unchanged"; meal: Meal }
  | { action: "error"; meal: null };

// Dish categories of a meal. Doubles as a set_meal patch (any subset to change)
// and as the nested dishes of MealJson; unset categories are simply absent.
export interface Dishes {
  main?: string | undefined;
  rice?: string | undefined;
  hot_side?: string | undefined;
  cold_side?: string | undefined;
  soup?: string | undefined;
}

// The JSON shape of a meal, as produced by Meal.toJson().
export interface MealJson {
  id: number;
  date: string;
  weekday: string;
  dishes: Dishes;
}

// Runtime validator for the same shape (used as the MCP tools' outputSchema).
export const mealJson = z.object({
  id: z.number(),
  date: z.string(),
  weekday: z.string(),
  dishes: z.object({
    main: z.string().optional(),
    rice: z.string().optional(),
    hot_side: z.string().optional(),
    cold_side: z.string().optional(),
    soup: z.string().optional(),
  }),
});

export class Meal {
  constructor(readonly record: MealRecord) {}

  toJson(): MealJson {
    return {
      id: this.record.id,
      date: this.record.date,
      weekday: this.weekdayLabel(),
      dishes: {
        main: this.record.main,
        rice: this.record.rice ?? undefined,
        hot_side: this.record.hot_side ?? undefined,
        cold_side: this.record.cold_side ?? undefined,
        soup: this.record.soup ?? undefined,
      },
    };
  }

  weekdayLabel(): string {
    const [y, m, d] = this.record.date.split("-").map(Number) as [number, number, number];
    return WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()] ?? "";
  }

  isPast(today = todayString()): boolean {
    return this.record.date < today;
  }

  detailPath(): string {
    return `/meals/${this.record.id}`;
  }

  editPath(): string {
    return `/meals/${this.record.id}/edit`;
  }

  deletePath(): string {
    return `/meals/${this.record.id}/delete`;
  }

  // Create or partially update the meal for a date. Only categories present in
  // `dishes` change; "" clears a category. Creating a new meal requires `main`.
  static batchSave(db: Db, date: string, dishes: Dishes): MealSaveResult {
    const patch = buildPatch(dishes);
    const existing = db.select().from(meals).where(eq(meals.date, date)).get();
    if (existing) {
      if (Object.keys(patch).length === 0) {
        return { action: "unchanged", meal: new Meal(existing) };
      }
      const updated = db
        .update(meals)
        .set(patch)
        .where(eq(meals.id, existing.id))
        .returning()
        .get();
      return { action: "updated", meal: new Meal(updated) };
    }
    if (dishes.main === undefined) {
      return { action: "error", meal: null };
    }
    const inserted = db
      .insert(meals)
      .values({
        date,
        main: dishes.main,
        rice: dishes.rice ?? null,
        hot_side: dishes.hot_side ?? null,
        cold_side: dishes.cold_side ?? null,
        soup: dishes.soup ?? null,
      })
      .returning()
      .get();
    return { action: "created", meal: new Meal(inserted) };
  }
}

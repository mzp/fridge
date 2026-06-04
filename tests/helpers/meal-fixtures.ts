import type { MealRecord } from "@/model/meal.js";

// Shared meal-record fixture with sensible defaults; override any field.
export function mealFixture(overrides: Partial<MealRecord> = {}): MealRecord {
  return {
    id: 1,
    date: "2026-05-15",
    rice: null,
    main: "カレーライス",
    hot_side: null,
    cold_side: null,
    soup: null,
    ...overrides,
  };
}

import type { Meal } from "@/model/meal.js";

// Display-label helpers for meals. Formatting lives in the view layer; the Meal
// model holds only business data.

export function riceLabel(meal: Meal, fallback = ""): string {
  return meal.record.rice ?? fallback;
}

export function hotSideLabel(meal: Meal, fallback = ""): string {
  return meal.record.hot_side ?? fallback;
}

export function coldSideLabel(meal: Meal, fallback = ""): string {
  return meal.record.cold_side ?? fallback;
}

export function soupLabel(meal: Meal, fallback = ""): string {
  return meal.record.soup ?? fallback;
}

// All sides and soup (plus rice), joined for a compact summary.
export function sidesLabel(meal: Meal, fallback = "", separator = " / "): string {
  const sides = [
    meal.record.rice,
    meal.record.hot_side,
    meal.record.cold_side,
    meal.record.soup,
  ].filter((dish): dish is string => Boolean(dish));
  return sides.length > 0 ? sides.join(separator) : fallback;
}

// Just the warm and cold sides (excludes rice and soup), joined for display.
export function warmColdSidesLabel(meal: Meal, fallback = "", separator = " / "): string {
  const sides = [meal.record.hot_side, meal.record.cold_side].filter((dish): dish is string =>
    Boolean(dish),
  );
  return sides.length > 0 ? sides.join(separator) : fallback;
}

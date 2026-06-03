import type { meals } from "@/db/schema.js";

export type MealRecord = typeof meals.$inferSelect;

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class Meal {
  constructor(readonly record: MealRecord) {}

  weekdayLabel(): string {
    const [y, m, d] = this.record.date.split("-").map(Number) as [number, number, number];
    return WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()] ?? "";
  }

  summaryLabel(): string {
    const parts = [
      this.record.main,
      this.record.rice,
      this.record.hot_side,
      this.record.cold_side,
      this.record.soup,
    ].filter((dish): dish is string => Boolean(dish));
    return `${this.record.date}: ${parts.join(" | ")}`;
  }

  riceLabel(fallback = ""): string {
    return this.record.rice ?? fallback;
  }

  hotSideLabel(fallback = ""): string {
    return this.record.hot_side ?? fallback;
  }

  coldSideLabel(fallback = ""): string {
    return this.record.cold_side ?? fallback;
  }

  soupLabel(fallback = ""): string {
    return this.record.soup ?? fallback;
  }

  isPast(today = Meal.todayString()): boolean {
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

  static todayString(date = new Date()): string {
    return date.toISOString().slice(0, 10);
  }

  static daysBeforeToday(days: number, date = new Date()): string {
    return new Date(date.getTime() - days * 86400000).toISOString().slice(0, 10);
  }
}

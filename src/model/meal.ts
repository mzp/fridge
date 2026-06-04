import type { meals } from "@/db/schema.js";
import { pick } from "@/lib/pick.js";

export type MealRecord = typeof meals.$inferSelect;

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class Meal {
  constructor(readonly record: MealRecord) {}

  toJson() {
    return {
      ...pick(this.record, "id", "date", "main", "rice", "hot_side", "cold_side", "soup"),
      weekday: this.weekdayLabel(),
    };
  }

  weekdayLabel(): string {
    const [y, m, d] = this.record.date.split("-").map(Number) as [number, number, number];
    return WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()] ?? "";
  }

  summaryLabel(): string {
    const entries: Array<[string, string | null]> = [
      ["main", this.record.main],
      ["rice", this.record.rice],
      ["hot_side", this.record.hot_side],
      ["cold_side", this.record.cold_side],
      ["soup", this.record.soup],
    ];
    const parts = entries
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([category, dish]) => `${category}=${dish}`);
    return `${this.record.date}: ${parts.join(", ")}`;
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

  sidesLabel(fallback = "", separator = " / "): string {
    const sides = [
      this.record.rice,
      this.record.hot_side,
      this.record.cold_side,
      this.record.soup,
    ].filter((dish): dish is string => Boolean(dish));
    return sides.length > 0 ? sides.join(separator) : fallback;
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

import type { meals } from "@/db/schema.js";

export type MealRecord = typeof meals.$inferSelect;

export class Meal {
  constructor(readonly record: MealRecord) {}

  summaryLabel(): string {
    return this.record.side_dish
      ? `${this.record.date}: ${this.record.main_dish} | ${this.record.side_dish}`
      : `${this.record.date}: ${this.record.main_dish}`;
  }

  sideDishLabel(fallback = ""): string {
    return this.record.side_dish ?? fallback;
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

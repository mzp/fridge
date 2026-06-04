import { describe, expect, it } from "vitest";
import { Meal, type MealRecord } from "@/model/meal.js";

function meal(overrides: Partial<MealRecord> = {}): MealRecord {
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

describe("Meal", () => {
  it("serializes to JSON with dishes nested and empty categories omitted", () => {
    expect(new Meal(meal({ id: 3, main: "鮭の塩焼き", hot_side: "肉じゃが" })).toJson()).toEqual({
      id: 3,
      date: "2026-05-15",
      weekday: "Fri",
      dishes: { main: "鮭の塩焼き", hot_side: "肉じゃが" },
    });
  });

  it("returns the weekday label for the meal date", () => {
    expect(new Meal(meal({ date: "2026-05-15" })).weekdayLabel()).toBe("Fri");
    expect(new Meal(meal({ date: "2026-05-16" })).weekdayLabel()).toBe("Sat");
    expect(new Meal(meal({ date: "2026-05-17" })).weekdayLabel()).toBe("Sun");
  });

  it("checks whether the meal date is in the past", () => {
    expect(new Meal(meal()).isPast("2026-05-16")).toBe(true);
    expect(new Meal(meal()).isPast("2026-05-15")).toBe(false);
  });

  it("builds route paths", () => {
    const model = new Meal(meal({ id: 12 }));

    expect(model.detailPath()).toBe("/meals/12");
    expect(model.editPath()).toBe("/meals/12/edit");
    expect(model.deletePath()).toBe("/meals/12/delete");
  });
});

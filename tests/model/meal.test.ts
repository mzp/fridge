import { describe, expect, it } from "vitest";
import { Meal, type MealRecord } from "@/model/meal.js";

function meal(overrides: Partial<MealRecord> = {}): MealRecord {
  return {
    id: 1,
    date: "2026-05-15",
    main_dish: "カレーライス",
    side_dish: null,
    ...overrides,
  };
}

describe("Meal", () => {
  it("formats meal summaries with optional side dish", () => {
    expect(new Meal(meal()).summaryLabel()).toBe("2026-05-15: カレーライス");
    expect(new Meal(meal({ side_dish: "サラダ" })).summaryLabel()).toBe(
      "2026-05-15: カレーライス | サラダ",
    );
  });

  it("provides side dish labels with a fallback", () => {
    expect(new Meal(meal()).sideDishLabel("—")).toBe("—");
    expect(new Meal(meal({ side_dish: "サラダ" })).sideDishLabel("—")).toBe("サラダ");
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

  it("formats dates for today and relative cutoffs", () => {
    const now = new Date("2026-05-16T12:00:00.000Z");

    expect(Meal.todayString(now)).toBe("2026-05-16");
    expect(Meal.daysBeforeToday(2, now)).toBe("2026-05-14");
  });
});

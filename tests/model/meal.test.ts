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
  it("formats meal summaries with each dish labeled by category", () => {
    expect(new Meal(meal()).summaryLabel()).toBe("2026-05-15: main=カレーライス");
    expect(new Meal(meal({ hot_side: "きんぴら" })).summaryLabel()).toBe(
      "2026-05-15: main=カレーライス, hot_side=きんぴら",
    );
    expect(
      new Meal(
        meal({ rice: "白米", hot_side: "きんぴら", cold_side: "おひたし", soup: "味噌汁" }),
      ).summaryLabel(),
    ).toBe(
      "2026-05-15: main=カレーライス, rice=白米, hot_side=きんぴら, cold_side=おひたし, soup=味噌汁",
    );
  });

  it("provides category dish labels with a fallback", () => {
    expect(new Meal(meal()).hotSideLabel("—")).toBe("—");
    expect(new Meal(meal({ hot_side: "きんぴら" })).hotSideLabel("—")).toBe("きんぴら");
    expect(new Meal(meal({ rice: "白米" })).riceLabel("—")).toBe("白米");
    expect(new Meal(meal({ cold_side: "サラダ" })).coldSideLabel("—")).toBe("サラダ");
    expect(new Meal(meal({ soup: "味噌汁" })).soupLabel("—")).toBe("味噌汁");
  });

  it("joins all sides and soup for the dashboard, with a fallback when empty", () => {
    expect(new Meal(meal()).sidesLabel("—")).toBe("—");
    expect(
      new Meal(
        meal({ rice: "白米", hot_side: "きんぴら", cold_side: "サラダ", soup: "味噌汁" }),
      ).sidesLabel(),
    ).toBe("白米 / きんぴら / サラダ / 味噌汁");
    expect(new Meal(meal({ soup: "味噌汁" })).sidesLabel()).toBe("味噌汁");
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

  it("formats dates for today and relative cutoffs", () => {
    const now = new Date("2026-05-16T12:00:00.000Z");

    expect(Meal.todayString(now)).toBe("2026-05-16");
    expect(Meal.daysBeforeToday(2, now)).toBe("2026-05-14");
  });
});

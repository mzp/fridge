import { createTestDb } from "@test/helpers/db.js";
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

describe("Meal.batchSave", () => {
  it("creates a new meal when none exists for the date", () => {
    const db = createTestDb();

    const result = Meal.batchSave(db, "2026-05-15", { main: "カレーライス", soup: "味噌汁" });

    expect(result.action).toBe("created");
    expect(result.meal?.record).toMatchObject({
      date: "2026-05-15",
      main: "カレーライス",
      rice: null,
      hot_side: null,
      cold_side: null,
      soup: "味噌汁",
    });
  });

  it("refuses to create a meal without a main dish and persists nothing", () => {
    const db = createTestDb();

    const result = Meal.batchSave(db, "2026-05-15", { cold_side: "サラダ" });

    expect(result).toEqual({ action: "error", meal: null });
    expect(Meal.batchSave(db, "2026-05-15", {}).action).toBe("error");
  });

  it("partially updates an existing meal, preserving omitted categories", () => {
    const db = createTestDb();
    Meal.batchSave(db, "2026-05-15", { main: "鮭の塩焼き", soup: "味噌汁" });

    const result = Meal.batchSave(db, "2026-05-15", { cold_side: "ほうれん草のおひたし" });

    expect(result.action).toBe("updated");
    expect(result.meal?.record).toMatchObject({
      main: "鮭の塩焼き",
      cold_side: "ほうれん草のおひたし",
      soup: "味噌汁",
    });
  });

  it("clears a category when passed an empty string", () => {
    const db = createTestDb();
    Meal.batchSave(db, "2026-05-15", { main: "鮭の塩焼き", soup: "味噌汁" });

    const result = Meal.batchSave(db, "2026-05-15", { soup: "" });

    expect(result.action).toBe("updated");
    expect(result.meal?.record.soup).toBeNull();
  });

  it("reports no change when the patch is empty", () => {
    const db = createTestDb();
    Meal.batchSave(db, "2026-05-15", { main: "カレーライス" });

    const result = Meal.batchSave(db, "2026-05-15", {});

    expect(result.action).toBe("unchanged");
    expect(result.meal?.record.main).toBe("カレーライス");
  });
});

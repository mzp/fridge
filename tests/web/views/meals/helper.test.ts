import { mealFixture } from "@test/helpers/meal-fixtures.js";
import { describe, expect, it } from "vitest";
import { Meal, type MealRecord } from "@/model/meal.js";
import {
  coldSideLabel,
  hotSideLabel,
  riceLabel,
  sidesLabel,
  soupLabel,
  warmColdSidesLabel,
} from "@/web/views/meals/helper.js";

function meal(overrides: Partial<MealRecord> = {}): Meal {
  return new Meal(mealFixture(overrides));
}

describe("meal label helpers", () => {
  it("returns per-category labels with a fallback", () => {
    expect(hotSideLabel(meal(), "—")).toBe("—");
    expect(hotSideLabel(meal({ hot_side: "きんぴら" }), "—")).toBe("きんぴら");
    expect(riceLabel(meal({ rice: "白米" }), "—")).toBe("白米");
    expect(coldSideLabel(meal({ cold_side: "サラダ" }), "—")).toBe("サラダ");
    expect(soupLabel(meal({ soup: "味噌汁" }), "—")).toBe("味噌汁");
  });

  it("joins all sides and soup, with a fallback when empty", () => {
    expect(sidesLabel(meal(), "—")).toBe("—");
    expect(
      sidesLabel(meal({ rice: "白米", hot_side: "きんぴら", cold_side: "サラダ", soup: "味噌汁" })),
    ).toBe("白米 / きんぴら / サラダ / 味噌汁");
    expect(sidesLabel(meal({ soup: "味噌汁" }))).toBe("味噌汁");
  });

  it("joins only the warm and cold sides, excluding rice and soup", () => {
    expect(warmColdSidesLabel(meal(), "—")).toBe("—");
    expect(
      warmColdSidesLabel(
        meal({ rice: "白米", hot_side: "きんぴら", cold_side: "サラダ", soup: "味噌汁" }),
      ),
    ).toBe("きんぴら / サラダ");
    expect(warmColdSidesLabel(meal({ hot_side: "肉じゃが" }))).toBe("肉じゃが");
  });
});

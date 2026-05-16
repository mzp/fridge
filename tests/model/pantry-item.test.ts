import { describe, expect, it } from "vitest";
import { PantryItem, type PantryItemRecord } from "@/model/pantry-item.js";

function item(overrides: Partial<PantryItemRecord> = {}): PantryItemRecord {
  return {
    id: 1,
    name: "卵",
    quantity: 6,
    unit: "個",
    stock_date: "2026-05-15",
    best_before_days: 7,
    status: "in_stock",
    category: "ingredient",
    ...overrides,
  };
}

describe("PantryItem", () => {
  it("calculates expiry days from stock date and best-before days", () => {
    const pantryItem = new PantryItem(item());

    expect(pantryItem.daysRemaining(new Date("2026-05-16T12:00:00"))).toBe(6);
  });

  it("returns no expiry when best-before days are missing", () => {
    const pantryItem = new PantryItem(item({ best_before_days: null }));

    expect(pantryItem.expiresAt()).toBeNull();
    expect(pantryItem.daysRemaining()).toBeNull();
    expect(pantryItem.expiryStatus()).toBe("none");
  });

  it("classifies expired, soon, and fresh items", () => {
    const pantryItem = new PantryItem(item());

    expect(pantryItem.expiryStatus(new Date("2026-05-23T12:00:00"))).toBe("expired");
    expect(pantryItem.expiryStatus(new Date("2026-05-20T12:00:00"))).toBe("soon");
    expect(pantryItem.expiryStatus(new Date("2026-05-16T12:00:00"))).toBe("fresh");
  });

  it("sorts items with expiry first and items without expiry last", () => {
    const earliest = item({ id: 1, stock_date: "2026-05-10", best_before_days: 2 });
    const latest = item({ id: 2, stock_date: "2026-05-15", best_before_days: 7 });
    const noExpiry = item({ id: 3, best_before_days: null });

    expect(
      [latest, noExpiry, earliest]
        .map((record) => new PantryItem(record))
        .sort(PantryItem.compareByExpiry)
        .map((i) => i.record.id),
    ).toEqual([1, 2, 3]);
  });

  it("formats quantities and deltas with the item unit", () => {
    const pantryItem = new PantryItem(item({ unit: "個" }));

    expect(pantryItem.quantityLabel()).toBe("6個");
    expect(pantryItem.quantityLabel(2)).toBe("2個");
    expect(pantryItem.deltaLabel(-2)).toBe("-2個");
    expect(pantryItem.deltaLabel(3)).toBe("+3個");
  });

  it("calculates consumption quantity and status", () => {
    const pantryItem = new PantryItem(item({ quantity: 6, status: "in_stock" }));

    expect(pantryItem.consume({ quantityUsed: 2 })).toEqual({
      actualUsed: 2,
      newQuantity: 4,
      newStatus: "in_stock",
      consumed: false,
    });
    expect(pantryItem.consume({ useAll: true })).toEqual({
      actualUsed: 6,
      newQuantity: 0,
      newStatus: "consumed",
      consumed: true,
    });
  });

  it("normalizes and matches pantry categories", () => {
    expect(PantryItem.normalizeCategory("prepared")).toBe("prepared");
    expect(PantryItem.normalizeCategory("other")).toBe("ingredient");
    expect(new PantryItem(item({ category: "prepared" })).belongsToCategory("prepared")).toBe(true);
    expect(new PantryItem(item({ category: "ingredient" })).belongsToCategory("ingredient")).toBe(
      true,
    );
  });
});

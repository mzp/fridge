import { describe, expect, it } from "vitest";
import { pick } from "@/lib/pick.js";

describe("pick", () => {
  it("keeps only the listed keys", () => {
    const source = { id: 1, name: "卵", quantity: 6, secret: "internal" };
    expect(pick(source, "id", "name")).toEqual({ id: 1, name: "卵" });
  });

  it("preserves null and falsy values for listed keys", () => {
    const source = { unit: null, quantity: 0, note: "" };
    expect(pick(source, "unit", "quantity", "note")).toEqual({
      unit: null,
      quantity: 0,
      note: "",
    });
  });

  it("returns an empty object when no keys are given", () => {
    expect(pick({ a: 1, b: 2 })).toEqual({});
  });

  it("does not mutate or alias the source object", () => {
    const source = { id: 1, name: "卵" };
    const result = pick(source, "id");
    result.id = 2;
    expect(source.id).toBe(1);
  });

  it("sets a listed-but-absent key to undefined", () => {
    const source = { id: 1 } as { id: number; name?: string };
    expect(pick(source, "id", "name")).toStrictEqual({ id: 1, name: undefined });
  });
});

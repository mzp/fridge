import { describe, expect, it } from "vitest";
import { add } from "@/math.js";

describe("add", () => {
  it("adds two positive numbers", () => {
    expect(add(1, 2)).toBe(3);
  });

  it("adds two negative numbers", () => {
    expect(add(-1, -2)).toBe(-3);
  });
});

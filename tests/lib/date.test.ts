import { describe, expect, it } from "vitest";
import { daysBeforeToday, todayString } from "@/lib/date.js";

describe("date helpers", () => {
  it("formats dates for today and relative cutoffs", () => {
    const now = new Date("2026-05-16T12:00:00.000Z");

    expect(todayString(now)).toBe("2026-05-16");
    expect(daysBeforeToday(2, now)).toBe("2026-05-14");
  });
});

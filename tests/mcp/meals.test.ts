import { createTestDb } from "@test/helpers/db.js";
import { createTestClient } from "@test/helpers/mcp.js";
import { describe, expect, it } from "vitest";
import { registerMealTools } from "@/mcp/meals.js";

describe("get_meals", () => {
  it("returns meals set via set_meal within the date range", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main: "カレーライス" },
    });
    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-16", main: "肉じゃが", cold_side: "ほうれん草のおひたし" },
    });
    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-17", main: "鮭の塩焼き" },
    });

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-16" },
    });

    expect(result.structuredContent).toEqual({
      meals: [
        { id: 1, date: "2026-05-15", weekday: "Fri", dishes: { main: "カレーライス" } },
        {
          id: 2,
          date: "2026-05-16",
          weekday: "Sat",
          dishes: { main: "肉じゃが", cold_side: "ほうれん草のおひたし" },
        },
      ],
    });
  });

  it("returns an empty list when range has no meals", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main: "カレーライス" },
    });

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-01-01", to: "2026-01-31" },
    });

    expect(result.structuredContent).toEqual({ meals: [] });
  });

  it("reflects updates made via set_meal", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    const added = await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main: "カレーライス" },
    });
    expect(added.structuredContent).toEqual({
      ok: true,
      action: "created",
      message: "Added meal for 2026-05-15.",
      meal: { id: 1, date: "2026-05-15", weekday: "Fri", dishes: { main: "カレーライス" } },
    });

    const updated = await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main: "ビーフカレー", cold_side: "サラダ" },
    });
    expect(updated.structuredContent).toEqual({
      ok: true,
      action: "updated",
      message: "Updated meal for 2026-05-15.",
      meal: {
        id: 1,
        date: "2026-05-15",
        weekday: "Fri",
        dishes: { main: "ビーフカレー", cold_side: "サラダ" },
      },
    });

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-15" },
    });

    expect(result.structuredContent).toEqual({
      meals: [
        {
          id: 1,
          date: "2026-05-15",
          weekday: "Fri",
          dishes: { main: "ビーフカレー", cold_side: "サラダ" },
        },
      ],
    });
  });

  it("refuses to create a new meal without a main dish", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    const result = await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", cold_side: "サラダ" },
    });
    expect(result.structuredContent).toEqual({
      ok: false,
      action: "error",
      message: "Cannot create a meal for 2026-05-15 without a main dish.",
      meal: null,
    });
  });
});

describe("delete_meal", () => {
  it("deletes a meal and removes it from get_meals", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main: "カレーライス" },
    });
    const result = await client.callTool({
      name: "delete_meal",
      arguments: { date: "2026-05-15" },
    });
    expect(result.structuredContent).toEqual({
      ok: true,
      action: "deleted",
      message: "Deleted meal for 2026-05-15.",
      meal: { id: 1, date: "2026-05-15", weekday: "Fri", dishes: { main: "カレーライス" } },
    });

    const list = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-15" },
    });
    expect(list.structuredContent).toEqual({ meals: [] });
  });

  it("returns not found for unknown date", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    const result = await client.callTool({
      name: "delete_meal",
      arguments: { date: "2026-01-01" },
    });
    expect(result.structuredContent).toEqual({
      ok: false,
      action: "not_found",
      message: "No meal found for 2026-01-01.",
      meal: null,
    });
  });
});

import { createTestDb } from "@test/helpers/db.js";
import { createTestClient } from "@test/helpers/mcp.js";
import { describe, expect, it } from "vitest";
import { registerMealTools } from "@/mcp/meals.js";

describe("get_meals", () => {
  it("returns meals set via set_meal within the date range", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "カレーライス" },
    });
    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-16", main_dish: "肉じゃが", side_dish: "ほうれん草のおひたし" },
    });
    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-17", main_dish: "鮭の塩焼き" },
    });

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-16" },
    });

    expect(result.content).toEqual([
      {
        type: "text",
        text: "2026-05-15: カレーライス\n2026-05-16: 肉じゃが | ほうれん草のおひたし",
      },
    ]);
  });

  it("returns no meals message when range has no meals", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "カレーライス" },
    });

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-01-01", to: "2026-01-31" },
    });

    expect(result.content).toEqual([
      {
        type: "text",
        text: "No meals found for the specified date range.",
      },
    ]);
  });

  it("reflects overwrites made via set_meal", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    const added = await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "カレーライス" },
    });
    expect(added.content).toEqual([{ type: "text", text: "Added meal: 2026-05-15: カレーライス" }]);

    const updated = await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "ビーフカレー", side_dish: "サラダ" },
    });
    expect(updated.content).toEqual([
      { type: "text", text: "Updated meal: 2026-05-15: ビーフカレー | サラダ" },
    ]);

    const result = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-15" },
    });

    expect(result.content).toEqual([{ type: "text", text: "2026-05-15: ビーフカレー | サラダ" }]);
  });
});

describe("delete_meal", () => {
  it("deletes a meal and removes it from get_meals", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    await client.callTool({
      name: "set_meal",
      arguments: { date: "2026-05-15", main_dish: "カレーライス" },
    });
    const result = await client.callTool({
      name: "delete_meal",
      arguments: { date: "2026-05-15" },
    });
    expect(result.content).toEqual([
      { type: "text", text: "Deleted meal: 2026-05-15: カレーライス" },
    ]);

    const list = await client.callTool({
      name: "get_meals",
      arguments: { from: "2026-05-15", to: "2026-05-15" },
    });
    expect(list.content).toEqual([
      { type: "text", text: "No meals found for the specified date range." },
    ]);
  });

  it("returns not found for unknown date", async () => {
    const client = await createTestClient(createTestDb(), registerMealTools);

    const result = await client.callTool({
      name: "delete_meal",
      arguments: { date: "2026-01-01" },
    });
    expect(result.content).toEqual([{ type: "text", text: "No meal found for 2026-01-01." }]);
  });
});

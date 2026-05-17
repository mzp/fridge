import { Meal } from "@/model/meal.js";

const RESET_URL = "http://localhost:3001/__test__/reset";

export async function resetDb(): Promise<void> {
  const res = await fetch(RESET_URL, { method: "POST" });
  if (!res.ok) {
    throw new Error(`reset failed: HTTP ${res.status}`);
  }
}

export const TODAY = Meal.todayString();
export const FUTURE_DATE = Meal.daysBeforeToday(-365);

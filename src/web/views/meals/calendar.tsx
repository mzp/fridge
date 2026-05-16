import type { FC } from "hono/jsx";
import { Meal } from "@/model/meal.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function prevMonthParam(year: number, month: number): string {
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${pad(month - 1)}`;
}

function nextMonthParam(year: number, month: number): string {
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${pad(month + 1)}`;
}

function buildWeeks(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayMon = (firstDayJS + 6) % 7;

  const cells: (number | null)[] = Array.from<null>({ length: firstDayMon }).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const DayCell: FC<{
  day: number;
  month: number;
  year: number;
  meal: Meal | undefined;
  today: string;
}> = ({ day, month, year, meal, today }) => {
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const past = dateStr < today;
  const opacity = past ? " opacity-40" : "";
  if (meal) {
    return (
      <td class={`border border-gray-100 h-16 p-1 align-top${opacity}`}>
        <div class="text-xs text-gray-400 mb-1">{day}</div>
        <a
          href={meal.detailPath()}
          class="text-xs text-emerald-700 hover:underline leading-tight block break-words"
        >
          {meal.record.main_dish}
        </a>
      </td>
    );
  }
  return (
    <td class={`border border-gray-100 h-16 p-1 align-top${opacity}`}>
      <a href={`/meals/new?date=${dateStr}`} class="block w-full h-full hover:bg-gray-50">
        <div class="text-xs text-gray-400">{day}</div>
      </a>
    </td>
  );
};

export const MealsCalendar: FC<{ meals: Meal[]; year: number; month: number }> = ({
  meals,
  year,
  month,
}) => {
  const today = Meal.todayString();
  const mealMap = new Map(meals.map((m) => [m.record.date, m]));
  const weeks = buildWeeks(year, month);
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <main class="max-w-2xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <a
          href={`/meals?month=${prevMonthParam(year, month)}`}
          class="text-gray-500 hover:text-emerald-600 px-2"
        >
          ←
        </a>
        <h1 class="text-xl font-bold text-emerald-600">{monthLabel}</h1>
        <a
          href={`/meals?month=${nextMonthParam(year, month)}`}
          class="text-gray-500 hover:text-emerald-600 px-2"
        >
          →
        </a>
      </div>
      <div class="flex justify-end mb-4">
        <a
          href="/meals/new"
          class="text-sm bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
        >
          Add meal
        </a>
      </div>
      <table class="w-full table-fixed border-collapse">
        <colgroup>
          {DAY_NAMES.map((d) => (
            <col key={d} class="w-[14.285714%]" />
          ))}
        </colgroup>
        <thead>
          <tr>
            {DAY_NAMES.map((d) => (
              <th
                key={d}
                class="text-center text-xs text-gray-500 font-medium py-2 border-b border-gray-200"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) =>
                day === null ? (
                  <td key={di} class="border border-gray-100 h-16 p-1 bg-gray-50" />
                ) : (
                  <DayCell
                    key={di}
                    day={day}
                    month={month}
                    year={year}
                    meal={mealMap.get(`${year}-${pad(month)}-${pad(day)}`)}
                    today={today}
                  />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

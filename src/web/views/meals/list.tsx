import type { FC } from "hono/jsx";
import type { Meal } from "@/model/meal.js";

export const MealsList: FC<{ meals: Meal[]; today: string }> = ({ meals, today }) => (
  <section>
    <div class="mb-4">
      <h2 class="section-title">Meals</h2>
    </div>
    {meals.length === 0 ? (
      <p class="muted-text">No meals planned.</p>
    ) : (
      <table class="data-table">
        <thead>
          <tr class="data-table-head">
            <th class="data-table-heading">Date</th>
            <th class="data-table-heading">Main</th>
            <th class="data-table-heading">Side</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((m) => {
            const past = m.isPast(today);
            const href = m.detailPath();
            const linkClass = "block py-2 hover:text-emerald-600";
            return (
              <tr key={m.record.id} class={`data-table-row ${past ? "opacity-40" : ""}`}>
                <td class="pr-4 text-gray-600">
                  <a href={href} class={linkClass}>
                    {m.record.date}
                  </a>
                </td>
                <td class="pr-4">
                  <a href={href} class={linkClass}>
                    {m.record.main_dish}
                  </a>
                </td>
                <td class="text-gray-500">
                  <a href={href} class={linkClass}>
                    {m.sideDishLabel()}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </section>
);

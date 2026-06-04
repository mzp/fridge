import type { FC } from "hono/jsx";
import type { Meal } from "@/model/meal.js";
import { riceLabel, soupLabel, warmColdSidesLabel } from "@/web/views/meals/helper.js";

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
            <th class="data-table-heading">Rice</th>
            <th class="data-table-heading">Sides</th>
            <th class="data-table-heading">Soup</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((m) => {
            const past = m.isPast(today);
            const href = m.detailPath();
            const linkClass = "block py-2 hover:text-emerald-600";
            return (
              <tr key={m.record.id} class={`data-table-row ${past ? "is-past" : ""}`}>
                <td class="pr-4 text-gray-600">
                  <a href={href} class={linkClass}>
                    {m.record.date} ({m.weekdayLabel()})
                  </a>
                </td>
                <td class="pr-4">
                  <a href={href} class={linkClass}>
                    {m.record.main}
                  </a>
                </td>
                <td class="pr-4 text-gray-500">
                  <a href={href} class={linkClass}>
                    {riceLabel(m)}
                  </a>
                </td>
                <td class="pr-4 text-gray-500">
                  <a href={href} class={linkClass}>
                    {warmColdSidesLabel(m)}
                  </a>
                </td>
                <td class="text-gray-500">
                  <a href={href} class={linkClass}>
                    {soupLabel(m)}
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

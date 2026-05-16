import type { FC } from "hono/jsx";
import type { meals as mealsTable } from "@/db/schema.js";

type Meal = typeof mealsTable.$inferSelect;

export const MealsView: FC<{ meals: Meal[]; today: string }> = ({ meals, today }) => (
  <section>
    <div class="mb-4">
      <h2 class="text-xl font-bold text-emerald-600">Meals</h2>
    </div>
    {meals.length === 0 ? (
      <p class="text-gray-500">No meals planned.</p>
    ) : (
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="py-2 pr-4 text-gray-500 font-medium">Date</th>
            <th class="py-2 pr-4 text-gray-500 font-medium">Main</th>
            <th class="py-2 text-gray-500 font-medium">Side</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((m) => {
            const past = m.date < today;
            const href = `/meals/${m.id}`;
            const linkClass = "block py-2 hover:text-emerald-600";
            return (
              <tr key={m.id} class={`border-b border-gray-100 ${past ? "opacity-40" : ""}`}>
                <td class="pr-4 text-gray-600">
                  <a href={href} class={linkClass}>
                    {m.date}
                  </a>
                </td>
                <td class="pr-4">
                  <a href={href} class={linkClass}>
                    {m.main_dish}
                  </a>
                </td>
                <td class="text-gray-500">
                  <a href={href} class={linkClass}>
                    {m.side_dish ?? ""}
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

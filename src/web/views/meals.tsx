import type { FC } from "hono/jsx";

type Meal = {
  id: number;
  date: string;
  main_dish: string;
  side_dish: string | null;
};

export const MealsView: FC<{ meals: Meal[] }> = ({ meals }) => (
  <section>
    <h2 class="text-xl font-bold text-emerald-600 mb-4">Meals</h2>
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
          {meals.map((m) => (
            <tr key={m.id} class="border-b border-gray-100">
              <td class="py-2 pr-4 text-gray-600">{m.date}</td>
              <td class="py-2 pr-4">{m.main_dish}</td>
              <td class="py-2 text-gray-500">{m.side_dish ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </section>
);

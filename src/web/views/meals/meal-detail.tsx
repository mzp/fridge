import type { FC } from "hono/jsx";
import type { pantry, pantryLogs } from "@/db/schema.js";
import type { Meal } from "@/model/meal.js";
import { PantryItem } from "@/model/pantry-item.js";
import { Layout } from "@/web/views/layout.js";

type PantryUsageEntry = Pick<typeof pantry.$inferSelect, "id" | "name" | "unit"> &
  Pick<typeof pantryLogs.$inferSelect, "delta" | "note">;

export const MealDetail: FC<{ item: Meal; pantryUsage: PantryUsageEntry[] }> = ({
  item,
  pantryUsage,
}) => (
  <Layout>
    <main class="max-w-lg mx-auto px-4 py-8">
      <a href="/" class="text-sm text-gray-400 hover:text-gray-600">
        ← Back
      </a>
      <h1 class="text-2xl font-bold text-emerald-600 mt-2 mb-6">{item.record.date}</h1>
      <dl class="space-y-3 text-sm mb-8">
        <div class="flex gap-4">
          <dt class="w-24 text-gray-500">Main dish</dt>
          <dd>{item.record.main_dish}</dd>
        </div>
        <div class="flex gap-4">
          <dt class="w-24 text-gray-500">Side dish</dt>
          <dd>{item.sideDishLabel("—")}</dd>
        </div>
      </dl>
      <div class="flex gap-3">
        <a
          href={item.editPath()}
          class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          Edit
        </a>
        <form method="post" action={item.deletePath()}>
          <button
            type="submit"
            class="border border-red-300 px-4 py-2 rounded text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </form>
      </div>
      {pantryUsage.length > 0 && (
        <section class="mt-10">
          <h2 class="text-sm font-medium text-gray-500 mb-3">Pantry used</h2>
          <ul class="space-y-1 text-sm">
            {pantryUsage.map((entry, i) => {
              const qty = PantryItem.formatQuantity(Math.abs(entry.delta), entry.unit);
              return (
                <li key={i} class="flex gap-2 text-gray-700">
                  <a
                    href={`/pantry/${entry.id}`}
                    class="font-medium hover:text-emerald-600 hover:underline"
                  >
                    {entry.name}
                  </a>
                  <span class="text-gray-400">{qty}</span>
                  {entry.note && <span class="text-gray-400">— {entry.note}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  </Layout>
);

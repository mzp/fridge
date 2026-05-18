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
    <main class="page">
      <a href="/" class="back-link">
        ← Back
      </a>
      <h1 class="page-title mt-2">{item.record.date}</h1>
      <dl class="detail-list">
        <div class="detail-row">
          <dt class="detail-label w-24">Main dish</dt>
          <dd>{item.record.main_dish}</dd>
        </div>
        <div class="detail-row">
          <dt class="detail-label w-24">Side dish</dt>
          <dd>{item.sideDishLabel("—")}</dd>
        </div>
      </dl>
      <div class="flex gap-3">
        <a href={item.editPath()} class="btn-primary">
          Edit
        </a>
        <form method="post" action={item.deletePath()}>
          <button type="submit" class="btn-danger">
            Delete
          </button>
        </form>
      </div>
      {pantryUsage.length > 0 && (
        <section class="mt-10">
          <h2 class="subsection-title">Pantry used</h2>
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

import type { FC } from "hono/jsx";
import type { pantryLogs } from "@/db/schema.js";
import type { PantryItem } from "@/model/pantry-item.js";
import { Layout } from "@/web/views/layout.js";

type PantryLog = typeof pantryLogs.$inferSelect;

export const PantryDetail: FC<{
  item: PantryItem;
  logs: PantryLog[];
  mealsByDate: Record<string, { id: number; main_dish: string }>;
}> = ({ item, logs, mealsByDate }) => {
  const days = item.daysRemaining();

  return (
    <Layout>
      <main class="page">
        <a href="/" class="back-link">
          ← Back
        </a>
        <h1 class="page-title mt-2">{item.record.name}</h1>
        <dl class="detail-list">
          <div class="detail-row">
            <dt class="detail-label w-32">Quantity</dt>
            <dd>{item.quantityLabel()}</dd>
          </div>
          <div class="detail-row">
            <dt class="detail-label w-32">Stock date</dt>
            <dd>{item.record.stock_date}</dd>
          </div>
          <div class="detail-row">
            <dt class="detail-label w-32">Best before</dt>
            <dd>
              {item.record.best_before_days == null ? "—" : `${item.record.best_before_days} days`}
            </dd>
          </div>
          {days != null && (
            <div class="detail-row">
              <dt class="detail-label w-32">Expires in</dt>
              <dd
                class={
                  days < 0
                    ? "text-red-600 font-medium"
                    : days <= 3
                      ? "text-yellow-600 font-medium"
                      : ""
                }
              >
                {days < 0 ? "Expired" : `${days} days`}
              </dd>
            </div>
          )}
        </dl>
        <div class="flex gap-3 mb-10">
          <a href={`/pantry/${item.record.id}/edit`} class="btn-primary">
            Edit
          </a>
          <form method="post" action={`/pantry/${item.record.id}/consume`}>
            <button type="submit" class="btn-outline">
              Mark as consumed
            </button>
          </form>
          <form
            method="post"
            action={`/pantry/${item.record.id}/delete`}
            onsubmit={`return confirm('Delete ${item.record.name}?')`}
          >
            <button type="submit" class="btn-danger">
              Delete
            </button>
          </form>
        </div>
        <section>
          <h2 class="subsection-title">Usage log</h2>
          {logs.length === 0 ? (
            <p class="text-sm text-gray-400">No usage logged yet.</p>
          ) : (
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="py-2 pr-4 text-gray-500 font-medium">Date</th>
                  <th class="py-2 pr-4 text-gray-500 font-medium">Change</th>
                  <th class="py-2 text-gray-500 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} class="border-b border-gray-100">
                    <td class="py-2 pr-4 text-gray-600">
                      {log.recorded_at}
                      {mealsByDate[log.recorded_at] != null && (
                        <a
                          href={`/meals/${mealsByDate[log.recorded_at]?.id}`}
                          class="ml-2 text-emerald-600 hover:underline"
                        >
                          {mealsByDate[log.recorded_at]?.main_dish}
                        </a>
                      )}
                    </td>
                    <td
                      class={`py-2 pr-4 font-medium ${log.delta < 0 ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {item.deltaLabel(log.delta)}
                    </td>
                    <td class="py-2 text-gray-500">{log.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </Layout>
  );
};

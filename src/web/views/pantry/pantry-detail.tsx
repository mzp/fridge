import type { FC } from "hono/jsx";
import type { pantry, pantryLogs } from "@/db/schema.js";
import { Layout } from "@/web/views/layout.js";

type PantryItem = typeof pantry.$inferSelect;
type PantryLog = typeof pantryLogs.$inferSelect;

function daysRemaining(purchasedAt: string, bestBeforeDays: number): number {
  const purchased = new Date(purchasedAt).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((purchased + bestBeforeDays * 86400000 - today) / 86400000);
}

function formatDeltaLabel(delta: number, unit: string | null): string {
  const abs = Math.abs(delta);
  const qty = unit ? `${abs}${unit}` : String(abs);
  return delta >= 0 ? `+${qty}` : `-${qty}`;
}

export const PantryDetail: FC<{
  item: PantryItem;
  logs: PantryLog[];
  mealsByDate: Record<string, { id: number; main_dish: string }>;
}> = ({ item, logs, mealsByDate }) => {
  const days =
    item.best_before_days == null ? null : daysRemaining(item.purchased_at, item.best_before_days);

  return (
    <Layout>
      <main class="max-w-lg mx-auto px-4 py-8">
        <a href="/" class="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </a>
        <h1 class="text-2xl font-bold text-emerald-600 mt-2 mb-6">{item.name}</h1>
        <dl class="space-y-3 text-sm mb-8">
          <div class="flex gap-4">
            <dt class="w-32 text-gray-500">Quantity</dt>
            <dd>
              {item.quantity}
              {item.unit ?? ""}
            </dd>
          </div>
          <div class="flex gap-4">
            <dt class="w-32 text-gray-500">Purchased at</dt>
            <dd>{item.purchased_at}</dd>
          </div>
          <div class="flex gap-4">
            <dt class="w-32 text-gray-500">Best before</dt>
            <dd>{item.best_before_days == null ? "—" : `${item.best_before_days} days`}</dd>
          </div>
          {days != null && (
            <div class="flex gap-4">
              <dt class="w-32 text-gray-500">Expires in</dt>
              <dd
                class={
                  days <= 0
                    ? "text-red-600 font-medium"
                    : days <= 3
                      ? "text-yellow-600 font-medium"
                      : ""
                }
              >
                {days <= 0 ? "Expired" : `${days} days`}
              </dd>
            </div>
          )}
        </dl>
        <div class="flex gap-3 mb-10">
          <a
            href={`/pantry/${item.id}/edit`}
            class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Edit
          </a>
          <form method="post" action={`/pantry/${item.id}/consume`}>
            <button
              type="submit"
              class="border border-gray-300 px-4 py-2 rounded text-gray-600 hover:bg-gray-50"
            >
              Mark as consumed
            </button>
          </form>
        </div>
        <section>
          <h2 class="text-sm font-medium text-gray-500 mb-3">Usage log</h2>
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
                      {formatDeltaLabel(log.delta, item.unit)}
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

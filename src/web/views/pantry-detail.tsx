import type { FC } from "hono/jsx";
import { Layout } from "@/web/views/layout.js";

type PantryItem = {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  purchased_at: string;
  best_before_days: number | null;
  status: string;
};

function daysRemaining(purchasedAt: string, bestBeforeDays: number): number {
  const purchased = new Date(purchasedAt).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((purchased + bestBeforeDays * 86400000 - today) / 86400000);
}

export const PantryDetail: FC<{ item: PantryItem }> = ({ item }) => {
  const days =
    item.best_before_days != null ? daysRemaining(item.purchased_at, item.best_before_days) : null;

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
            <dd>
              {item.best_before_days != null ? `${item.best_before_days} days` : "—"}
            </dd>
          </div>
          {days != null && (
            <div class="flex gap-4">
              <dt class="w-32 text-gray-500">Expires in</dt>
              <dd class={days <= 0 ? "text-red-600 font-medium" : days <= 3 ? "text-yellow-600 font-medium" : ""}>
                {days <= 0 ? "Expired" : `${days} days`}
              </dd>
            </div>
          )}
        </dl>
        <div class="flex gap-3">
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
      </main>
    </Layout>
  );
};

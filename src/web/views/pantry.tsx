import type { FC } from "hono/jsx";

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

export const PantryView: FC<{ items: PantryItem[] }> = ({ items }) => (
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-emerald-600">Pantry</h2>
      <a href="/pantry/new" class="text-sm bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700">
        Add item
      </a>
    </div>
    {items.length === 0 ? (
      <p class="text-gray-500">No items in stock.</p>
    ) : (
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="py-2 pr-4 text-gray-500 font-medium">Item</th>
            <th class="py-2 pr-4 text-gray-500 font-medium">Qty</th>
            <th class="py-2 pr-4 text-gray-500 font-medium">Purchased</th>
            <th class="py-2 text-gray-500 font-medium">Expires in</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const days =
              item.best_before_days != null
                ? daysRemaining(item.purchased_at, item.best_before_days)
                : null;
            const rowClass =
              days != null && days <= 0
                ? "border-b border-gray-100 bg-red-50"
                : days != null && days <= 3
                  ? "border-b border-gray-100 bg-yellow-50"
                  : "border-b border-gray-100";
            const daysLabel = days == null ? "" : days <= 0 ? "Expired" : `${days}d`;
            return (
              <tr key={item.id} class={rowClass}>
                <td class="py-2 pr-4">
                  <a href={`/pantry/${item.id}`} class="hover:text-emerald-600 hover:underline">
                    {item.name}
                  </a>
                </td>
                <td class="py-2 pr-4 text-gray-600">
                  {item.quantity}
                  {item.unit ?? ""}
                </td>
                <td class="py-2 pr-4 text-gray-600">{item.purchased_at}</td>
                <td class="py-2 text-gray-600">{daysLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </section>
);

import type { FC } from "hono/jsx";
import type { pantry } from "@/db/schema.js";

type PantryItem = typeof pantry.$inferSelect;

function daysRemaining(purchasedAt: string, bestBeforeDays: number): number {
  const purchased = new Date(purchasedAt).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((purchased + bestBeforeDays * 86400000 - today) / 86400000);
}

function rowClass(days: number | null): string {
  if (days != null && days <= 0) return "border-b border-gray-100 bg-red-50";
  if (days != null && days <= 3) return "border-b border-gray-100 bg-yellow-50";
  return "border-b border-gray-100";
}

function daysLabel(days: number | null): string {
  if (days == null) return "";
  if (days <= 0) return "Expired";
  return `${days}d`;
}

const PantryRow: FC<{ item: PantryItem; used: boolean }> = ({ item, used }) => {
  const days =
    item.best_before_days == null ? null : daysRemaining(item.purchased_at, item.best_before_days);
  return (
    <tr key={item.id} class={rowClass(days)}>
      <td class="py-2 pr-4">
        <a href={`/pantry/${item.id}`} class="hover:text-emerald-600 hover:underline">
          {item.name}
        </a>
        {used && (
          <span class="ml-2 text-xs text-gray-400 border border-gray-200 rounded px-1">使用中</span>
        )}
      </td>
      <td class="py-2 pr-4 text-gray-600">
        {item.quantity}
        {item.unit ?? ""}
      </td>
      <td class="py-2 pr-4 text-gray-600">{item.purchased_at}</td>
      <td class="py-2 text-gray-600">{daysLabel(days)}</td>
    </tr>
  );
};

export const PantryView: FC<{ items: PantryItem[]; usedIds: Set<number> }> = ({ items, usedIds }) => (
  <section>
    <div class="mb-4">
      <h2 class="text-xl font-bold text-emerald-600">Pantry</h2>
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
          {items.map((item) => (
            <PantryRow key={item.id} item={item} used={usedIds.has(item.id)} />
          ))}
        </tbody>
      </table>
    )}
  </section>
);

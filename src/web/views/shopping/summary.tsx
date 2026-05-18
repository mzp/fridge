import type { FC } from "hono/jsx";
import type { PantryItem } from "@/model/pantry-item.js";

export const ShoppingSummary: FC<{ items: PantryItem[] }> = ({ items }) => (
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-emerald-600">Shopping list</h2>
      <a href="/shopping" class="text-sm text-emerald-600 hover:underline">
        View all →
      </a>
    </div>
    {items.length === 0 ? (
      <p class="text-gray-500">Shopping list is empty.</p>
    ) : (
      <ul class="divide-y divide-gray-200 bg-white rounded border border-gray-200">
        {items.map((item) => (
          <li key={item.record.id} class="flex items-center gap-3 px-4 py-3">
            <div class="flex-1">
              <div class="font-medium">{item.record.name}</div>
              <div class="text-sm text-gray-500">{item.quantityLabel()}</div>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

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
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="py-2 pr-4 text-gray-500 font-medium">Item</th>
            <th class="py-2 text-gray-500 font-medium">Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.record.id} class="border-b border-gray-100">
              <td class="pr-4 py-2">{item.record.name}</td>
              <td class="py-2 text-gray-600">{item.quantityLabel()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </section>
);

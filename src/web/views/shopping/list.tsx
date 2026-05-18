import type { FC } from "hono/jsx";
import type { PantryItem } from "@/model/pantry-item.js";
import { Layout } from "@/web/views/layout.js";

export const ShoppingList: FC<{ items: PantryItem[] }> = ({ items }) => (
  <Layout>
    <main class="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-emerald-600">Shopping list</h1>
        <a
          href="/shopping/new"
          class="bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700 text-sm"
        >
          + Add item
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
              <form method="post" action={`/shopping/${item.record.id}/purchase`}>
                <button
                  type="submit"
                  class="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 text-sm"
                >
                  Purchase
                </button>
              </form>
              <form method="post" action={`/shopping/${item.record.id}/delete`}>
                <button
                  type="submit"
                  class="border border-gray-300 text-gray-600 px-3 py-1 rounded hover:bg-gray-100 text-sm"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  </Layout>
);

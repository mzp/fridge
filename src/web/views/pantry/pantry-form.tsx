import type { FC } from "hono/jsx";
import type { pantry } from "@/db/schema.js";
import { Layout } from "@/web/views/layout.js";

type PantryItem = Partial<typeof pantry.$inferSelect>;

export const PantryForm: FC<{
  item?: PantryItem;
  action: string;
  title: string;
  cancelHref: string;
}> = ({ item, action, title, cancelHref }) => (
  <Layout>
    <main class="max-w-lg mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-emerald-600 mb-6">{title}</h1>
      <form method="post" action={action} class="space-y-4">
        <div>
          <label for="name" class="block text-sm text-gray-500 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={item?.name ?? ""}
            required
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label for="quantity" class="block text-sm text-gray-500 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={item?.quantity ?? ""}
              required
              min="0"
              class="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div class="flex-1">
            <label for="unit" class="block text-sm text-gray-500 mb-1">
              Unit
            </label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={item?.unit ?? ""}
              placeholder="個, ml, g …"
              class="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label for="purchased_at" class="block text-sm text-gray-500 mb-1">
            Purchased at
          </label>
          <input
            type="date"
            id="purchased_at"
            name="purchased_at"
            value={item?.purchased_at ?? ""}
            required
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label for="best_before_days" class="block text-sm text-gray-500 mb-1">
            Best before (days)
          </label>
          <input
            type="number"
            id="best_before_days"
            name="best_before_days"
            value={item?.best_before_days ?? ""}
            min="1"
            placeholder="leave blank if unknown"
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Save
          </button>
          <a href={cancelHref} class="px-4 py-2 text-gray-500 hover:text-gray-700">
            Cancel
          </a>
        </div>
      </form>
    </main>
  </Layout>
);

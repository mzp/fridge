import type { FC } from "hono/jsx";
import { Layout } from "@/web/views/layout.js";

type PantryItem = {
  id?: number;
  name?: string;
  quantity?: number;
  unit?: string | null;
  purchased_at?: string;
  best_before_days?: number | null;
};

export const PantryForm: FC<{ item?: PantryItem; action: string; title: string }> = ({
  item,
  action,
  title,
}) => (
  <Layout>
    <main class="max-w-lg mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-emerald-600 mb-6">{title}</h1>
      <form method="post" action={action} class="space-y-4">
        <div>
          <label class="block text-sm text-gray-500 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={item?.name ?? ""}
            required
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-sm text-gray-500 mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={item?.quantity ?? ""}
              required
              min="0"
              class="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm text-gray-500 mb-1">Unit</label>
            <input
              type="text"
              name="unit"
              value={item?.unit ?? ""}
              placeholder="個, ml, g …"
              class="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-500 mb-1">Purchased at</label>
          <input
            type="date"
            name="purchased_at"
            value={item?.purchased_at ?? ""}
            required
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-500 mb-1">Best before (days)</label>
          <input
            type="number"
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
          <a href="/" class="px-4 py-2 text-gray-500 hover:text-gray-700">
            Cancel
          </a>
        </div>
      </form>
    </main>
  </Layout>
);

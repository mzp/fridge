import type { FC } from "hono/jsx";
import { Layout } from "@/web/views/layout.js";

export const ShoppingForm: FC = () => (
  <Layout>
    <main class="max-w-lg mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-emerald-600 mb-6">Add to shopping list</h1>
      <form method="post" action="/shopping" class="space-y-4">
        <div>
          <label for="name" class="block text-sm text-gray-500 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
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
              value="1"
              required
              min="1"
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
              placeholder="個, ml, g …"
              class="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Add
          </button>
          <a href="/shopping" class="px-4 py-2 text-gray-500 hover:text-gray-700">
            Cancel
          </a>
        </div>
      </form>
    </main>
  </Layout>
);

import type { FC } from "hono/jsx";
import type { meals } from "@/db/schema.js";
import { Layout } from "@/web/views/layout.js";

type Meal = Partial<typeof meals.$inferSelect>;

export const MealForm: FC<{ item?: Meal; action: string; title: string; cancelHref: string }> = ({
  item,
  action,
  title,
  cancelHref,
}) => (
  <Layout>
    <main class="max-w-lg mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-emerald-600 mb-6">{title}</h1>
      <form method="post" action={action} class="space-y-4">
        <div>
          <label for="date" class="block text-sm text-gray-500 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={item?.date ?? ""}
            required
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label for="main_dish" class="block text-sm text-gray-500 mb-1">
            Main dish
          </label>
          <input
            type="text"
            id="main_dish"
            name="main_dish"
            value={item?.main_dish ?? ""}
            required
            class="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label for="side_dish" class="block text-sm text-gray-500 mb-1">
            Side dish
          </label>
          <input
            type="text"
            id="side_dish"
            name="side_dish"
            value={item?.side_dish ?? ""}
            placeholder="optional"
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

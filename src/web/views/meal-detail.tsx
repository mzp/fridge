import type { FC } from "hono/jsx";
import type { meals } from "@/db/schema.js";
import { Layout } from "@/web/views/layout.js";

type Meal = typeof meals.$inferSelect;

export const MealDetail: FC<{ item: Meal }> = ({ item }) => (
  <Layout>
    <main class="max-w-lg mx-auto px-4 py-8">
      <a href="/" class="text-sm text-gray-400 hover:text-gray-600">
        ← Back
      </a>
      <h1 class="text-2xl font-bold text-emerald-600 mt-2 mb-6">{item.date}</h1>
      <dl class="space-y-3 text-sm mb-8">
        <div class="flex gap-4">
          <dt class="w-24 text-gray-500">Main dish</dt>
          <dd>{item.main_dish}</dd>
        </div>
        <div class="flex gap-4">
          <dt class="w-24 text-gray-500">Side dish</dt>
          <dd>{item.side_dish ?? "—"}</dd>
        </div>
      </dl>
      <a
        href={`/meals/${item.id}/edit`}
        class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
      >
        Edit
      </a>
    </main>
  </Layout>
);

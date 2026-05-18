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
    <main class="page">
      <h1 class="page-title">{title}</h1>
      <form method="post" action={action} class="space-y-4">
        <div>
          <label for="date" class="form-label">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={item?.date ?? ""}
            required
            class="form-control"
          />
        </div>
        <div>
          <label for="main_dish" class="form-label">
            Main dish
          </label>
          <input
            type="text"
            id="main_dish"
            name="main_dish"
            value={item?.main_dish ?? ""}
            required
            class="form-control"
          />
        </div>
        <div>
          <label for="side_dish" class="form-label">
            Side dish
          </label>
          <input
            type="text"
            id="side_dish"
            name="side_dish"
            value={item?.side_dish ?? ""}
            placeholder="optional"
            class="form-control"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">
            Save
          </button>
          <a href={cancelHref} class="btn-secondary">
            Cancel
          </a>
        </div>
      </form>
    </main>
  </Layout>
);

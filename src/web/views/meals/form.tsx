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
          <label for="main" class="form-label">
            Main
          </label>
          <input
            type="text"
            id="main"
            name="main"
            value={item?.main ?? ""}
            required
            class="form-control"
          />
        </div>
        <div>
          <label for="rice" class="form-label">
            Rice
          </label>
          <input
            type="text"
            id="rice"
            name="rice"
            value={item?.rice ?? ""}
            placeholder="optional"
            class="form-control"
          />
        </div>
        <div>
          <label for="hot_side" class="form-label">
            Hot side
          </label>
          <input
            type="text"
            id="hot_side"
            name="hot_side"
            value={item?.hot_side ?? ""}
            placeholder="optional"
            class="form-control"
          />
        </div>
        <div>
          <label for="cold_side" class="form-label">
            Cold side
          </label>
          <input
            type="text"
            id="cold_side"
            name="cold_side"
            value={item?.cold_side ?? ""}
            placeholder="optional"
            class="form-control"
          />
        </div>
        <div>
          <label for="soup" class="form-label">
            Soup
          </label>
          <input
            type="text"
            id="soup"
            name="soup"
            value={item?.soup ?? ""}
            placeholder="optional"
            class="form-control"
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-md btn-primary">
            Save
          </button>
          <a href={cancelHref} class="btn btn-md btn-cancel">
            Cancel
          </a>
        </div>
      </form>
    </main>
  </Layout>
);

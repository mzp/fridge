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
    <main class="page">
      <h1 class="page-title">{title}</h1>
      <form method="post" action={action} class="space-y-4">
        <div>
          <label for="name" class="form-label">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={item?.name ?? ""}
            required
            class="form-control"
          />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label for="quantity" class="form-label">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={item?.quantity ?? ""}
              required
              min="0"
              class="form-control"
            />
          </div>
          <div class="flex-1">
            <label for="unit" class="form-label">
              Unit
            </label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={item?.unit ?? ""}
              placeholder="個, ml, g …"
              class="form-control"
            />
          </div>
        </div>
        <div>
          <label for="stock_date" class="form-label">
            Stock date
          </label>
          <input
            type="date"
            id="stock_date"
            name="stock_date"
            value={item?.stock_date ?? ""}
            required
            class="form-control"
          />
        </div>
        <div>
          <label for="best_before_days" class="form-label">
            Best before (days)
          </label>
          <input
            type="number"
            id="best_before_days"
            name="best_before_days"
            value={item?.best_before_days ?? ""}
            min="1"
            placeholder="leave blank if unknown"
            class="form-control"
          />
        </div>
        <div>
          <label for="category" class="form-label">
            Category
          </label>
          <select id="category" name="category" class="form-control bg-white">
            <option value="ingredient" selected={item?.category !== "prepared"}>
              Ingredient
            </option>
            <option value="prepared" selected={item?.category === "prepared"}>
              Prepared dish
            </option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-md btn-primary">
            Save
          </button>
          <a href={cancelHref} class="btn btn-md btn-secondary">
            Cancel
          </a>
        </div>
      </form>
    </main>
  </Layout>
);

import type { FC } from "hono/jsx";
import type { pantry } from "@/db/schema.js";
import { Layout } from "@/web/views/layout.js";

type ShoppingItem = Partial<typeof pantry.$inferSelect>;

export const ShoppingForm: FC<{
  item?: ShoppingItem;
  action: string;
  title: string;
  submitLabel: string;
  cancelHref: string;
}> = ({ item, action, title, submitLabel, cancelHref }) => (
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
              value={item?.quantity ?? 1}
              required
              min="1"
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
        <div class="form-actions">
          <button type="submit" class="btn btn-md btn-primary">
            {submitLabel}
          </button>
          <a href={cancelHref} class="btn btn-md btn-secondary">
            Cancel
          </a>
        </div>
      </form>
    </main>
  </Layout>
);

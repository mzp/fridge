import type { FC } from "hono/jsx";
import type { PantryItem } from "@/model/pantry-item.js";
import { Layout } from "@/web/views/layout.js";

export const ShoppingDetail: FC<{ item: PantryItem }> = ({ item }) => (
  <Layout>
    <main class="page">
      <a href="/shopping" class="back-link">
        ← Back
      </a>
      <h1 class="page-title mt-2">{item.record.name}</h1>
      <dl class="detail-list">
        <div class="detail-row">
          <dt class="detail-label w-24">Quantity</dt>
          <dd>{item.quantityLabel()}</dd>
        </div>
      </dl>
      <div class="flex gap-3">
        <a href={`/shopping/${item.record.id}/edit`} class="btn btn-md btn-primary">
          Edit
        </a>
        <form method="post" action={`/shopping/${item.record.id}/purchase`}>
          <button type="submit" class="btn btn-md btn-outline">
            Purchase
          </button>
        </form>
        <form
          method="post"
          action={`/shopping/${item.record.id}/delete`}
          onsubmit={`return confirm('Remove ${item.record.name}?')`}
        >
          <button type="submit" class="btn btn-md btn-danger">
            Remove
          </button>
        </form>
      </div>
    </main>
  </Layout>
);

import type { FC } from "hono/jsx";
import type { PantryItem } from "@/model/pantry-item.js";

export const ShoppingList: FC<{ items: PantryItem[] }> = ({ items }) => (
  <section>
    <div class="flex items-center justify-between mb-4">
      <h2 class="section-title">Shopping list</h2>
      <a href="/shopping/new" class="btn btn-md btn-primary">
        + Add item
      </a>
    </div>
    {items.length === 0 ? (
      <p class="muted-text">Shopping list is empty.</p>
    ) : (
      <table class="data-table">
        <thead>
          <tr class="data-table-head">
            <th class="data-table-heading">Item</th>
            <th class="data-table-heading">Qty</th>
            <th class="data-table-heading text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const href = `/shopping/${item.record.id}`;
            const linkClass = "block py-2 hover:text-emerald-600";
            return (
              <tr key={item.record.id} class="data-table-row">
                <td class="pr-4 font-medium">
                  <a href={href} class={linkClass}>
                    {item.record.name}
                  </a>
                </td>
                <td class="text-gray-600">
                  <a href={href} class={linkClass}>
                    {item.quantityLabel()}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </section>
);

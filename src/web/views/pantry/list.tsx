import type { FC } from "hono/jsx";
import type { PantryCategory, PantryItem } from "@/model/pantry-item.js";

function rowClass(days: number | null): string {
  if (days != null && days < 0) return "border-b border-gray-100 bg-red-50";
  if (days != null && days <= 3) return "border-b border-gray-100 bg-yellow-50";
  return "border-b border-gray-100";
}

function daysLabel(days: number | null): string {
  if (days == null) return "";
  if (days < 0) return "Expired";
  return `${days}d`;
}

const PantryRow: FC<{ item: PantryItem; used: boolean }> = ({ item, used }) => {
  const days = item.daysRemaining();
  const href = `/pantry/${item.record.id}`;
  const linkClass = "block py-2 hover:text-emerald-600";
  return (
    <tr key={item.record.id} class={rowClass(days)}>
      <td class="pr-4">
        <a href={href} class={linkClass}>
          {item.record.name}
          {used && (
            <span class="ml-2 text-xs text-gray-400 border border-gray-200 rounded px-1">
              in use
            </span>
          )}
        </a>
      </td>
      <td class="pr-4 text-gray-600">
        <a href={href} class={linkClass}>
          {item.quantityLabel()}
        </a>
      </td>
      <td class="pr-4 text-gray-600">
        <a href={href} class={linkClass}>
          {item.record.stock_date}
        </a>
      </td>
      <td class="text-gray-600">
        <a href={href} class={linkClass}>
          {daysLabel(days)}
        </a>
      </td>
    </tr>
  );
};

const PantryTable: FC<{ items: PantryItem[]; usedIds: Set<number> }> = ({ items, usedIds }) => (
  <table class="w-full text-left border-collapse">
    <thead>
      <tr class="border-b border-gray-200">
        <th class="py-2 pr-4 text-gray-500 font-medium">Item</th>
        <th class="py-2 pr-4 text-gray-500 font-medium">Qty</th>
        <th class="py-2 pr-4 text-gray-500 font-medium">Stocked</th>
        <th class="py-2 text-gray-500 font-medium">Expires in</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <PantryRow key={item.record.id} item={item} used={usedIds.has(item.record.id)} />
      ))}
    </tbody>
  </table>
);

export const PantryList: FC<{
  items: PantryItem[];
  usedIds: Set<number>;
  category: PantryCategory;
}> = ({ items, usedIds, category }) => {
  const filtered = items.filter((i) => i.belongsToCategory(category));
  const title = category === "prepared" ? "Prepared dishes" : "Ingredients";

  return (
    <section>
      <h2 class="text-xl font-bold text-emerald-600 mb-4">{title}</h2>
      {filtered.length === 0 ? (
        <p class="text-gray-500">No items.</p>
      ) : (
        <PantryTable items={filtered} usedIds={usedIds} />
      )}
    </section>
  );
};

import { int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const meals = sqliteTable("meals", {
  id: int().primaryKey({ autoIncrement: true }),
  date: text().notNull(),
  main_dish: text().notNull(),
  side_dish: text(),
});

export const pantry = sqliteTable(
  "pantry",
  {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    quantity: int().notNull(),
    unit: text(),
    stock_date: text(),
    best_before_days: int(),
    status: text().notNull().default("in_stock"),
    category: text().notNull().default("ingredient"),
  },
  (t) => [uniqueIndex("pantry_name_date_idx").on(t.name, t.stock_date)],
);

export const pantryLogs = sqliteTable("pantry_logs", {
  id: int().primaryKey({ autoIncrement: true }),
  pantry_id: int()
    .notNull()
    .references(() => pantry.id),
  delta: int().notNull(),
  recorded_at: text().notNull(),
  note: text(),
});

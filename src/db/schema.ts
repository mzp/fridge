import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const meals = sqliteTable("meals", {
  id: int().primaryKey({ autoIncrement: true }),
  date: text().notNull(),
  name: text().notNull(),
});

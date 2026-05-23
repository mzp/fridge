import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "@/db/index.js";

export function runMigrations(): void {
  db.run(sql`PRAGMA foreign_keys = OFF`);
  migrate(db, { migrationsFolder: "db/migrations" });
  db.run(sql`PRAGMA foreign_keys = ON`);
}

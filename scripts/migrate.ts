import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "@/db/index.js";

db.run(sql`PRAGMA foreign_keys = OFF`);
migrate(db, { migrationsFolder: "db/migrations" });
db.run(sql`PRAGMA foreign_keys = ON`);
console.log("migrate done");

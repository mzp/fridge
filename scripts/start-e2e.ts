import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "@/db/index.js";

migrate(db, { migrationsFolder: "db/migrations" });

await import("@/web/index.js");

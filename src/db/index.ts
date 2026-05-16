import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const dbPath = process.env["DATABASE_PATH"] ?? "db/fridge.db";
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });
export type Db = typeof db;

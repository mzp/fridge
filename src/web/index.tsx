import { serve } from "@hono/node-server";
import { db } from "@/db/index.js";
import { runMigrations } from "@/db/migrate.js";
import { createApp } from "@/web/app.js";

runMigrations();

const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3000;
serve({ fetch: createApp(db).fetch, port });

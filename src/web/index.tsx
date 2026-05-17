import { serve } from "@hono/node-server";
import { db } from "@/db/index.js";
import { createApp } from "@/web/app.js";

const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3000;
serve({ fetch: createApp(db).fetch, port });

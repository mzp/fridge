import { serve } from "@hono/node-server";
import { db } from "@/db/index.js";
import { createApp } from "@/web/app.js";

serve({ fetch: createApp(db).fetch, port: 3000 });

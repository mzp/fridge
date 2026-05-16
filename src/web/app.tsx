import { serveStatic } from "@hono/node-server/serve-static";
import { gte } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { meals } from "@/db/schema.js";
import { MealsView } from "./views/meals.js";

export function createApp(db: Db) {
  const app = new Hono();

  app.use("/dist.css", serveStatic({ path: "./public/dist.css" }));

  app.get("/", (c) => {
    const today = new Date().toISOString().slice(0, 10);
    const results = db.select().from(meals).where(gte(meals.date, today)).orderBy(meals.date).all();
    return c.html(<MealsView meals={results} />);
  });

  return app;
}

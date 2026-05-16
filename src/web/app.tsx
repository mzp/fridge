import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { requestLogger } from "@/web/middleware/logger.js";
import { createHomeRoutes } from "@/web/routes/home.js";
import { createMealRoutes } from "@/web/routes/meals.js";
import { createPantryRoutes } from "@/web/routes/pantry.js";

export function createApp(db: Db) {
  const app = new Hono();

  app.use("*", requestLogger);
  app.use("/dist.css", serveStatic({ path: "./public/dist.css" }));
  app.route("/", createHomeRoutes(db));
  app.route("/meals", createMealRoutes(db));
  app.route("/pantry", createPantryRoutes(db));

  return app;
}

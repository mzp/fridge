import { Hono } from "hono";

export function mountRoute(path: string, route: Hono): Hono {
  const app = new Hono();
  app.route(path, route);
  return app;
}

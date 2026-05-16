import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { Layout } from "./views/layout.js";

const app = new Hono();

app.use("/dist.css", serveStatic({ path: "./public/dist.css" }));

app.get("/", (c) =>
  c.html(
    <Layout>
      <main class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <h1 class="text-5xl font-bold text-emerald-600 mb-4">Hello</h1>
          <p class="text-gray-500 text-lg">Welcome to your Fridge</p>
        </div>
      </main>
    </Layout>,
  ),
);

serve({ fetch: app.fetch, port: 3000 });

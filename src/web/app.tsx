import { serveStatic } from "@hono/node-server/serve-static";
import { eq, gte } from "drizzle-orm";
import { Hono } from "hono";
import type { Db } from "@/db/index.js";
import { meals, pantry } from "@/db/schema.js";
import { Layout } from "@/web/views/layout.js";
import { MealsView } from "@/web/views/meals.js";
import { PantryDetail } from "@/web/views/pantry-detail.js";
import { PantryForm } from "@/web/views/pantry-form.js";
import { PantryView } from "@/web/views/pantry.js";

export function createApp(db: Db) {
  const app = new Hono();

  app.use("/dist.css", serveStatic({ path: "./public/dist.css" }));

  app.get("/", (c) => {
    const today = new Date().toISOString().slice(0, 10);
    const mealResults = db.select().from(meals).where(gte(meals.date, today)).orderBy(meals.date).all();
    const pantryItems = db.select().from(pantry).where(eq(pantry.status, "in_stock")).all();
    return c.html(
      <Layout>
        <main class="max-w-2xl mx-auto px-4 py-8 space-y-10">
          <MealsView meals={mealResults} />
          <PantryView items={pantryItems} />
        </main>
      </Layout>,
    );
  });

  // Pantry new
  app.get("/pantry/new", (c) =>
    c.html(<PantryForm action="/pantry" title="Add item" />),
  );

  app.post("/pantry", async (c) => {
    const body = await c.req.parseBody();
    db.insert(pantry)
      .values({
        name: String(body["name"]),
        quantity: Number(body["quantity"]),
        unit: body["unit"] ? String(body["unit"]) : null,
        purchased_at: String(body["purchased_at"]),
        best_before_days: body["best_before_days"] ? Number(body["best_before_days"]) : null,
        status: "in_stock",
      })
      .run();
    return c.redirect("/");
  });

  // Pantry detail
  app.get("/pantry/:id", (c) => {
    const item = db.select().from(pantry).where(eq(pantry.id, Number(c.req.param("id")))).get();
    if (!item) return c.notFound();
    return c.html(<PantryDetail item={item} />);
  });

  // Pantry edit
  app.get("/pantry/:id/edit", (c) => {
    const item = db.select().from(pantry).where(eq(pantry.id, Number(c.req.param("id")))).get();
    if (!item) return c.notFound();
    return c.html(
      <PantryForm action={`/pantry/${item.id}`} title={`Edit: ${item.name}`} item={item} />,
    );
  });

  app.post("/pantry/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.parseBody();
    db.update(pantry)
      .set({
        name: String(body["name"]),
        quantity: Number(body["quantity"]),
        unit: body["unit"] ? String(body["unit"]) : null,
        purchased_at: String(body["purchased_at"]),
        best_before_days: body["best_before_days"] ? Number(body["best_before_days"]) : null,
      })
      .where(eq(pantry.id, id))
      .run();
    return c.redirect(`/pantry/${id}`);
  });

  // Consume
  app.post("/pantry/:id/consume", (c) => {
    db.update(pantry)
      .set({ status: "consumed" })
      .where(eq(pantry.id, Number(c.req.param("id"))))
      .run();
    return c.redirect("/");
  });

  return app;
}

# ADR 003: Meal structure

## Status
Accepted

## Context

A meal was stored as just two fields: `main_dish` (required) and `side_dish`
(optional). This cannot express the *ichiju-sansai* framework (one soup, three
sides) that the planning rules assume — a meal is composed of distinct roles
(rice, main protein, warm side, cold side, soup), and a single opaque "side dish"
loses that structure.

We want each meal to carry the role of every dish so the web UI, the MCP tools, and
future planning logic (protein rotation, color balance) can reason per category.

This ADR is scoped to the meal structure, its DB representation, and the data
migration.

## Decisions

### Categories (5)

A meal is split into five role categories, organized on a temperature axis:

| category    | Role        | Includes |
|-------------|-------------|----------|
| `rice`      | Rice        | Defaults to plain white rice; donburi / takikomi rice / fried rice when notable |
| `main`      | Main        | Main protein dish (grilled fish, meat, a main-grade salad, etc.) |
| `hot_side`  | Warm side   | Warm, substantial side — simmered (nimono), stir-fried, sautéed, glacé |
| `cold_side` | Cold side   | Cold / light side — dressed dishes (aemono), pickles, salad |
| `soup`      | Soup        | Soup of any cuisine — miso soup (default), tonjiru, pot-au-feu, corn soup |

Rationale:
- **Temperature axis (warm/cold) instead of "secondary / tertiary side".** A
  "secondary side vs tertiary side" naming is opaque and mixes Japanese and Western
  dishes awkwardly. "Warm vs cold" reads naturally across cuisines and roughly tracks
  "substantial vs light".
- **"Soup" as a neutral umbrella.** A Japanese-specific "soup-and-broth" term carries
  a strong Japanese connotation; "soup" comfortably contains miso soup as one of its
  kinds while still allowing corn soup or pot-au-feu.

### The ichiju-sansai template (practical version)
```
Rice (default white rice)
+ Soup (default miso soup)
+ 1 main dish
+ 1–2 dishes from warm/cold sides, e.g. from make-ahead stock
```
On weekdays it is realistic to cook only the main and the soup, and serve the warm /
cold sides from make-ahead stock.

### DB schema

Each category is one nullable text column on the `meals` table; only `main` is
`NOT NULL`. There are no DB-level defaults — "white rice" and "miso soup" are
planning/display defaults, not stored values, so an empty column means "use the
default" rather than carrying invented data.

```ts
export const meals = sqliteTable("meals", {
  id: int().primaryKey({ autoIncrement: true }),
  date: text().notNull(),
  rice: text(),
  main: text().notNull(),
  hot_side: text(),
  cold_side: text(),
  soup: text(),
});
```

**One column per category** was chosen over a child `dishes` table (meal_id +
category + name). The child table is more flexible (multiple dishes per category)
but heavier across the schema, MCP tools, forms, and tests. One dish per category
is enough for now, and `hot_side` + `cold_side` already allow up to two sides — the
common weekday case. The child table remains an option if multi-dish categories
become necessary.

### Data migration

SQLite cannot add a `NOT NULL` column or drop columns in place, so migration `0007`
recreates the table (`CREATE __new_meals` → `INSERT … SELECT` → `DROP` → `RENAME`),
following the existing pattern in `0006`. The `INSERT … SELECT` is hand-written to
map existing data:

- `main_dish → main`
- `side_dish → hot_side`
- `rice`, `cold_side`, `soup` → `NULL`

`side_dish` maps to `hot_side` to preserve existing side-dish content under a
concrete category.

## Provisional

- The `rice` column is kept even though most meals are plain white rice; an empty
  value is treated as the white-rice default at display time.
- Planning rules (protein rotation, color balance, store-based sourcing) are not part
  of the DB schema.

## Rejected alternatives

- **"Secondary side / tertiary side" naming** — opaque about contents; the
  temperature axis is clearer across Japanese and Western dishes.
- **Structured ingredient rows on recipes** (`{name, amount, unit, …}`) — high input
  burden; out of scope for this ADR.
- **Child `dishes` table / many-to-many** — more flexible but heavier; one dish per
  category suffices today (`hot_side` + `cold_side` already cover the 1–2 sides case).

## Consequences

- `main_dish` / `side_dish` references across the model, MCP tools, web routes/views,
  and tests move to the five category columns.
- `Meal.summaryLabel()` keeps the `"{date}: {main} | …"` format (main first, then the
  non-empty categories joined by `" | "`) so existing MCP output and tests stay
  backward compatible. Per-category label helpers (`riceLabel`, `hotSideLabel`,
  `coldSideLabel`, `soupLabel`) back the web views.

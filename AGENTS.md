# Fridge

For the human-facing quick start (commands, log tailing) see [`README.md`](./README.md). This file covers the conventions agents need.

## Overview

Fridge is a meal planning system with an MCP server and an web UI.

- Chat agent: plan meals, generate shopping lists, and save recipes through MCP.
- Web UI: view the meal calendar, inspect partry.

## Tech Stack

- Runtime: Node.js, managed via Volta.
- Package manager: npm.
- Web server: Hono, using SSR and REST routes.
- MCP: `@modelcontextprotocol/sdk`.
- DB ORM: Drizzle.
- DB: SQLite via `better-sqlite3`.
- CSS: Tailwind.
- Testing: Vitest.
- Lint/format: Biome.

## Repository Layout

```text
src/
  web/              Hono server process
    index.tsx       Web server entrypoint
    app.tsx         App assembly and route mounting
    routes/         Route modules grouped by feature
    views/          SSR views
  mcp/              MCP server process over stdio
    index.ts        MCP server entrypoint
    meals.ts        Meal tools
    pantry.ts       Pantry tools
    shopping.ts     Shopping list tools
  db/
    schema.ts       Drizzle schema
    index.ts        DB connection
  model/            Domain model classes and shared business rules
tests/
  mcp/              MCP tests
  routes/           Web route tests
  e2e/              Playwright E2E tests
public/             Static assets
docs/               Architecture docs and ADRs
db/migrations/      Drizzle migrations, committed to git
```

## Environment

- `.env`: local development (`npm run start:dev`). SQLite database `db/fridge.db`. Default port `3000`. Header/title show `Fridge[dev]` to distinguish from prod.
- `.env.production`: production (`npm run start` and `npm run mcp`). `DATABASE_PATH=db/fridge.prod.db`, `NODE_ENV=production`, `PORT=8080`. Committed (no secrets); per-machine overrides go in `.env.production.local`.
- `.env.test`: automated tests. `DATABASE_PATH=:memory:`. Vitest helpers also hardcode `:memory:` for direct DB construction. Playwright (`npm run start:e2e`) reads this file via `tsx --env-file`, so the E2E server runs against an in-process in-memory SQLite. The `/__test__/reset` endpoint (enabled only when `NODE_ENV=test`) lets specs clear it between tests.

Both `start:dev` and `start` auto-apply pending Drizzle migrations on entry (`src/db/migrate.ts#runMigrations`), so there is no separate migrate command to run before starting the server.

SQLite database files under `db/*.db` are generated and gitignored. Migration SQL files under `db/migrations/` should be committed.

## Commands

Run all npm commands through `volta run` so the Node.js version from `package.json` is used. Scripts marked **(internal)** are wired into other scripts — you usually don't run them directly.

### App runtime

```bash
volta run npm run start      # build TS+CSS, auto-migrate, start node on :8080 against prod DB (manual use only)
volta run npm run start:dev  # build CSS, auto-migrate, start tsx on :3000 against dev DB (manual use only)
volta run npm run mcp        # build TS, start MCP stdio server against prod DB (Claude Desktop uses this)
```

> `npm run start` is **for manual human verification only**. AI agents and automated tests (Vitest, Playwright) must not invoke it — it reads `.env.production` and writes to the prod DB. `npm run start:dev` writes to the dev DB (`db/fridge.db`); agents may run it only with explicit user permission. Playwright spawns its own server via `start:e2e`, which uses `.env.test` and an in-memory SQLite.

### TypeScript (tsc)

```bash
volta run npm run typescript:build   # (internal) tsc + tsc-alias → dist/. Invoked by start, mcp
volta run npm run typescript:check   # tsc --noEmit
```

### CSS (Tailwind)

```bash
volta run npm run css:build          # (internal) compile public/dist.css. Invoked by start, start:dev, start:e2e
```

`public/dist.css` is generated and gitignored.

### Drizzle (DB)

```bash
volta run npm run db:generate        # generate new migration SQL files from schema changes
```

### Biome (lint / format)

```bash
volta run npm run biome:lint         # biome check src tests
volta run npm run biome:format       # biome format --write src tests
```

### Tests (Vitest + Playwright)

```bash
volta run npm run test               # unit + E2E
volta run npm run test:unit          # Vitest only
volta run npm run test:e2e           # Playwright only
volta run npm run test:e2e:ui        # Playwright UI mode
volta run npm run start:e2e          # (internal) Playwright spawns this against .env.test
```

## Agent Workflows

Codex should treat these as reusable named workflows when the user asks for them.

- `precheck`: follow `.agents/workflows/precheck.md`.
- `self-review`: follow `.agents/workflows/self-review.md`. With no argument, scan files changed in the last commit. With `all`, scan all files under `src/` and `tests/`.

The shared workflow bodies live under `.agents/workflows/`. Tool-specific entrypoints under `.claude/commands/` and `.codex/prompts/` should only point to those shared files.

## MCP Configuration

MCP runs over stdio transport. `npm run mcp` builds the project and starts the MCP server against the **production** database (`db/fridge.prod.db`) by loading `.env.production`. Claude Desktop can use:

```json
{
  "mcpServers": {
    "fridge": {
      "command": "/bin/sh",
      "args": ["-c", "cd /Users/mzp/ghq/github.com/mzp/fridge && exec /Users/mzp/.volta/bin/volta run npm run --silent mcp"]
    }
  }
}
```

## Development Notes

- Prefer inferred Drizzle types from `src/db/schema.ts`, such as `typeof meals.$inferSelect` and `typeof pantry.$inferInsert`, instead of manually duplicating table-shaped types.
- Put shared business rules and model behavior, such as pantry expiry calculation, under `src/model/` instead of duplicating them in routes, views, or MCP tools.
- Keep generated artifacts out of commits unless they are migrations or intentionally tracked assets.
- Keep `CLAUDE.md`, `AGENTS.md`, and `.agents/workflows/` consistent when project structure or scripts change.

## Logging

Pino-based structured logs are written under `logs/` (gitignored).

- `logs/web.jsonl` — every HTTP request handled by the dev web server. POST/PUT/PATCH/DELETE bodies are included. `npm run start:dev` also prints the same lines to stdout in pretty format so you can watch traffic live.
- `logs/mcp.jsonl` — MCP tool invocations under dev (tool name, params, output summary, duration; stack trace on error).
- `logs/{web,mcp}-production.jsonl` — same as above but for `start:production` / `npm run mcp` (which always runs in production mode). File only — no stdout output.
- `logs/{web,mcp}-test.jsonl` — logs from the test run. `tests/helpers/setup-logs.ts` wipes `logs/*-test.jsonl` at the start of every `npm run test` so each run is fresh.

Human-facing instructions for tailing logs with `pino-pretty` live in [`README.md`](./README.md).

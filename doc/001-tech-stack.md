# ADR 001: Tech Stack

## Status
Accepted

## Context
Building a personal meal planning system with two interfaces:
- MCP server for Claude to manage meals, pantry, and shopping lists via chat
- SSR web UI to view meal calendar, recipes, and shopping list on the go

Key constraints:
- Start simple, run locally, but design for future web deployment with user auth
- TypeScript throughout for type safety
- Prefer tools with good TypeScript support over established but loosely-typed alternatives

---

## Decisions

### Runtime: Node.js (via volta)
**Chosen over**: Bun, Deno

Bun and Deno are faster and have native TypeScript support, but the MCP SDK's primary support and examples target Node.js. Since MCP integration is the core of this project, reducing risk of runtime-level incompatibilities takes priority. Volta is used for per-project Node.js version pinning via `package.json`.

### Package Manager: npm
**Chosen over**: pnpm, yarn

The project starts as a single package (no monorepo). pnpm's main advantages — disk deduplication and workspace management — don't apply here. npm is simpler and sufficient. If the project grows into a monorepo (e.g. separate web SPA), migrating to pnpm is straightforward.

yarn (both Classic and Berry) has no meaningful advantage over npm for this use case. Berry's Plug'n'Play approach adds complexity without benefit.

### Web Server: Hono
**Chosen over**: Express, Fastify

Hono is TypeScript-first with built-in JSX support for SSR, making it a natural fit for server-rendered HTML without a frontend framework. It also provides `hono/testing` for type-safe route testing and `@hono/zod-validator` for request validation. Its lightweight design aligns with the SSR-first approach.

### Rendering: SSR (Server-Side HTML) with Hono JSX
**Chosen over**: React SPA, Next.js

The web UI is primarily a read-only dashboard (meal calendar, recipe links, shopping list). Full SPA complexity is unnecessary at this stage. Hono's JSX renderer handles templating cleanly on the server. If richer interactivity is needed later, htmx can be layered in for partial updates before committing to a SPA migration.

### CSS: Tailwind + DaisyUI
**Chosen over**: CSS Modules, styled-components, Emotion

CSS-in-JS libraries are optimized for React SPA component trees and add unnecessary complexity in an SSR context. Tailwind via CDN is sufficient for local development with zero build setup. DaisyUI provides semantic component classes (card, btn, etc.) on top of Tailwind, reducing the amount of utility class composition needed for common UI patterns.

### MCP: @modelcontextprotocol/sdk (official)
The official SDK is the only reasonable choice. It provides InMemoryTransport for E2E testing without stdio, which is critical for keeping tests fast and hermetic.

### Database ORM: Drizzle
**Chosen over**: Prisma, Kysely, raw SQL

Drizzle is TypeScript-first and SQL-close, making queries readable without heavy abstraction. Crucially, it supports both SQLite and PostgreSQL with the same schema definition, enabling a clean local→production migration path. `drizzle-zod` allows automatic Zod schema generation from table definitions, reducing duplication.

Prisma's generated client and shadow database requirements add friction for a project of this scale.

### Database: SQLite → PostgreSQL
**SQLite** is used locally (file-based, zero setup) and in tests (`:memory:`, fast and hermetic).
**PostgreSQL** is the production target to support multi-user and multi-device access.

Drizzle abstracts the difference at the query level. The switch is controlled via `DATABASE_URL` / `DATABASE_PATH` environment variables.

### Validation: zod + drizzle-zod
**Chosen over**: yup, valibot, manual validation

Zod is the TypeScript validation standard. `drizzle-zod` generates Zod schemas from Drizzle table definitions, so validation rules, types, and MCP tool parameter descriptions all derive from a single source of truth. `.describe()` on Zod fields doubles as documentation for Claude when calling MCP tools.

### Testing: Vitest
**Chosen over**: Jest

Jest requires `ts-jest` or Babel configuration for TypeScript. Vitest runs TypeScript natively and shares Vite's config system. The API is Jest-compatible, so existing knowledge transfers. `hono/testing` and MCP's `InMemoryTransport` integrate cleanly with Vitest.

Test database is SQLite `:memory:` — no external process required, fully isolated per run.

### Lint/Format: Biome
**Chosen over**: ESLint + Prettier

Biome replaces both ESLint and Prettier in a single tool with zero config for TypeScript projects. It's significantly faster and eliminates the friction of keeping ESLint and Prettier rules in sync. Plugin ecosystem is smaller than ESLint, but sufficient for this project's needs.

### Logging: pino + pino-pretty
**Chosen over**: winston, console.log

pino is the fastest Node.js logger with structured JSON output suitable for production. `pino-pretty` is added as a dev dependency for human-readable local output. Log level is controlled via `LOG_LEVEL` environment variable.

---

## Consequences
- MCP tools, API routes, and DB schema share types via Drizzle → drizzle-zod → Zod pipeline
- All tests run without external services (SQLite in-memory, MCP InMemoryTransport)
- SSR-first means no build step for the UI initially; adding htmx later requires no architectural change
- Migrating to PostgreSQL in production requires Docker locally or a managed DB service (e.g. Supabase, Render)
- If a React SPA is needed later, the Hono REST API layer is already in place

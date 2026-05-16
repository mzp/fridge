# Fridge

## Overview
A meal planning system with MCP server + SSR web UI.
- **Chat (Claude)**: Plan meals, generate shopping lists, save recipes
- **Web UI**: View meal calendar, check recipes, manage shopping list

## Tech Stack
- **Runtime**: Node.js (managed via volta)
- **Package Manager**: npm
- **Web Server**: Hono (SSR + REST API)
- **MCP**: @modelcontextprotocol/sdk
- **DB ORM**: Drizzle
- **DB**: SQLite (local/test) → PostgreSQL (production)
- **CSS**: Tailwind 
- **Testing**: Vitest
- **Lint/Format**: Biome

## Project Structure
```
fridge/
├── src/
│   ├── web/              # Hono server process
│   │   ├── index.tsx     # Hono server entrypoint
│   │   └── views/
│   │       ├── layout.tsx    # Shared layout
│   │       ├── meals.tsx     # Meal calendar view
│   │       └── shopping.tsx  # Shopping list view
│   ├── mcp/              # MCP server process (stdio)
│   │   ├── index.ts      # MCP server entrypoint
│   │   ├── meals.ts      # Meal tools
│   │   ├── pantry.ts     # Pantry tools
│   │   └── shopping.ts   # Shopping list tools
│   └── db/
│       ├── schema.ts     # Drizzle schema
│       └── index.ts      # DB connection
├── tests/
│   ├── mcp/
│   │   ├── e2e.test.ts   # MCP E2E via InMemoryTransport
│   │   ├── meals.test.ts
│   │   └── pantry.test.ts
│   └── routes/
│       └── meals.test.ts
├── public/               # Static assets
├── docs/                 # Architecture docs, ADRs
├── .claude/
│   └── commands/         # Shared agent commands
├── CLAUDE.md
└── package.json
```

## Environment
| File | DB | Usage |
|------|----|-------|
| `.env` | SQLite (`mealplanner.db`) | Local dev |
| `.env.test` | SQLite (`:memory:`) | Testing |
| `.env.production` | PostgreSQL | Production |

## Common Commands
```bash
npm run dev          # Start dev server (tsx watch + Tailwind watch, CSS auto-rebuilt)
npm run test         # Run tests
npm run lint         # Lint
npm run format       # Format
npm run css:build    # Build Tailwind CSS once (production / CI only — dev handles this automatically)
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
```

### CSS (Tailwind)
`public/dist.css` is a generated file (gitignored). `npm run dev` rebuilds it automatically on change.
Run `npm run css:build` only in production or CI before starting the server.

## MCP (Claude Desktop)
MCP runs over stdio transport. Claude Desktop config:
```json
{
  "mcpServers": {
    "fridge": {
      "command": "npm",
      "args": ["--prefix", "/Users/mzp/ghq/github.com/mzp/fridge", "run", "--silent", "mcp"]
    }
  }
}
```

## Agent Commands
See `.agent/commands/` for shared slash commands:
- `/precheck` — lint + format + test

## Detailed Docs
See `docs/` for architecture decisions and tech stack rationale.

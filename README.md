# Fridge

![](/docs/images/calendar.png)

Personal meal planning system. MCP server lets a chat agent plan meals and manage the pantry; the SSR web UI (Hono) shows the meal calendar and pantry/shopping list.

Project conventions, tech stack, and agent workflows live in [`AGENTS.md`](./AGENTS.md).

## Features
Manage meal plan and pantry.

![](/docs/images/top.png)

Plan meals with your agent.

![](/docs/images/claude_desktop.png)

## Commands

Node.js is pinned via [Volta](https://volta.sh/) — all commands go through `volta run`.

```bash
volta run npm install
volta run npm run db:migrate   # apply migrations once
volta run npm run dev          # web server: http://localhost:3000
volta run npm run mcp          # MCP server over stdio
volta run npm run test         # tests
```

## Watching logs

Structured JSONL logs land under `logs/` (gitignored). `npm run dev` already pretty-prints web logs to stdout. To tail the files yourself, pipe through `pino-pretty` with `-S` to keep each entry on one line:

```bash
tail -f logs/web.jsonl | npx pino-pretty -S
tail -f logs/mcp.jsonl | npx pino-pretty -S
cat logs/mcp-test.jsonl | npx pino-pretty -S   # last test run
```

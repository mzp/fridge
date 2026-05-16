# Fridge

For shared project instructions, tech stack, commands, and agent workflows, see `AGENTS.md`.

## MCP (Claude Desktop)

MCP runs over stdio transport. Claude Desktop config:

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

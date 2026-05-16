# Codex Notes

Codex automatically reads repository guidance from `AGENTS.md`.

Shared workflow bodies live in `.agents/workflows/`.

The files in `.codex/prompts/` are thin Codex entrypoints that point to the shared workflow bodies. Claude has matching thin entrypoints under `.claude/commands/`.

If your Codex build exposes user prompt files in the slash menu, install or link these prompts into the configured Codex prompt location. Otherwise, ask Codex to run `precheck` or `self-review`; `AGENTS.md` defines those names as reusable workflows.

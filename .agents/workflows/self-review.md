Review type definitions that duplicate information already available from `src/db/schema.ts`, check for unused imports and unused exported functions, and verify `CLAUDE.md` and `AGENTS.md` are internally consistent.

## Scope

- No argument: scan only the files changed in the last commit with `git diff HEAD~1 HEAD --name-only`.
- `all`: scan all files under `src/` and `tests/`.

## What to check

Read `src/db/schema.ts` first to understand all available `$inferSelect` and `$inferInsert` types, such as `typeof meals.$inferSelect`, `typeof pantry.$inferSelect`, and `typeof pantryLogs.$inferSelect`.

Then scan the target files for:

1. Manually duplicated types: hand-written `type` or `interface` declarations whose fields mirror a schema table, with the same field names and types. These should use `typeof table.$inferSelect` instead.
2. Partial types that could use `Pick`: hand-written types that are a subset of a schema type. These should use `Pick<typeof table.$inferSelect, "field1" | "field2">` or an intersection of Picks from multiple tables.
3. Type aliases that just re-export a schema type: unnecessary wrappers around an already-available inferred type.
4. Unused imports: `import` statements, or individual named imports, that are never referenced in the file body. Check each imported symbol against its usage in the file.
5. Unused exported functions: `export function` or `export const` declarations that are never imported anywhere in `src/` or `tests/`. Search across all files to verify each export is actually consumed.
6. Duplicated test setup: repeated setup or fixture code across multiple test files, such as creating an in-memory database, running migrations, building an app/server, connecting an MCP client, or configuring common mocks, stubs, and fakes. These should be moved into a focused test helper when doing so reduces duplication without hiding important test-specific behavior.
7. Overlap between `tests/routes` and `tests/e2e`: hero cases (primary happy-path user flows — create, edit, delete) belong in `tests/e2e` (Playwright), and `tests/routes` (Vitest) should focus on edge cases (URL parameters, error responses like 404, empty-state messages, form rendering details, distinct actions not exercised end-to-end). If a `tests/routes` test asserts the same scenario as a `tests/e2e` test, flag the routes test for removal.
8. Documentation contradictions: read `CLAUDE.md` and `AGENTS.md` and check for internal inconsistencies:
   - Commands listed that do not exist in `package.json` scripts.
   - File paths or directory names mentioned that do not exist on disk.
   - Tech stack entries that contradict installed dependencies in `package.json`.
   - Descriptions of project structure that do not match the actual layout under `src/`.
9. View-only model methods: methods under `src/model/` that are called from only a single view component (under `src/web/views/`) and produce presentation output — display labels, formatted strings, or other view-specific formatting. These belong in a view helper module, not the model. **Exclude URL/path generation** (e.g. `detailPath`, `editPath`, `deletePath`) and methods also used by non-view callers (MCP tools, routes, other model code). Flag any such method and suggest moving it to the relevant `src/web/views/<area>/helper.ts`.
10. Shared view logic: formatting or display logic duplicated across multiple view components, or written inline in one view but needed by others, should be consolidated into a view `helper.ts` module (e.g. `src/web/views/meals/helper.ts`). Flag the duplication and suggest the shared helper.
11. Test-layer overlap (`tests/model` / `tests/mcp` / `tests/e2e`): business-logic and edge-case behavior belongs in `tests/model` — the most granular layer (input variations, boundary conditions, error branches, partial updates, clearing/defaulting). `tests/mcp` should cover only MCP-specific concerns: tool registration, `structuredContent` / `outputSchema` shape, argument validation, and action→message mapping — not re-test model logic. `tests/e2e` covers hero user flows. If a `tests/mcp` or `tests/e2e` test asserts the same behavior already covered by a `tests/model` unit test, flag the higher-layer test for removal or trimming, keeping only the layer-specific assertions.
12. Complex DB logic in MCP tools: MCP tool handlers under `src/mcp/` that perform non-trivial database work — multi-step queries, upserts, conditional create/update, merge/clash resolution, cascading writes — should move that logic into `src/model/` (e.g. a model method like `Meal.batchSave`), leaving the tool to validate arguments, call the model, and shape the response. Flag any MCP handler doing meaningful DB orchestration inline and suggest extracting it to the model.

## How to report

For each issue found, report:

- File and line number.
- The current definition.
- The suggested fix, such as a replacement type, import removal, or note that the export can be deleted.

If nothing is found, confirm the codebase is clean.

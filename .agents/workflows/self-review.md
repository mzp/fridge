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
7. Documentation contradictions: read `CLAUDE.md` and `AGENTS.md` and check for internal inconsistencies:
   - Commands listed that do not exist in `package.json` scripts.
   - File paths or directory names mentioned that do not exist on disk.
   - Tech stack entries that contradict installed dependencies in `package.json`.
   - Descriptions of project structure that do not match the actual layout under `src/`.

## How to report

For each issue found, report:

- File and line number.
- The current definition.
- The suggested fix, such as a replacement type, import removal, or note that the export can be deleted.

If nothing is found, confirm the codebase is clean.

Review type definitions that duplicate information already available from `src/db/schema.ts`.

## Scope

- **No argument**: scan only the files changed in the last commit (`git diff HEAD~1 HEAD --name-only`).
- **all** : scan all files under `src/` and `tests/`.

## What to check

Read `src/db/schema.ts` first to understand all available `$inferSelect` / `$inferInsert` types (e.g. `typeof meals.$inferSelect`, `typeof pantry.$inferSelect`, `typeof pantryLogs.$inferSelect`).

Then scan the target files for:

1. **Manually duplicated types** — hand-written `type` or `interface` declarations whose fields mirror a schema table (same field names and types). These should use `typeof table.$inferSelect` instead.

2. **Partial types that could use `Pick`** — hand-written types that are a subset of a schema type. These should use `Pick<typeof table.$inferSelect, "field1" | "field2">` or an intersection of Picks from multiple tables.

3. **Type aliases that just re-export a schema type** — unnecessary wrappers around an already-available inferred type.

## How to report

For each issue found, report:
- File and line number
- The current definition
- The suggested replacement using schema-derived types

If nothing is found, confirm the codebase is clean.

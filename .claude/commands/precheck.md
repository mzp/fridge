Fix formatting and verify the codebase is ready for review: auto-format, lint, type check, run tests, and check for uncommitted files.

```bash
npm run format && npm run lint && npm run typecheck && npm test
```

After all steps pass, run `git status --short` and check if there are any uncommitted changes (including untracked files). If there are, list them and warn that they are not committed. If all steps pass and there are no uncommitted files, confirm everything is clean.

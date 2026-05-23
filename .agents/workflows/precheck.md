Fix formatting and verify the codebase is ready for review: auto-format, lint, type check, run tests, and check for uncommitted files.

```bash
volta run npm run biome:format && volta run npm run biome:lint && volta run npm run typescript:check && volta run npm test
```

After all steps pass, run `git status --short` and check if there are any uncommitted changes, including untracked files. If there are, list them and suggest `git commit --amend` if the changes are minor fixes, such as formatting or import order, that belong in the last commit. If all steps pass and there are no uncommitted files, confirm everything is clean.

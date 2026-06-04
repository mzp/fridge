Prepare the current branch and open a GitHub pull request.

Run the steps in order. If any step fails or surfaces problems, stop and report
rather than opening the PR.

## 1. Precheck

Run the `.agents/workflows/precheck.md` workflow (auto-format, lint, type check,
tests, and the uncommitted-files check). Resolve anything it surfaces — commit or
`git commit --amend` minor fixes as appropriate — before continuing.

## 2. Self-review

Run the `.agents/workflows/self-review.md` workflow over the changes on this branch
relative to the base branch (the files from `git diff main...HEAD --name-only`).
Apply in-scope findings and commit them; report anything left out of scope.

## 3. Open the pull request

- Confirm the current branch is not the default branch (`git branch --show-current`).
  If it is `main`, stop and ask the user to move the work onto a feature branch first.
- Push the branch to `origin` — `git push -u origin <branch>` if it has no upstream,
  otherwise `git push`.
- If a PR for the branch already exists (`gh pr view`), update its body instead of
  creating a duplicate. Otherwise create it with `gh pr create --base main`.
- Write a title and body that summarize the branch's commits / diff
  (`git log main..HEAD`): a one-line **Summary**, the key changes grouped by theme,
  and a **Testing** section noting which checks were run. End the body with the
  Claude Code attribution line.
- Report the PR URL.

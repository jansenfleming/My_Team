# docs/real-pr-flow: amend workflow for real GitHub PRs

Author: architect. Branch: `docs/real-pr-flow`. Base: `main` (916c5fc). Docs only.

## What changed
Aligns the architecture docs with the lead's rule (`docs/project-brief.md`, 916c5fc): from wave 2, PRs are real and only the lead pushes and merges.
- `docs/architecture/ownership-map.md`: steps 6-7 rewritten (Architect approves but does not merge; lead pushes, opens the PR, merges with `gh pr merge --merge`; board moves `review` -> `approved` -> `done` only after the lead confirms). New step 8: the Architect's own changes also go through a branch and PR. Lockfile conflicts get a `chore/lockfile-<n>` branch. "Never" list now names `git push`, `gh`, and merging a PR.
- `docs/architecture/board.md`: adds the `approved` status and updates the done-definition.
- `docs/architecture/kickoff/{backend,frontend,security-qa}-engineer.md`: "Architect merges" wording replaced.

## How to review
Read the diff; no code, no tests apply. Wave 1 (F1, B1, Q1, Q4, D1, docs, scaffold) stays as merged locally.

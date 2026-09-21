# docs/architecture: Phase 0 plan

Author: architect. Branch: `docs/architecture`. Base: `main`.

## What changed
Docs only, no code:
- `docs/architecture/adr/0001-stack.md`: stack decision, one-line reasons, rejected options, verified version pins.
- `docs/architecture/roadmap.md`: MVP in/out, exit criteria, later phases.
- `docs/architecture/api-contract.md`: API contract v1.0 (8 endpoints, error format, auth rules, extension process).
- `docs/architecture/ownership-map.md`: final file ownership and working agreements (worktrees, PR flow, QA gates).
- `docs/architecture/board.md`: Phase 1 task board (36 tasks incl. standing gate task).
- `docs/architecture/kickoff/*.md`: starter briefs for the four teammates.

## How to review
Read `ownership-map.md` for any file with two owners (there should be none) and `api-contract.md` against `board.md` tasks B1-B4 and F3-F4.

## Verified
Tooling versions in the ADR were installed and smoke-tested in a scratch directory outside the repo (see the ADR section "Verified on this machine"). Nothing in this PR is executed application code.

## Notes
No root `README.md` is created (the remote already has one). No remote operations were performed.

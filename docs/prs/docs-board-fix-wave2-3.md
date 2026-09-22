# docs/board-fix-wave2-3: correct the stale board

Author: architect. Branch: `docs/board-fix-wave2-3`. Base: `main` (df5e6ca, after PR #17). Docs only.

## Why
This architect session was resumed after a reset; the in-memory state of the previous session (which knew B2/F2/D2/QA-002-fix had merged) was gone, and the on-disk `docs/architecture/board.md` had not been updated to match: it still showed B2 (`feat/api-core`), F2 (`feat/terminal-engine`), D2 (`feat/design-tokens`), and the QA-002 fix as `in-progress`, and the merged-PR list stopped at #6. Reality, confirmed from `git log --merges main` and the PR files/gate reports on disk: PRs #1-#17 are merged, `main` is at `df5e6ca`.

## What changed
`docs/architecture/board.md` only:
- Merged-PR list extended to #7-#17 with branch names; `main` SHA corrected to `df5e6ca`; a note added explaining the staleness and this fix.
- Open QA findings line: QA-002 marked verified fixed (PR #16); QA-003 (Low, non-blocking, from the B2 gate) added, since it was previously only mentioned inside the B6 row.
- Index and detail rows corrected to `done`: B1 (both QA fixes), B2 (PR #12, lockfile PR #13), F1 (already done), F2 (PR #17), D1 (already done), D2 (PR #8), D4 (PR #11), Q1/Q4 (already done).
- F3 (`feat/api-client`, not `feat/web-api-client` as originally named) and D3 (`feat/design-screens`) moved to `approved`: both reviewed this session (`docs/architecture/reviews/feat-api-client.md`, `docs/architecture/reviews/feat-design-screens.md`), F3 has an existing QA gate PASS (`qa/reports/gate-feat-api-client.md`, commit `c020aa9`), D3 is docs-only so needs architect review only (commit `7831c18`, PR file at `docs/prs/feat-design-screens.md`, written by the architect after the creative-director was paused before it could self-review — see that PR file for why). Both await the lead's merge.
- D5 marked assigned (creative-director starting now that D4 is merged); B3 and F4 annotated with their current unblock status (B3 ready now; F4 ready once F3 is actually on `main`).
- A3/A4 statuses corrected from `todo` to `in-progress` to reflect the partial merges already done.
- Suggested-waves section annotated with what's actually done vs. outstanding.

No task scope, ownership, or dependency changed — only status fields and the merged-PR ledger.

## How to review
Read the diff against `git log --merges main` and the existing PR/gate files cited above; all of it is verifiable from files already on disk plus this session's own two new review files (`docs/architecture/reviews/feat-api-client.md`, `docs/architecture/reviews/feat-design-screens.md`) and one new PR file (`docs/prs/feat-design-screens.md`, on the `feat/design-screens` branch, not this one).

## Status
Ready for architect self-approval (docs-only, own branch) and lead merge.

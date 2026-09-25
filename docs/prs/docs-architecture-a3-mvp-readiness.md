# docs/architecture-a3-mvp-readiness: MVP readiness report and Phase 2 board (A3)

Author: architect. Branch: `docs/architecture-a3-mvp-readiness`. Base: `main` (`5a5a848`,
after PR #64, `docs/board-e7-done` — every board task except A2 (ongoing) and A3 is now
`done`).

## What changed

Board task A3, the last item on the current board: an MVP readiness report and a
proposed Phase 2 board, per `docs/project-brief.md` and the lead's task instructions.

New files:
- `docs/architecture/mvp-readiness.md` — the readiness report: what shipped (summary,
  not a re-listing of every PR), a scope check against the owner's original verbatim
  brief (not just the board's paraphrase of it), what was explicitly deferred and why
  (pulled from every D1-D5/E1-E7 review file and design doc, not just the board), a full
  `[PLACEHOLDER: ...]` marker inventory (grepped fresh, every live marker in the current
  site and its source specs, with exactly what the owner needs to supply for each), the
  real check-suite output (re-run independently in this worktree, not copied from a
  prior review), a basic hygiene pass, and an explicit go/no-go recommendation (go).
- `docs/architecture/phase-2-backlog.md` — a prioritized, non-binding candidate list for
  what comes next: the old project's `docs/design/backlog.md` structure was used as a
  loose reference for shape only (it no longer exists on disk per ADR 0003 and had no
  content relevant to this project); every actual candidate below it is new, built from
  what this project deliberately deferred (D1's two deferred easter-egg ideas, ADR
  0003's explicitly-undecided hosting question, and several non-blocking notes carried
  over from individual task reviews).

Changed files:
- `docs/architecture/board.md` — A3's row set from `todo` to `review` (not `done`; see
  "Process note" below). A status note added under E7's wave-5 entry pointing at the new
  report and backlog files.

## Independent verification performed (not assumed from the board)

Read `docs/project-brief.md`, `docs/architecture/board.md` in full (every row and detail
section), `docs/architecture/roadmap.md`, `docs/architecture/adr/0003-streetwear-pivot.md`,
`docs/architecture/ownership-map.md`, both brand/product design docs
(`docs/design/concept.md`, `docs/design/easter-eggs.md`, `docs/design/lookbook.md`), and
all ten `docs/architecture/reviews/feat-{design,web}-*.md` files for this project (D1,
D2, D3, D4, D5, E1, E2, E3, E4, E5, E6, E7) in full — not skimmed.

Ran the full check suite for real in this worktree on current `main` (`5a5a848`, Node
v22.12.0, npm 11.6.1):

```
$ npm install
added 307 packages, and audited 309 packages in 2s
found 0 vulnerabilities

$ npm run typecheck
tsc --noEmit -p tsconfig.json   -> exit 0, no output

$ npm run lint
eslint .   -> exit 0, no output

$ npm test
 Test Files  17 passed (17)
      Tests  157 passed (157)
   Duration  2.67s

$ npm run build
✓ 49 modules transformed.
dist/index.html                   0.59 kB │ gzip:  0.36 kB
dist/assets/index-TqR6siyd.css   24.06 kB │ gzip:  4.30 kB
dist/assets/index-DfB4jRoc.js   250.68 kB │ gzip: 78.00 kB
✓ built in 469ms

$ npm run scan-secrets
scan-secrets [working-tree]: 148 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
found 0 vulnerabilities
```

All clean, all matching E7's last review (the final engineering gate before this task).
Full output and analysis in `mvp-readiness.md` §7.

Also spot-checked scope directly against source, not just against test assertions:
`apps/web/src/data/products.ts` has exactly 12 main-catalog products (5 shirt / 4
sweatshirt / 3 hat) plus one hidden 13th shirt (`hiddenProduct`, never referenced by the
catalog/grid/any "all products" loop); re-grepped `apps/web/src` for
`fetch\(|XMLHttpRequest|axios|WebSocket|EventSource|https?://` outside tests/comments —
zero live hits, confirming the mock-cart/checkout discipline holds end-to-end.

## One finding: a genuine loose end, not caught by any prior task

`apps/web/src/layout/Layout.tsx`'s site-wide footer still renders a literal
`[PLACEHOLDER: real footer copy from the Creative Director.]`, shipped as a stopgap in
E1 and never picked up by D4 (which specified about/lookbook copy, not the global
footer) or any later task. Checked every design doc and review for a footer-copy
mention: none exists. This is honest and harmless (doesn't fabricate anything, doesn't
break anything) but is a visible placeholder bracket on every page — flagged in
`mvp-readiness.md` §4 as a small, same-day Creative Director fix, and as Rank 1 in the
Phase 2 backlog. Not a blocker for the go recommendation.

## Go/no-go

**Go**, with the one loose end above noted for a quick follow-up fix. Full reasoning in
`mvp-readiness.md` §1-§3. This is a recommendation only — the Architect has no deploy
authority per the brief; the owner decides, the lead relays.

## Process note

Per `docs/architecture/ownership-map.md`'s working agreement (and the same pattern used
for A1 and every D/E task), the Architect does not merge or flip its own row to `done`.
A3's board row is set to `review` here, not `done` — the lead reviews this branch's real
command output, and once the real PR is merged, the row moves to `done` at that point
(by the lead or by the Architect on the lead's confirmation), same as every other task.

## New dependencies

None. Docs-only branch.

## How to review

1. Read `docs/architecture/mvp-readiness.md` in full — check the scope table (§3) against
   `docs/project-brief.md` Part 1, and the placeholder inventory (§6) against a fresh
   grep of your own if you want to double-check it.
2. Re-run the check suite yourself (`npm install && npm run typecheck && npm run lint &&
   npm test && npm run build && npm run scan-secrets && npm run audit:ci`) and compare
   against §7's pasted output.
3. Read `docs/architecture/phase-2-backlog.md` — it's a proposal, not a plan of record;
   sanity-check the ranking and that nothing on it quietly expands scope without an
   explicit call-out (Rank 5, the discount-code pun, is flagged as the one idea on the
   list with real mock-commerce-honesty risk, matching D1's original reasoning for
   deferring it).
4. Confirm the footer-placeholder finding (§4 of the readiness report) by loading any
   page and checking the footer.

## Checks run

See "Independent verification performed" above for full output. All seven requested
checks (`npm install`, `typecheck`, `lint`, `test`, `build`, `scan-secrets`, `audit:ci`)
pass clean on current `main`.

# feat/qa-gate-api-core: gate report for B2, QA-003, black-box attack file

Author: security-qa-engineer. Branch: `feat/qa-gate-api-core`. Base: main. Files: `qa/**` and this PR file only.

## What changed
- `qa/reports/gate-feat-api-core.md`: `Verdict: PASS` for `feat/api-core` at `170d002`.
- `qa/reports/QA-003-transport-level-errors-not-in-contract-format.md`: Low, open, non-blocking.
- `qa/gates/b2-api-core.attack.test.mjs`: 50 black-box checks (headers, routing, Origin/CSRF, body limits, rate limit, config failure, logs, transport abuse). It spawns the branch's API on free `127.0.0.1` ports and refuses non-loopback hosts. Run: `QA_API_DIR=<worktree>/apps/api node --test qa/gates/b2-api-core.attack.test.mjs`. It is a gate script, not part of `npm test -w @site/qa` (it needs a checked-out API). Q2 will turn the reusable parts into the harness.

## Real output
`# tests 50, # pass 50, # fail 0` against `170d002`. Details, hygiene table and limits are in the gate report.

## New dependencies
None.

## Not verified
Only `/api/health` exists, so guestbook, auth, real 415 at a POST route, per-route limits and cookies wait for B3 and B4.

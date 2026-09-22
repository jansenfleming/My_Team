# feat/qa-gate-api-guestbook: gate report for B3, QA-004, black-box attack suite

Author: security-qa-engineer. Branch: `feat/qa-gate-api-guestbook`. Base: main. Files: `qa/**` and this PR file only.

## What changed
- `qa/reports/gate-feat-api-guestbook.md`: `Verdict: PASS` for `feat/api-guestbook` at `c012bec`.
- `qa/reports/QA-004-health-check-blind-to-write-lock-and-file-loss.md`: new Low, informational, non-blocking.
- `qa/gates/b3-api-guestbook.attack.test.mjs`: 21 black-box checks (verbatim storage/injection, keyset pagination via a directly-seeded second SQLite connection, the 3/10min rate limit and its stacking with the global limit, and two real induced DB-unavailable scenarios: file deletion and write-lock contention). Usage in the file header.

## Real output
`# tests 21, # pass 21, # fail 0` against `c012bec`. The PR file's own two rate-limit repros (a standalone script and a real code mutation) were both run by hand and matched what the PR file claims. Full command tables, the rate-limit mutation check (`# pass 17 / # fail 4`), and the QA-004 write-up are in the gate report.

## New dependencies
None.

## Not verified
`DELETE /api/admin/guestbook/:id` and auth (B4, not routed yet); no browser.

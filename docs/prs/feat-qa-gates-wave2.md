# feat/qa-gates-wave2: wave-2 gate reports (B2, F2, F3, QA-002 fix), QA-003, black-box and hostile-input suites

Author: security-qa-engineer. Branch: `feat/qa-gates-wave2`. Base: main. Files: `qa/**` and this PR file only. Nothing was fixed or edited outside `qa/**`.

## Gate reports (each names the exact head tested)
| Branch | Head | Verdict | Report |
|---|---|---|---|
| `feat/api-core` (B2) | `170d002` | PASS (already merged to main via PR #12; unchanged here) | `qa/reports/gate-feat-api-core.md` |
| `feat/terminal-engine` (F2) | `b650566` | PASS | `qa/reports/gate-feat-terminal-engine.md` |
| `fix/qa-002-invisible-runs` | `c9b6a32` | PASS (QA-002 verified as decided, residual quantified) | `qa/reports/gate-fix-qa-002-invisible-runs.md` |
| `feat/api-client` (F3) | `c020aa9` | PASS | `qa/reports/gate-feat-api-client.md` |

## Findings
- QA-003 (Low, open, non-blocking): HTTP-parse-level errors (bad request line, bad Content-Length, 431) bypass the contract error body. `qa/reports/QA-003-transport-level-errors-not-in-contract-format.md`.
- QA-002 (Low): verified as decided; residual noted (about 105 hidden bytes per message still possible by splitting runs of three with visible characters). `qa/reports/QA-002-...md`.
- QA-001: verified earlier.

## Test files added or changed (all under `qa/gates/`, none part of `npm test -w @site/qa` because they need a branch worktree)
- `b2-api-core.attack.test.mjs`: 50 black-box checks against a locally spawned API on `127.0.0.1` (refuses non-loopback hosts). `QA_API_DIR=<worktree>/apps/api node --test ...`
- `b1-shared-contract.adversarial.test.mjs`: 33 schema checks (QA-001 and QA-002 retests). Needs an esbuild bundle of `packages/shared` (see the file header).
- `web/f2-terminal.hostile.test.mjs` (20) and `web/f3-api-client.hostile.test.mjs` (37), run with `web/vitest.gate.config.mjs` against a branch worktree of `apps/web` (`QA_WEB_DIR`).
All test files use JS escapes for invisible characters, so no hidden characters live in the source.

## Real output
B2 attack file `# tests 50, # pass 50`. Schema file `# tests 33, # pass 33` on the fix and `# pass 28, # fail 5` on the pre-fix bundle. F2 file 20/20 (3 fail on a deliberately broken scratch copy). F3 file 37/37 (10 fail on a deliberately broken scratch copy). Full command tables are in each gate report. `node qa/tools/scan-secrets.mjs` and `npm run lint` pass on this branch.

## New dependencies
None.

## Not verified
No browser was available (jsdom only). Guestbook and auth routes do not exist yet (B3, B4), so real 415/413 at a POST route, per-route limits, cookies and the access matrix wait for Q3.

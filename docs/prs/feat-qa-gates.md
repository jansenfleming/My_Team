# feat/qa-gates: gate reports for F1 and B1, QA-001, B1 adversarial checks

Author: security-qa-engineer. Branch: `feat/qa-gates`. Base: `main` (after Q1 and Q4 merged). Files are all under `qa/**` plus this PR file.

## What changed
- `qa/reports/gate-feat-web-shell.md`: `Verdict: PASS` for `feat/web-shell` at `7346c34`.
- `qa/reports/gate-feat-shared-contract.md`: `Verdict: PASS` for `feat/shared-contract` at `9d8f515`.
- `qa/reports/QA-001-invisible-format-characters-in-guestbook-message.md`: Low, open, non-blocking.
- `qa/gates/b1-shared-contract.adversarial.test.mjs`: 15 independent `node:test` checks of the shared schemas against the contract (usage in the file header; needs a bundled copy of the schemas, so it is not part of `npm test -w @site/qa`).

## How to test
```
npm test -w @site/qa                 # scanner self-tests (9)
node qa/tools/scan-secrets.mjs
# adversarial checks: bundle the schemas from a worktree of feat/shared-contract, then
SHARED_BUNDLE=<bundle.mjs> node --test qa/gates/b1-shared-contract.adversarial.test.mjs
```

## Real output (2026-09-21)
```
npm test -w @site/qa            # tests 9, pass 9, fail 0
scan-secrets [working-tree]: 54 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS
npm run lint                    # exit 0
adversarial run vs feat/shared-contract 9d8f515: # tests 15, # pass 15, # fail 0
same run vs a deliberately weakened bundle:      # pass 14, # fail 1  (proves the checks can fail)
```
Full command tables, dist inspection, loopback-bind check and limits are in the two gate reports.

## New dependencies
None.

## Not verified
No browser; nothing tested over HTTP yet (B2 is not merged). See the gate reports.

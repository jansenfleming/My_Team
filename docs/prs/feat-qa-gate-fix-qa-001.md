# feat/qa-gate-fix-qa-001: retest of QA-001 (gate report, QA-001 verified, QA-002)

Author: security-qa-engineer. Branch: `feat/qa-gate-fix-qa-001`. Base: main `916c5fc`. Files: `qa/**` and this PR file only.

## What changed
- `qa/reports/gate-fix-qa-001-message-invisible-chars.md`: `Verdict: PASS` for `fix/qa-001-message-invisible-chars` at `8d11767`.
- `qa/reports/QA-001-...md`: status set to verified, retest log filled.
- `qa/reports/QA-002-residual-hidden-text-channels-in-guestbook-message.md`: new Low, open, non-blocking.
- `qa/gates/b1-shared-contract.adversarial.test.mjs`: test 15 replaced by ten QA-001 retest and adjacent tests (24 total).

## Real output
Adversarial file against the fixed bundle: `# tests 24, # pass 24, # fail 0`. Against the pre-fix bundle: `# pass 18, # fail 6`. Details and the hygiene table are in the gate report.

## New dependencies
None.

## Not verified
Schemas only; no HTTP layer, no browser rendering.

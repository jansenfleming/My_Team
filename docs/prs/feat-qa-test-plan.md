# feat/qa-test-plan: QA test plan, threat model, report templates (Q1)

Author: security-qa-engineer. Branch: `feat/qa-test-plan`. Base: `main` at 08e589b. Docs only, all under `qa/**` plus this file.

## What changed
- `qa/test-plan.md`: principles, environments, test levels, ID-numbered cases for contract conformance, access matrix, auth and sessions, CSRF, injection, rate limits, headers, error hygiene, fuzzing, logging, config, web (jsdom, build output, MANUAL a11y checklist), and hygiene; the gate procedure and verdict rules; entry and exit criteria for Q2 to Q6; known coverage gaps.
- `qa/threat-model.md`: assets, trust boundaries, 16 threats rated by likelihood x impact with promised controls mapped to planned test IDs, out-of-scope list, and a residual risk register.
- `qa/reports/README.md`: naming, rules, severity scale, status values, and copy-paste templates for findings and gates.

## Top threats (details in `qa/threat-model.md`)
1. T1 stored XSS / terminal injection reaching the operator's browser (risk 9)
2. T2 operator authentication attack (brute force, timing, fixation, cookie theft) (risk 6)
3. T4 rate-limit bypass via header spoofing or `TRUST_PROXY` misconfiguration (risk 6, ties with T3 CSRF, T5 secrets, T11 supply chain)

## How to test
Docs only; there is nothing to execute. The Architect reviews content against `api-contract.md`. Green suite run below (from the `.worktrees/qa` worktree, after `npm install`).

## Suite run (2026-09-21, Node 22.12.0, npm 11.6.1)
```
npm run lint                      exit 0   (eslint .; no output)
npm run typecheck                 exit 0
npm test                          exit 0
npm run build                     exit 0
npm audit --audit-level=high      exit 0   "found 0 vulnerabilities"
```
Caveat: on this base no workspace defines `typecheck`, `test`, or `build` yet, so those three pass vacuously (`--if-present`). Only lint and audit exercised anything.

## New dependencies
None.

## Not verified / notes
- All controls named in the threat model are the contract's promises; none is verified because no application code is merged yet.
- No real browser exists here; the test plan states which web checks are approximations.
- Suggestion for the Architect (R1 in the threat model): add a lint rule banning `innerHTML`, `dangerouslySetInnerHTML`, and `insertAdjacentHTML` in the root `eslint.config.js` (Architect-owned, so not changed here).

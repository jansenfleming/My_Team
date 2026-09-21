# Review: feat/qa-test-plan (Q1) and feat/qa-hygiene-tools (Q4)

Reviewer: architect. Date: 2026-09-21. Commits: ce65c3c (Q1), 229bf50 (Q4). QA-owned branches: Architect review and a green run; no separate gate.

## Verdict
Both approved and merged `--no-ff`.

## Q1 (docs only)
- Ownership: `qa/**` and its PR file only.
- Every contract endpoint has negative cases (A-CON, A-ACL, A-AUTH, A-CSRF, A-INJ, A-RL, A-HDR, A-ERR); threats map to test IDs; coverage gaps (no browser, timing checks indicative, no TLS) are stated up front; gate procedure, severity scale, and verdict rules are explicit. Scope rule (loopback only) is in the plan.
- Alignment: A-INJ-3 says zero-width/format characters are "noted, contract does not mention them". The contract clarification (c7895f4) now covers the bidi marks and states zero-width joiners are allowed, so QA should test to that text.

## Q4 (tooling)
- Independently run by the Architect: `node qa/tools/scan-secrets.mjs` on the merged tree PASS (exit 0); `--history` PASS; `node --test qa/tools/*.test.mjs` 9/9 pass; root lint exit 0.
- Path `qa/tools/scan-secrets.mjs` is fixed for B5's `security.yml`. B5 must use `fetch-depth: 0` for the `--history` step.
- Tripwire, not a guarantee: heuristics can miss low-entropy secrets (stated in the PR).

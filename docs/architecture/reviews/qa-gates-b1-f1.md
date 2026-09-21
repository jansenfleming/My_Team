# Review: feat/qa-gates, feat/shared-contract (B1), feat/web-shell (F1)

Reviewer: architect. Date: 2026-09-21.

- `feat/qa-gates` (49a3e27): QA-authored gate reports (`qa/reports/gate-*.md`), finding QA-001, an adversarial B1 test under `qa/gates/`. Only `qa/**` and its PR file. Merged after lint (0), scanner (PASS) and the 9 QA self-tests (9/9).
- Gates: F1 `Verdict: PASS` at 7346c34, B1 `Verdict: PASS` at 9d8f515. Branch heads were checked to equal the gated commits before merging.
- B1 merged (6915843) and F1 merged (aebcc50). The `package-lock.json` conflict was resolved as agreed: kept main's lockfile, re-ran `npm install`. After the merges on main: `npm test` (web 7, shared 187, qa 9 passing), lint exit 0, build succeeds.

## QA-001 decision (Low): tighten
Guestbook text may be read by AI agents, so hidden Unicode text is a prompt-injection channel; a blank-looking message is also pointless spam. Contract amended (v1.0 clarification, QA-001): reject tag characters, U+E0100-E01EF, U+2060-2064, U+FFF9-FFFB, U+00AD, and messages with no visible character. ZWJ/ZWNJ, U+200B and emoji variation selectors stay allowed. Residual accepted: U+3164 and U+2800 blank-looking letters.
B1 was already merged when the decision was made (it was gated Low, non-blocking); the fix ships as `fix/qa-001-message-invisible-chars`, and QA retests. Nothing consumes the schema yet (B2/F3 not started), so no consumer sees the looser rule.

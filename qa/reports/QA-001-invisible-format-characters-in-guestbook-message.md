# QA-001: guestbook message accepts invisible format characters and invisible-only messages

- Severity: Low
- Status: verified (2026-09-21, fix commit `8d11767`; see retest log and `qa/reports/gate-fix-qa-001-message-invisible-chars.md`)
- Found: 2026-09-21, against `feat/shared-contract` at commit `9d8f515`
- Owner to fix: backend-engineer (`packages/shared/src/constants.ts`, `MESSAGE_FORBIDDEN_PATTERN`), after the Architect amends the contract if needed
- Affected: `MessageSchema` / `CreateGuestbookRequestSchema` (future `POST /api/guestbook`)
- Test case ID: A-INJ-3 (`qa/test-plan.md`)
- Target: static schema tests via a local esbuild bundle of `packages/shared`; no server involved

## Summary
The message rule rejects `\p{Cc}`, `\p{Cs}`, U+2028/2029, bidi overrides/isolates and marks, but accepts other invisible Unicode format characters (`\p{Cf}` members). A visitor can post a guestbook entry that renders as blank, or hide text inside an otherwise normal-looking message. This is guestbook spam and spoofing hardening, not code execution.

## Reproduction
```
# bundle the schemas from a worktree of the branch (localhost only, no network)
esbuild packages/shared/src/index.ts --bundle --format=esm --platform=node --outfile=$SCRATCH/shared.bundle.mjs
SHARED_BUNDLE=$SCRATCH/shared.bundle.mjs node --test qa/gates/b1-shared-contract.adversarial.test.mjs
```
Test 15 ("observation QA-001") asserts that all of these currently PARSE successfully as `message`:
- `"​"` (a single zero-width space: the whole message is invisible)
- `"⁠⁢⁣"` (word joiner, invisible times, invisible separator)
- `"a\u{e0041}\u{e0042}b"` (Unicode tag characters: invisible ASCII-shaped payload)
- `"a️b"` (variation selector), `"a­b"` (soft hyphen), `"a￹b"` (interlinear annotation)

## Expected
Contract section 6 says a message is 1..280 chars after trimming and single line. Its clarification deliberately allows zero-width joiners so emoji sequences work. It does not say a message may be visually empty. Reasonable expectation: a message must contain at least one visible character, and characters with no legitimate use in a guestbook (tag characters U+E0000-E007F, U+2060-2064, U+FFF9-FFFB, soft hyphen) are rejected.

## Actual
All listed inputs are accepted and stored verbatim. `qa/gates/b1-shared-contract.adversarial.test.mjs` test 15 passes on the current behavior.

## Impact
Low. Blank or lookalike guestbook entries, hidden text that survives copy/paste (tag characters are used to smuggle instructions to text-processing tools, including LLM agents that later read guestbook content), and moderation confusion for the operator. No script execution: the client renders text nodes only.

## Suggested fix direction
Keep U+200D and U+FE0F only when adjacent to an emoji (or simply keep them but reject messages whose remainder after stripping `\p{Cf}`, `\p{Z}` and `\p{M}`-only clusters is empty), and reject tag characters and the other invisible operators outright. Add matching boundary tests. If the Architect prefers to accept the risk, mark `wontfix` and keep test 15 as a change detector.

## Retest log
| Date | Commit | Result | Evidence and adjacent cases run |
|---|---|---|---|
| 2026-09-21 | `8d11767` on `fix/qa-001-message-invisible-chars` | **verified** | Original repro inputs (lone U+200B, U+2060/2062/2063, tag characters, U+00AD, U+FFF9) all rejected; every code point in each newly rejected range rejected in leading, inner and trailing positions; invisible-only messages (ZWSP/ZWNJ/ZWJ, lone U+FE0F, combining marks only) rejected; ZWJ families, keycaps, flags, skin tones, FE0F, accented and Indic/Arabic/Thai text still accepted; run against the pre-fix code the same file fails 6 of 24, against the fix it passes 24/24. Adjacent residual channels tracked as QA-002. |

# QA-002: guestbook message still accepts long runs of zero-width and variation-selector characters

- Severity: Low
- Status: open (non-blocking; the contract accepts these on purpose, so this needs an Architect risk decision, not a bug fix)
- Found: 2026-09-21, while retesting QA-001 against `fix/qa-001-message-invisible-chars` at commit `8d11767`
- Owner to fix: backend-engineer (`packages/shared/src/constants.ts` and `schemas.ts`), only if the Architect amends the contract
- Affected: `MessageSchema` (future `POST /api/guestbook`)
- Test case ID: A-INJ-3 (`qa/test-plan.md`)
- Target: static schema tests via a local esbuild bundle of `packages/shared`; no server involved

## Summary
After the QA-001 fix, hidden text can still be carried in a message by unlimited runs of variation selectors U+FE00-FE0F (4 bits per character) or U+200B/U+200C/U+200D (about 1.6 bits per character), placed between visible characters. The contract allows these for emoji sequences and does not limit run length.

## Reproduction
Test 24 in `qa/gates/b1-shared-contract.adversarial.test.mjs` (run as described in the file header). It shows a 28-character hidden string, encoded as variation-selector nibbles after "hi", is a valid message of about 60 UTF-16 units:
```
msg = "hi" + <56 variation selectors> + "!"        -> parses successfully as a guestbook message
```
Also accepted: 200 variation selectors in a row, 100 alternating ZWSP/ZWNJ, inner U+FEFF, U+180E, U+034F, U+206A-206F, U+1D173-1D17A, and the documented residuals U+3164 and U+2800 as a whole message.

## Expected
Contract (QA-001 clarification): tag characters, U+2060-2064, U+FFF9-FFFB, U+00AD and invisible-only messages are rejected, and "blank-looking letters" U+3164/U+2800 are a documented accepted residual. It says nothing about run length, so the behavior above is contract-conformant.

## Actual
Accepted, stored verbatim, and returned to every reader including the operator and any AI agent that reads guestbook text.

## Impact
Low. This is the same prompt-injection concern that motivated QA-001 (hidden instructions for a model reading guestbook content), with a smaller and more awkward channel: it needs a purpose-built encoder, and a model must decode it. No script execution; browsers render the message as text. The practical risk grows only if the site later feeds guestbook text to an agent.

## Suggested fix direction
Bound the run length instead of banning the characters: for example reject more than 2 consecutive characters from `[​-‍︀-️﻿᠎͏⁪-⁯]` (real emoji sequences need at most a ZWJ plus a variation selector adjacent to a base character). Optionally require a variation selector to follow an emoji or symbol base. Alternatively record `wontfix` and rely on never feeding guestbook text to an agent unsanitized; if so, add that rule to the agent design docs. Keep test 24 as a change detector.

## Retest log
| Date | Commit | Result | Evidence and adjacent cases run |
|---|---|---|---|

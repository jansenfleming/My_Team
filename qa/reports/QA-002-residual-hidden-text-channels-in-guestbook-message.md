# QA-002: guestbook message still accepts long runs of zero-width and variation-selector characters

- Severity: Low
- Status: verified as decided (2026-09-21, fix commit `c9b6a32`, Architect decision: cap runs at 3). Residual: the cap does not remove the channel; see the retest log
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
Bound the run length instead of banning the characters: for example reject more than 2 consecutive characters from `[<U+200B>-<U+200D><U+FE00>-<U+FE0F><U+FEFF><U+180E><U+034F><U+206A>-<U+206F>]` (real emoji sequences need at most a ZWJ plus a variation selector adjacent to a base character). Optionally require a variation selector to follow an emoji or symbol base. Alternatively record `wontfix` and rely on never feeding guestbook text to an agent unsanitized; if so, add that rule to the agent design docs. Keep test 24 as a change detector.

## Retest log
| Date | Commit | Result | Evidence and adjacent cases run |
|---|---|---|---|
| 2026-09-21 | `c9b6a32` on `fix/qa-002-invisible-runs` | **verified** (rule as decided works; residual noted) | All original repros now rejected (200 variation selectors, 200 ZWSP/ZWNJ, the 56-selector hidden string, FEFF/180E/034F/206A/1D173 runs of 4). Exactly 3 in a row accepted and 4 rejected for each of 10 character classes in leading, inner and trailing position; mixed classes count together; check is on the raw input (padding does not hide a run); ZWJ families, heart-on-fire, kiss sequence, eye-in-speech-bubble, flags, keycaps, skin tones, Persian ZWNJ, Malayalam, Devanagari and Sinhala ZWJ forms still accepted; England/Scotland/Wales flags rejected as documented. **Residual (accepted by the decision, but quantified):** a visible character between groups of three resets the run, so a 64-byte hidden string encoded as variation-selector nibbles fits in a valid 171-unit message ("." + 3 selectors, repeated). The cap therefore lowers the channel's density (about 139 bytes per message before, about 105 after) but does not remove it. Suggested further step if the Architect wants it closed: cap the TOTAL number of invisible characters per message (for example 8), or allow U+FE0F/U+FE0E only directly after an emoji or symbol base. |

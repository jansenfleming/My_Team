# Gate: fix/qa-001-message-invisible-chars

- Verdict: PASS
- Branch: `fix/qa-001-message-invisible-chars` at commit `8d1176798c4bbad2ce2e5230f5b5a89b68f0f92a` (based on main `6f0f3bd`; this gate covers this commit only)
- Author: backend-engineer
- Gated by: security-qa-engineer, 2026-09-21. QA wrote the original reproduction, not the fix.
- Worktree used: `.worktrees/qa-check-fix-qa001` (detached at the commit, read-only, removed afterward)
- PR file reviewed: `docs/prs/fix-qa-001-message-invisible-chars.md`
- Oracle: `docs/architecture/api-contract.md` POST /api/guestbook and the "QA-001" changelog entry. Node v22.12.0, npm 11.6.1. Schema input/output tests only; no network, no server.

## Verdict rule
FAIL on any open Critical or High finding, a failing test, a failing hygiene tool, edits outside the author's owned paths, or a QA-001 reproduction that still works. None occurred. QA-001 is verified. One new Low finding (QA-002) is open and non-blocking.

## Commands run and real output
| Command (from the check worktree) | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `found 0 vulnerabilities` |
| `npm test -w @site/shared` | 0 | `Test Files 5 passed (5)`, `Tests 243 passed (243)` (was 187) |
| `npm run typecheck -w @site/shared` | 0 | no output |
| `npm run lint` | 0 | no output (the branch adds one `eslint-disable-next-line no-misleading-character-class` with a stated reason) |
| `npm test` (root) | 0 | shared 243 passed; `@site/qa` scanner self-tests 9 passed |
| `node qa/tools/scan-secrets.mjs --root <check worktree>` | 0 | `79 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS` |
| `npm audit --audit-level=high` | 0 | `found 0 vulnerabilities` |

## QA-001 retest (independent, QA-authored)
File: `qa/gates/b1-shared-contract.adversarial.test.mjs` (tests 15 to 24 are new; usage in the file header). The TypeScript schemas were bundled with esbuild into a scratch file.

Step 1, the ORIGINAL reproduction, unchanged test 15 from the first gate, run against the fixed bundle:
```
not ok 15 - observation QA-001: invisible format characters and invisible-only messages are accepted
    a message consisting only of one zero-width space is accepted (renders blank)
# pass 14 / # fail 1
```
The old "accepted" assertion now fails, i.e. the input is rejected. That test was then replaced by the tests below.

Step 2, the full updated file against the fixed bundle:
```
# tests 24
# pass 24
# fail 0
```
Step 3, non-vacuity: the same file against the PRE-fix bundle (`9d8f515`):
```
not ok 15, 16, 18, 20, 21, 22
# tests 24 / # pass 18 / # fail 6
```
So the new assertions detect the old behavior and pass only with the fix.

What is covered (all PASS on `8d11767`):
- Original repro inputs rejected: lone U+200B, U+2060/2062/2063, tag characters inside text, U+00AD, U+FFF9. `"a️b"` still accepted, as the backend engineer and the contract say.
- Every code point in U+E0000-E007F, U+E0100-E01EF, U+2060-2064, U+FFF9-FFFB and U+00AD, in leading, inner and trailing position, is rejected.
- Range edges are not over-blocked: U+E0080, U+E00FF, U+E01F0, U+2065, U+FFF8, U+FFFC, U+2059, U+00AC, U+00AE accepted.
- No-visible-character messages rejected: ZWSP/ZWNJ/ZWJ (alone and x50), lone U+FE0F, FE00-FE0F run, combining marks only, keycap combiner alone, NBSP+ZWSP, U+3000+ZWSP, U+180E, U+034F, musical formatting characters, spaces around ZWNJ.
- Legitimate text still accepted: plain text, single emoji, ZWJ family, couple-with-heart (contains U+FE0F), rainbow flag, US flag (regional indicators), keycaps `1` and `#`, skin tone, heart/smiley with U+FE0F, U+FE0E, man technologist, `e` + U+0301, Devanagari, Arabic with diacritics, Thai, Korean, CJK, Persian ZWNJ word, ZWSP between words, leading ZWSP before visible text, NBSP inside text, padded emoji; trim keeps ZWJ sequences intact; length rule unchanged (140 emoji accepted, 141 rejected).
- Validation details: fixed text, no input echo, exactly one detail for an invisible-only message (thanks to `abort: true` on the length rule), `GuestbookEntrySchema` (response side) enforces the same rule.
- Performance: 1 MB of ZWSP, 1 MB of combining marks, 300k tag characters and 1 MB of variation selectors parse in under 1.5 s total.

## Observations and findings
| ID | Severity | Status | Path |
|---|---|---|---|
| QA-001 | Low | **verified** | `qa/reports/QA-001-invisible-format-characters-in-guestbook-message.md` |
| QA-002 | Low | open, non-blocking | `qa/reports/QA-002-residual-hidden-text-channels-in-guestbook-message.md` |

- QA-002: long runs of U+FE00-FE0F or U+200B/C/D between visible characters are still accepted, and the contract allows that. A 28-byte hidden string encoded as variation selectors fits in a valid message. Suggested direction: cap consecutive invisible characters (for example 2). Architect decision.
- Documented tradeoff, not a finding: the England, Scotland and Wales flag emoji are sequences of tag characters (U+E0067 and following, terminated by U+E007F), so they are now rejected. Tested (test 20). Worth one sentence in the terminal or guestbook help text so a visitor is not confused.
- Nothing else changed in the schema surface: the diff touches only `MESSAGE_FORBIDDEN_PATTERN`, a new `MESSAGE_VISIBLE_PATTERN`, and `MessageSchema`.

## Ownership check
`git log --no-merges --name-only 6f0f3bd..8d11767`: `packages/shared/src/constants.ts`, `packages/shared/src/schemas.ts`, `packages/shared/src/guestbook.test.ts`, `docs/prs/fix-qa-001-message-invisible-chars.md`. All within the backend engineer's paths. OK. (The branch is based on `6f0f3bd`, one docs commit behind main `916c5fc`; the Architect should expect a trivial merge.)

## Not verified
- Only the schemas; no HTTP layer yet, so nothing about how B2 wires them. Q3 will retest at the endpoint once B2 to B4 are merged.
- Behavior in a real browser (how each character renders) was not observed; the "invisible" classification comes from Unicode categories, not from rendering.
- Unicode data comes from Node 22.12's ICU; a different Node build could classify newly assigned code points differently.

## Recommendation to Architect
Merge. QA-001 is verified fixed with adjacent emoji and multilingual cases intact. Decide QA-002 (cap runs, or accept and record `wontfix`).

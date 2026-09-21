# Gate: fix/qa-002-invisible-runs

- Verdict: PASS
- Branch: `fix/qa-002-invisible-runs` at commit `c9b6a32daff570bf295aeadd8f8575f310dd5bc9` (this gate covers this commit only)
- Author: backend-engineer
- Gated by: security-qa-engineer, 2026-09-21. QA wrote the original reproduction, not the fix.
- Worktree used: `.worktrees/qa-check-fix-qa002` (detached at the commit, read-only, removed afterward)
- PR file reviewed: `docs/prs/fix-qa-002-invisible-runs.md`
- Oracle: `docs/architecture/api-contract.md` POST /api/guestbook and the "QA-002" changelog entry (more than 3 consecutive invisible characters from `\p{Cf}`, U+FE00-FE0F, U+034F are rejected; tag-flag emoji unsupported). Node v22.12.0, npm 11.6.1. Schema input/output tests only.

## Verdict rule
FAIL on any open Critical or High finding, a failing test, a failing hygiene tool, edits outside the author's owned paths, or a QA-002 reproduction that still works. None occurred. QA-002 is verified as decided; the residual channel is quantified below (Info, non-blocking).

## Commands run and real output
| Command (from the check worktree) | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `found 0 vulnerabilities` |
| `npm test -w @site/shared` | 0 | `Test Files 5 passed (5)`, `Tests 308 passed (308)` (was 243) |
| `npm run typecheck -w @site/shared` | 0 | no output |
| `npm run lint` | 0 | no output |
| `npm test` (root) | 0 | web 7, shared 308, `@site/qa` scanner self-tests 9 |
| `node qa/tools/scan-secrets.mjs --root <check worktree>` | 0 | `89 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS` |
| `npm audit --audit-level=high` | 0 | `found 0 vulnerabilities` |

## Independent retest (QA-authored)
File: `qa/gates/b1-shared-contract.adversarial.test.mjs` (tests 24 to 33 are the QA-002 retest; usage in the file header). Schemas bundled with esbuild into a scratch file.
```
against c9b6a32:                    # tests 33  # pass 33  # fail 0
against the pre-fix bundle (QA-001 fix only):
    not ok 24, 25, 26, 27, 31       # tests 33  # pass 28  # fail 5
```
So the new assertions detect the old behavior and pass only with the fix.

All PASS on `c9b6a32`:
- Original QA-002 repros rejected: 200 variation selectors, 200 alternating ZWSP/ZWNJ, the 28-byte and 56-selector hidden string, runs of 4 of U+FEFF, U+180E, U+034F, U+206A, U+1D173.
- Boundary is exactly 3: for each of 10 classes (ZWSP, ZWNJ, ZWJ, VS16, VS1, CGJ, FEFF, U+206A, U+1D173, U+0600), 3 in a row is accepted and 4 rejected, leading, inner and trailing; 50 rejected. Mixed classes count together (ZWSP+VS16+ZWJ+CGJ rejected; the same three without CGJ accepted).
- Raw-input rule: `"   " + 4 x ZWSP + "hi"` and `"hi" + 4 x ZWSP + "   "` rejected (padding cannot hide a run).
- Space or a visible character breaks a run (documented behavior, see residual).
- Sequences that must still pass, all accepted: ZWJ family, family with skin tones, heart on fire (VS16 + ZWJ), couple with heart, kiss sequence (two VS16 and three ZWJ), eye in speech bubble, transgender flag, rainbow flag, pirate flag, US and JP flags, keycaps 1 # *, skin-tone thumbs up, man technologist with skin tone, text-style heart (FE0E), five hearts in a row, five families in a row, Persian words with ZWNJ, Malayalam chillu, Devanagari and Sinhala conjuncts with ZWJ, combining accents with CGJ, Arabic number sign. Trimmed output keeps sequences intact.
- England, Scotland and Wales flag emoji rejected, as the contract now documents.
- Validation: fixed text, exactly one detail on `message`, no input echo; `GuestbookEntrySchema` (response side) enforces the same rule.
- Performance: 1 MB runs, 70k repetitions of `a` + 3 ZW, and 100k repetitions of `ZW ZW ZW x` parse in under 1.5 s total.

## Observations and findings
| ID | Severity | Status | Path |
|---|---|---|---|
| QA-002 | Low | **verified** as decided, residual quantified | `qa/reports/QA-002-residual-hidden-text-channels-in-guestbook-message.md` |

- **Residual (Info, non-blocking):** the rule caps consecutive characters, so a visible character between groups of three resets it. Test 33 encodes a 64-byte string as variation-selector nibbles in the pattern `.` + 3 selectors, and it is a valid 171-unit message. Density drops from about 139 bytes to about 105 bytes per message; the channel is not closed. The Architect said "tighten proportionately", and the fix does exactly what the contract says. If the risk matters (guestbook text will be read by agents), the next step is a cap on the total number of invisible characters per message (for example 8) or restricting variation selectors to follow an emoji or symbol base. The contract's rule "guestbook text is untrusted data for AI agents" is the primary control either way.
- Regex behavior note: `MESSAGE_INVISIBLE_RUN_PATTERN = /[\p{Cf}<U+FE00>-<U+FE0F><U+034F>]{4}/u` is linear-time; no backtracking risk (performance test).
- One edge: `\p{Cf}` also covers characters like U+0600-0605 (Arabic number signs) and U+06DD; four of those in a row are now rejected. No legitimate text needs that.

## Ownership check
`git log --no-merges --name-only` from the merge-base: `packages/shared/src/constants.ts`, `packages/shared/src/schemas.ts`, `packages/shared/src/guestbook.test.ts`, `docs/prs/fix-qa-002-invisible-runs.md`. All within backend-engineer's paths. OK.

## Not verified
- Only the schemas; no HTTP layer for the guestbook route yet (B3). Q3 will retest at the endpoint.
- Rendering in a real browser was not observed; the classification comes from Unicode categories in Node 22.12's ICU.
- Whether the operator's or an agent's tooling strips or normalizes these characters downstream (out of scope).

## Recommendation to Architect
Merge. QA-002 rule works as specified with no loss of legitimate emoji or script sequences. Decide whether the quantified residual (about 105 hidden bytes per message) needs a total-count cap now or is accepted.

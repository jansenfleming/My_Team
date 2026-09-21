# Gate: feat/shared-contract (B1)

- Verdict: PASS
- Branch: `feat/shared-contract` at commit `9d8f5156dc317075f104061fdc71d4da41cc5af4` (this gate covers this commit only)
- Author: backend-engineer
- Gated by: security-qa-engineer, 2026-09-21
- Worktree used: `.worktrees/qa-check-shared-contract` (detached at the commit, read-only, removed afterward)
- PR file reviewed: `docs/prs/feat-shared-contract.md`
- Oracle: `docs/architecture/api-contract.md` sections 2, 5, 6, including the clarification in main commit `c7895f4`. Node v22.12.0, npm 11.6.1. No network or server involved; all checks are schema input/output tests.

## Verdict rule
FAIL on any open Critical or High finding, a failing test, a failing hygiene tool, or edits outside the author's owned paths. None occurred. One Low finding (QA-001) is open and non-blocking.

## Commands run and real output
| Command (from the check worktree) | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `found 0 vulnerabilities` |
| `npm test -w @site/shared` | 0 | `Test Files 5 passed (5)`, `Tests 187 passed (187)` |
| `npm run typecheck -w @site/shared` | 0 | `tsc --noEmit -p tsconfig.json`, no output |
| `npm run lint` | 0 | `eslint .`, no output |
| `npm test` (root) | 0 | same 187 tests |
| `npm run build` (root) | 0 | no workspace defines `build` (vacuous) |
| `node qa/tools/scan-secrets.mjs --root <check worktree>` | 0 | `48 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS` |
| `npm audit --audit-level=high` | 0 | `found 0 vulnerabilities` |

## Independent adversarial run (QA-authored, not the author's tests)
File: `qa/gates/b1-shared-contract.adversarial.test.mjs` (plain `node:test`). The TypeScript schemas were bundled with esbuild into a scratch file and imported; commands are in the file header.
```
$ SHARED_BUNDLE=<scratch>/shared.bundle.mjs node --test qa/gates/b1-shared-contract.adversarial.test.mjs
# tests 15
# pass 15
# fail 0
```
Non-vacuity check: the same file run against a bundle with ` ` and `؜` deliberately removed from `MESSAGE_FORBIDDEN_PATTERN` gave `# pass 14 / # fail 1` (test 2 failed), so the assertions do detect a weakened rule.

What the 15 tests cover, all PASS:
1. Constants equal contract sections 1, 3, 4, 5 and the error-code to HTTP-status table.
2. Message rejects (checked on RAW input before trim): `"hi\n"`, CR, TAB, all of C0 (U+0000-001F), DEL, C1 (U+0085, U+009F), ESC ANSI sequence, VT, FF, U+2028, U+2029, U+202A-202E, U+2066-2069, U+200E, U+200F, U+061C, lone high and lone low surrogates, trailing lone high surrogate.
3. Message accepts and trims: padded text, emoji, ZWJ family emoji, U+200B, NBSP inside, `<script>`, `<img onerror>`, SQL, template and JNDI-style strings; returned value is the trimmed string, otherwise verbatim.
4. Length in UTF-16 units after trim: 0, whitespace-only, Unicode-whitespace-only (NBSP, U+3000, U+FEFF) rejected; 280 accepted; 281 rejected; 140 emoji (280 units) accepted; **141 emoji (282 units) rejected**.
5. Non-string `handle` and `message` (null, undefined, number, boolean, array, object) rejected.
6. Handle 1/2/24/25 chars; `_`/`-` allowed; leading/trailing space or newline, dot, quotes, NUL, fullwidth Latin, Cyrillic homoglyph, emoji, `../..`, `%20`, zero-width char, U+2028 all rejected.
7. `limit`, `before`, `id` accept only digit strings and reject: `""`, `" "`, `"0"`, `"-1"`, `"+1"`, `"1.5"`, `"1.0"`, `"1e1"`, `"0x10"`, `"0b1"`, `"0o7"`, padded values, `"1\n"`, `NaN`, `Infinity`, `1_0`, fullwidth and Arabic-Indic digits, `"1,2"`, SQL-flavored strings, arrays (repeated query params), numbers, objects, null. `limit` 51 and 100000 rejected; `before`/`id` accept 9007199254740991 and reject 9007199254740992, 17-digit and beyond-int64 values.
8. Default `limit` is 20 when absent; `before` absent stays undefined.
9. Unknown keys stripped (`id`, `role`); JSON `__proto__` and `constructor.prototype` keys do not pollute `Object.prototype` and do not appear on the output.
10. `toValidationDetails` never echoes input (marker strings in handle, message, limit, before, username, password never appear in details) and returns at most 10 details.
11. Login request: 1..64 and 1..256 bounds, empty and non-string rejected, password is not trimmed.
12. `ApiError`: `details` allowed only with `validation_error`; unknown code and empty message rejected.
13. Response schemas: list/entry/health/me/login/diagnostics shapes, `nextBefore` required, offset timestamps and non-ms timestamps rejected, role other than `operator` rejected, negative or fractional counts rejected.
14. Performance: 1 MB strings, 100k bidi characters, 100k lone surrogates across all request schemas parse in under 1.5 s total (no catastrophic backtracking).
15. Observation (QA-001): invisible format characters are accepted (see below).

## Observations and findings
| ID | Severity | Status | Path |
|---|---|---|---|
| QA-001 | Low | open, non-blocking | `qa/reports/QA-001-invisible-format-characters-in-guestbook-message.md` |

- QA-001: `\p{Cf}` characters such as a lone U+200B, U+2060-2064, Unicode tag characters U+E0000-E007F, variation selectors, soft hyphen and U+FFF9-FFFB are accepted, so an invisible-only or hidden-payload guestbook message is valid. The contract permits zero-width characters, so this is a hardening decision for the Architect, not a contract violation.
- Observation (not a finding): `limit`, `before` and `id` accept leading zeros (`"050"` parses to 50, `"0007"` to 7). Harmless; noting it so the API suite (Q3) does not treat it as a surprise.
- Observation: `HANDLE_PATTERN` uses `$` without the `m` flag; JS `$` does not match before a trailing newline, and `"ab\n"` is rejected (tested).
- Confirmed against the contract text: the check runs before trimming, lengths count UTF-16 units, `\p{Cc}` covers DEL and C1, lone surrogates and separators rejected, zero-width joiners allowed, details never echo input.

## Ownership check
`git log --no-merges --name-only 08e589b..9d8f515`: `packages/shared/**`, `docs/prs/feat-shared-contract.md`, `package-lock.json`, plus architect-authored docs (ADR, contract, board, review) that arrived through the branch's merge from `main`. Nothing authored outside `packages/shared` by this branch. OK.

## Not verified
- Only the schemas were tested; there is no HTTP layer yet, so nothing about status codes, headers, or how Fastify hands query and body values to these schemas (for example whether repeated query parameters arrive as arrays, which the schema handles). Q3 covers that after B2 to B4.
- Whether the final API returns `toValidationDetails` output unmodified is B2's responsibility to show.
- `zod` internals were not reviewed; only `npm audit` advisories (0) were checked.

## Recommendation to Architect
Merge. The schemas match the contract text including `c7895f4`, and the adversarial inputs you listed (control characters, U+2028/2029, bidi marks and overrides, lone surrogates, 141 emoji, `"hi\n"`, `"0x10"`, `"1e1"`, `""`, `"0"`) all behave as specified. Decide on QA-001 (accept as `wontfix`, or ask backend to tighten the pattern in a later branch).

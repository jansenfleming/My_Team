# fix/qa-001-message-invisible-chars

Branch `fix/qa-001-message-invisible-chars` (cut from main `6f0f3bd`, worktree `.worktrees/api`), author backend-engineer. Fixes QA finding QA-001 (Low): the guestbook `message` accepted invisible format characters and invisible-only messages. Implements the Architect's contract amendment (`docs/architecture/api-contract.md` section 6 "message", changelog "v1.0 clarification (2026-09-21, QA-001)"). Finding report: `qa/reports/QA-001-invisible-format-characters-in-guestbook-message.md`. Ready to retest; only QA marks it verified.

## What changed (`packages/shared` only)
- `src/constants.ts`: `MESSAGE_FORBIDDEN_PATTERN` now also rejects tag characters U+E0000-E007F, variation selectors supplement U+E0100-E01EF, U+2060-2064, U+FFF9-FFFB and soft hyphen U+00AD. New `MESSAGE_VISIBLE_PATTERN` = `/[^\p{Cf}\p{Z}\p{M}]/u`. One inline `eslint-disable-next-line no-misleading-character-class` with the reason (the class lists standalone code points; U+E0100-E01EF are combining marks). Root `eslint.config.js` untouched.
- `src/schemas.ts`: `MessageSchema` order is now: forbidden characters on the RAW input (abort) -> trim -> length 1..280 (abort) -> at least one visible character in the trimmed value. Fixed text for the new issue: `message must contain at least one visible character`. An empty or blank message still reports only the length issue (one detail).
- `src/guestbook.test.ts`: +56 tests (187 -> 243). Each of the 16 new forbidden code points is tested in the middle, alone and at the ends; new describe block covers invisible-only messages, neighbours of the new ranges, and emoji sequences.
- No new dependencies. `package-lock.json` untouched.

## Behaviour to retest
- Rejected: any of U+00AD, U+2060-2064, U+FFF9-FFFB, U+E0000-E007F, U+E0100-E01EF anywhere (also a tag-character payload appended to an otherwise normal message); messages whose trimmed value has no character outside `\p{Cf}`, `\p{Z}`, `\p{M}` (lone/repeated U+200B, U+200C, U+200D, U+FE0F, U+FE00-FE0F only, combining marks only, BOM, U+180E, U+0600, NBSP/ideographic spaces only, ZWSP padded with spaces).
- Still accepted (contract): U+200B/200C/200D and U+FE00-FE0F between visible characters, e.g. `"a\u200bb"`; ZWJ family emoji, keycap `1\ufe0f\u20e3`, flags, skin tone, `\u2764\ufe0f`, rainbow flag ZWJ sequence; `"\u200b.\u200b"`, `"\u0301x"`; letters with combining marks; CJK.
- Note for QA-001's repro list: the variation selector case `"a\ufe0fb"` stays ACCEPTED by design (contract keeps U+FE00-FE0F for emoji); only the invisible-only form (`"\ufe0f"` alone) is rejected now. The other repro inputs (lone ZWSP, `⁠⁢⁣`, tag characters, soft hyphen, U+FFF9) are rejected.
- Residual risk accepted in the contract: other blank-looking letters (U+3164, U+2800) still pass; a test pins this as a change detector. Also unlisted and still accepted: U+206A-206F (deprecated format characters) and U+E0080-E00FF / after U+E01EF (unassigned).

## How to test
```
cd .worktrees/api && npm install
npm test -w @site/shared
npm run typecheck -w @site/shared
```

## Real command output (run 2026-09-21 in `.worktrees/api` on this branch; `npm warn EBADENGINE`/deprecation lines filtered out)
```
$ npm test -w @site/shared

> @site/shared@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/packages/shared

 Test Files  5 passed (5)
      Tests  243 passed (243)
   Start at  17:53:15
   Duration  213ms (transform 45%, import 43%, tests 9%, worker 3%)
exit: 0

$ npm run typecheck -w @site/shared

> @site/shared@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json
exit: 0

$ npm run lint

> my-team-site@0.0.0 lint
> eslint .
exit: 0

$ npm run typecheck

> my-team-site@0.0.0 typecheck
> npm run typecheck --workspaces --if-present

> @site/web@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json

> @site/shared@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json
exit: 0

$ npm test

> my-team-site@0.0.0 test
> npm run test --workspaces --if-present

> @site/web@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/apps/web

 Test Files  3 passed (3)
      Tests  7 passed (7)
   Start at  17:53:20
   Duration  724ms (environment 66%, setup 17%, tests 7%, import 6%, transform 3%)

> @site/shared@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/packages/shared

 Test Files  5 passed (5)
      Tests  243 passed (243)
   Start at  17:53:21
   Duration  198ms (transform 48%, import 39%, tests 10%, worker 3%)

> @site/qa@0.0.0 test
> node --test "tools/*.test.mjs"

TAP version 13
# Subtest: clean tree passes (exit 0)
ok 1 - clean tree passes (exit 0)
  ---
  duration_ms: 62.149709
  ...
# Subtest: planted fake secrets are caught (exit 1) and never printed
ok 2 - planted fake secrets are caught (exit 1) and never printed
  ---
  duration_ms: 61.937
  ...
# Subtest: generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
ok 3 - generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
  ---
  duration_ms: 115.50025
  ...
# Subtest: token-format secrets in test paths still fail
ok 4 - token-format secrets in test paths still fail
  ---
  duration_ms: 59.161875
  ...
# Subtest: inline allow marker and allowlist file (with reason) suppress findings
ok 5 - inline allow marker and allowlist file (with reason) suppress findings
  ---
  duration_ms: 117.755375
  ...
# Subtest: allowlist entry without a reason is rejected (exit 2)
ok 6 - allowlist entry without a reason is rejected (exit 2)
  ---
  duration_ms: 50.886958
  ...
# Subtest: --path scans a directory (for build output)
ok 7 - --path scans a directory (for build output)
  ---
  duration_ms: 50.221834
  ...
# Subtest: --history finds a secret that was committed then deleted
ok 8 - --history finds a secret that was committed then deleted
  ---
  duration_ms: 195.437667
  ...
# Subtest: usage errors exit 2
ok 9 - usage errors exit 2
  ---
  duration_ms: 48.278917
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 824.210542
exit: 0

$ npm run build

> my-team-site@0.0.0 build
> npm run build --workspaces --if-present

> @site/web@0.0.0 build
> vite build

vite v7.3.6 building client environment for production...
transforming...
✓ 29 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-B25urSPA.css    0.19 kB │ gzip:  0.17 kB
dist/assets/index-BPUhLTGv.js   222.77 kB │ gzip: 69.43 kB
✓ built in 504ms
exit: 0
```

Mutation checks (run by hand, reverted): narrowing U+2060-2064 to 2060-2063 and U+E0100-E01EF to E0100-E01EE made 4 tests fail (U+2064 and U+E01EF, middle and ends); replacing the visibility check with `true` made 14 tests fail.

## Not covered
- The fix is verified through schema tests only. `POST /api/guestbook` does not exist yet (B3), so no HTTP-level retest is possible; QA can re-run its `b1-shared-contract.adversarial` schema test against this branch.
- Frontend can use `MESSAGE_FORBIDDEN_PATTERN` and `MESSAGE_VISIBLE_PATTERN` from `@site/shared/constants` for client-side hints; the server remains authoritative.

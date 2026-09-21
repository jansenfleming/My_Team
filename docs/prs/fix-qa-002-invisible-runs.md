# fix/qa-002-invisible-runs

Branch `fix/qa-002-invisible-runs` (cut from main `a6b6710`, worktree `.worktrees/api`), author backend-engineer. Fixes QA finding QA-002 (Low): a guestbook `message` could carry hidden text in unlimited runs of zero-width / variation-selector characters. Implements the contract amendment merged in PR #6 (`docs/architecture/api-contract.md` section 6 "message", changelog "v1.0 clarification (2026-09-21, QA-002)"). Finding report: `qa/reports/QA-002-residual-hidden-text-channels-in-guestbook-message.md`. Ready to retest; only QA marks it verified.

## What changed (`packages/shared` only)
- `src/constants.ts`: `MESSAGE_MAX_INVISIBLE_RUN = 3` and `MESSAGE_INVISIBLE_RUN_PATTERN = /[\p{Cf}\uFE00-\uFE0F\u034F]{4}/u` (a run of 4 invisible characters: any `\p{Cf}`, variation selectors U+FE00-FE0F, combining grapheme joiner U+034F).
- `src/schemas.ts`: `MessageSchema` gets one more RAW-input check after the forbidden-character check and before trimming, so trimming a BOM cannot hide a run. Fixed text: `message must not contain a long run of invisible characters` (one issue, abort).
- `src/guestbook.test.ts`: +65 tests (243 -> 308). All non-ASCII characters in this test file are now written as `\u` escapes (they had been pasted as literal invisible characters, which is unreviewable; behaviour unchanged, same tests pass).
- No new dependencies; `package-lock.json` untouched.

## Behaviour to retest
- Rejected: any run of 4 or more (tested at 4, 5, 20, 200) of each of 13 invisible characters (ZWSP, ZWNJ, ZWJ, VS1, VS16, U+034F, U+0600, U+180E, U+FEFF, U+206A, U+206F, U+1D173, U+1D17A), at the start, in the middle, at the end and next to spaces; mixed runs of 4 (for example VS16+ZWJ+VS16+ZWJ); the QA-002 reproductions (56 variation selectors, 200 VS16, 100 alternating ZWSP/ZWNJ, runs of U+FEFF, U+180E, U+034F, U+206A-206F, U+1D173-1D176); BOM x4 before text.
- Accepted: runs of 1, 2 and 3 of each character between visible characters, mixed runs of 3; runs that are interrupted by a space, a visible character or a combining mark outside the class (U+0301).
- Emoji still pass (17 sequences, each alone and repeated in a sentence): ZWJ families (3 and 4 members), rainbow/transgender/pirate flags, heart on fire, kiss, eye in speech bubble, keycaps, regional-indicator flags, skin tones and ZWJ professions, couple with skin tones and heart, VS15. A test asserts the longest invisible run in all of them is at most 2.
- England/Scotland/Wales flag emoji (tag sequences) are rejected because tag characters are forbidden (contract states this; tested).
- Accepted residual (as QA and the contract note): runs of 3 separated by a visible character still carry hidden data at a cost of one visible character per 3; U+3164 and U+2800 still pass; a test pins the runs-of-3 case as a change detector.

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
      Tests  308 passed (308)
   Start at  18:03:47
   Duration  214ms (transform 52%, import 37%, tests 9%, worker 2%)
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
   Start at  18:03:51
   Duration  737ms (environment 66%, setup 17%, tests 7%, import 6%, transform 4%)

> @site/shared@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/packages/shared

 Test Files  5 passed (5)
      Tests  308 passed (308)
   Start at  18:03:52
   Duration  206ms (transform 47%, import 40%, tests 9%, worker 3%)

> @site/qa@0.0.0 test
> node --test "tools/*.test.mjs"

TAP version 13
# Subtest: clean tree passes (exit 0)
ok 1 - clean tree passes (exit 0)
  ---
  duration_ms: 64.601167
  ...
# Subtest: planted fake secrets are caught (exit 1) and never printed
ok 2 - planted fake secrets are caught (exit 1) and never printed
  ---
  duration_ms: 63.937042
  ...
# Subtest: generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
ok 3 - generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
  ---
  duration_ms: 124.878417
  ...
# Subtest: token-format secrets in test paths still fail
ok 4 - token-format secrets in test paths still fail
  ---
  duration_ms: 62.431833
  ...
# Subtest: inline allow marker and allowlist file (with reason) suppress findings
ok 5 - inline allow marker and allowlist file (with reason) suppress findings
  ---
  duration_ms: 123.049417
  ...
# Subtest: allowlist entry without a reason is rejected (exit 2)
ok 6 - allowlist entry without a reason is rejected (exit 2)
  ---
  duration_ms: 53.076209
  ...
# Subtest: --path scans a directory (for build output)
ok 7 - --path scans a directory (for build output)
  ---
  duration_ms: 56.881709
  ...
# Subtest: --history finds a secret that was committed then deleted
ok 8 - --history finds a secret that was committed then deleted
  ---
  duration_ms: 209.503291
  ...
# Subtest: usage errors exit 2
ok 9 - usage errors exit 2
  ---
  duration_ms: 47.852291
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 875.173208
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
✓ built in 481ms
exit: 0
```

Mutation checks (run by hand, reverted): changing the run length from 4 to 5 made 29 tests fail; dropping U+034F from the class made 4 fail.

## Not covered
- Verified through schema tests only; `POST /api/guestbook` arrives in B3, so there is no HTTP-level check yet. QA can re-run its `b1-shared-contract.adversarial` schema test (test 24) against this branch.
- Frontend may use `MESSAGE_INVISIBLE_RUN_PATTERN` from `@site/shared/constants` for a client-side hint; the server stays authoritative.

# feat/api-guestbook (B3): SQLite and guestbook

Branch `feat/api-guestbook` (cut from main `df5e6ca`, worktree `.worktrees/api`), author backend-engineer. Implements board task B3 exactly per `docs/architecture/api-contract.md` v1.0: `better-sqlite3` DB module, a migration runner, `GET/POST /api/guestbook`, the 3-per-10-min POST limit, and a real DB check in `GET /api/health`.

## What changed
- `apps/api/migrations/001_init.sql`: `guestbook_entries` (with an index for the keyset-pagination read) and `sessions` (for B4; not used yet).
- `apps/api/src/db/connection.ts`: `openDb(path)` (creates the parent directory, WAL for file DBs, `foreign_keys` and `busy_timeout` pragmas; `:memory:` skips WAL) and `isDbHealthy(db)` (never throws).
- `apps/api/src/db/migrate.ts`: runs every `migrations/*.sql` file once, in filename order, each inside a transaction, tracked in a `_migrations` table. Idempotent (safe to call on every startup and in every test).
- `apps/api/src/db/guestbook-repo.ts`: `insertGuestbookEntry`, `listGuestbookEntries` (keyset pagination), `countGuestbookEntries`, `deleteGuestbookEntry` (for B4). Every statement is parameterized (`?` placeholders); nothing is built by string concatenation.
- `apps/api/src/routes/guestbook.ts`: `GET /api/guestbook` (public) and `POST /api/guestbook` (public, 3/10min). See "Rate-limit design note" below for why POST is registered inside its own encapsulation scope.
- `apps/api/src/config.ts`: new `DATABASE_PATH` env var (default `data/site.db`; `:memory:` allowed; rejects empty and NUL-byte values).
- `apps/api/src/app.ts`: `AppDeps.db` wires the guestbook routes and adds a DB check (`isDbHealthy`) to `/api/health`, ahead of any other health checks, only when a `db` is supplied (a `buildApp` call with no `db`, as every B2 test still does, behaves exactly as before: no guestbook routes, no DB check).
- `apps/api/src/server.ts`: opens the DB and runs migrations before building the app.
- `apps/api/.env.example`: documents `DATABASE_PATH`.
- `apps/api/src/test-helpers.ts`: `openTestDb()` and `buildGuestbookTestApp()` (fresh in-memory DB + migrations per call).
- Tests: `db/migrate.test.ts` (4), `db/guestbook-repo.test.ts` (9), `routes/guestbook.test.ts` (44), plus 2 new/updated cases in `config.test.ts` for `DATABASE_PATH`. API test count: 102 -> 146.

## Rate-limit design note (worth a reviewer's attention)
`@fastify/rate-limit` marks a request with a shared `Symbol` (`rateLimitRan`) the first time any of its hooks runs on that request, and every later hook from the *same plugin registration* silently no-ops once that marker is set. B2's app-wide limiter is a manually-added `onRequest` hook; registering a second, stricter limiter for `POST /api/guestbook` on the *same* `app` instance (either via route `config.rateLimit` or the `app.rateLimit()` decorator) shares that marker with the app-wide hook, so whichever runs first "wins" and the second is silently skipped. I hit this, confirmed it by reading the plugin source and reproducing it standalone, then fixed it. The fix: register `@fastify/rate-limit` a second time, but inside its own Fastify encapsulation scope (`app.register(async (scoped) => { await scoped.register(rateLimit, opts); scoped.post(...); })`). Each registration gets its own internal state and therefore its own marker Symbol, so the app-wide hook and the route-specific one both run and both count independently, confirmed with a standalone repro and now exercised by the "additional to the global limit" test. Every POST to `/api/guestbook`, including ones later rejected by the stricter limit, still advances the global counter (both hooks run; the app-wide one runs first and always allows, since it is the looser bound).

## Dependencies added (`@site/api`)
- `better-sqlite3@^12.11.1` (pinned per ADR 0001; 13.x segfaults on Node 22.12 here per the ADR, not retested here).
- `@types/better-sqlite3` (dev; the package ships no types).
- `npm audit --audit-level=high`: found 0 vulnerabilities.

## Behaviour notes for reviewers and QA
- `nextBefore` is the smallest id on the current page when more rows exist, else `null` (contract section 6); verified across 3 pages with 5 rows and at the exact-boundary case (a page that empties the table).
- Handle/message validation (charset, length, control/bidi/invisible-run rejection) is unchanged from B1/QA-001/QA-002; this branch only stores and returns whatever `@site/shared` already accepted, verbatim, via parameterized SQL. Both a SQLi payload in `message` (rejected as SQL, stored as text) and a SQLi attempt in `handle` (rejected by the charset regex before it reaches SQL) are tested.
- The extra POST-only rate limit stacks with (does not replace) the global 120/min limit; see the design note above. A request rejected by validation still counts toward the guestbook 3/10min bucket (matches "public, rate limited" in the contract; also visible in the live transcript below, where a rejected 3rd request left 0 remaining).
- `/api/health` is 503 `unavailable` when the DB is closed (tested), and the DB check runs before any other health check.
- `GET /api/guestbook` is safe/unauthenticated and explicitly tested against a hostile `Origin` header to confirm the CSRF layer still only restricts mutating methods.
- A closed-DB write (`INSERT` throwing) is mapped to a generic `500 internal_error` with no SQL/table/path text in the body (tested); there is no more specific contract code for "insert failed", so this falls through to the existing B2 unexpected-error handling.
- `data/` (the default SQLite location) is already gitignored per ADR 0001; nothing was added to `.gitignore` here.

## How to test
```
cd .worktrees/api && npm install
npm test -w @site/api
npm run typecheck -w @site/api
npm run dev -w @site/api   # then curl the endpoints below
```

## Real command output (run 2026-09-22 in `.worktrees/api`; `npm warn EBADENGINE`/deprecation lines filtered out)
```
$ npm test -w @site/api

> @site/api@0.1.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/apps/api

 Test Files  5 passed (5)
      Tests  146 passed (146)
   Start at  17:41:56
   Duration  650ms (tests 43%, transform 28%, import 27%, worker 1%)
exit: 0

$ npm run typecheck -w @site/api

> @site/api@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json
exit: 0

$ npm run lint

> my-team-site@0.0.0 lint
> eslint .
exit: 0

$ npm run typecheck

> my-team-site@0.0.0 typecheck
> npm run typecheck --workspaces --if-present

> @site/api@0.1.0 typecheck
> tsc --noEmit -p tsconfig.json

> @site/web@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json

> @site/shared@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json
exit: 0

$ npm test

> my-team-site@0.0.0 test
> npm run test --workspaces --if-present

> @site/api@0.1.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/apps/api

 Test Files  5 passed (5)
      Tests  146 passed (146)
   Start at  17:42:02
   Duration  498ms (tests 44%, transform 33%, import 22%, worker 1%)

> @site/web@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/apps/web

 Test Files  9 passed (9)
      Tests  77 passed (77)
   Start at  17:42:03
   Duration  2.40s (environment 62%, setup 15%, tests 14%, transform 7%, import 2%)

> @site/shared@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/packages/shared

 Test Files  5 passed (5)
      Tests  308 passed (308)
   Start at  17:42:05
   Duration  211ms (transform 53%, import 36%, tests 8%, worker 3%)

> @site/qa@0.0.0 test
> node --test "tools/*.test.mjs"

TAP version 13
# Subtest: clean tree passes (exit 0)
ok 1 - clean tree passes (exit 0)
  ---
  duration_ms: 75.51875
  ...
# Subtest: planted fake secrets are caught (exit 1) and never printed
ok 2 - planted fake secrets are caught (exit 1) and never printed
  ---
  duration_ms: 57.611167
  ...
# Subtest: generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
ok 3 - generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
  ---
  duration_ms: 109.001625
  ...
# Subtest: token-format secrets in test paths still fail
ok 4 - token-format secrets in test paths still fail
  ---
  duration_ms: 54.229667
  ...
# Subtest: inline allow marker and allowlist file (with reason) suppress findings
ok 5 - inline allow marker and allowlist file (with reason) suppress findings
  ---
  duration_ms: 108.64125
  ...
# Subtest: allowlist entry without a reason is rejected (exit 2)
ok 6 - allowlist entry without a reason is rejected (exit 2)
  ---
  duration_ms: 46.460041
  ...
# Subtest: --path scans a directory (for build output)
ok 7 - --path scans a directory (for build output)
  ---
  duration_ms: 47.679292
  ...
# Subtest: --history finds a secret that was committed then deleted
ok 8 - --history finds a secret that was committed then deleted
  ---
  duration_ms: 190.915792
  ...
# Subtest: usage errors exit 2
ok 9 - usage errors exit 2
  ---
  duration_ms: 45.318667
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 796.433083
exit: 0

$ npm run build

> my-team-site@0.0.0 build
> npm run build --workspaces --if-present

> @site/web@0.0.0 build
> vite build

vite v7.3.6 building client environment for production...
transforming...
✓ 40 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-atvfZETO.css    1.21 kB │ gzip:  0.58 kB
dist/assets/index-DL1Nhcnd.js   230.69 kB │ gzip: 72.54 kB
✓ built in 452ms
exit: 0

$ npm audit --audit-level=high
found 0 vulnerabilities
exit: 0
```

## Real dev-server curl round trip (`PORT=3411 npm run dev -w @site/api`, localhost only; `apps/api/data/` removed afterward)
```
$ PORT=3411 npm run dev -w @site/api   (background; startup line)
{"level":30,"msg":"Server listening at http://127.0.0.1:3411"}

$ curl -si http://127.0.0.1:3411/api/health
HTTP/1.1 200 OK
x-request-id: fcb7d3a3-0872-48c6-94bc-fca1b39b7784
{"status":"ok","version":"0.1.0","contract":"1.0","time":"2026-09-22T21:41:38.604Z"}


$ curl -si -X POST -H "Content-Type: application/json" -d '{"handle":"ghost_42","message":"hello grid"}' http://127.0.0.1:3411/api/guestbook
HTTP/1.1 201 Created
Content-Security-Policy: default-src 'none';frame-ancestors 'none'
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: DENY
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
x-request-id: 2fc7d0b7-5fa0-49c5-a11e-6079846e916f
x-ratelimit-limit: 3
x-ratelimit-remaining: 2
x-ratelimit-reset: 600
content-type: application/json; charset=utf-8
content-length: 100
Date: Tue, 22 Sep 2026 21:41:38 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"entry":{"id":1,"handle":"ghost_42","message":"hello grid","createdAt":"2026-09-22T21:41:38.616Z"}}

$ curl -si -X POST -H "Content-Type: application/json" -d '{"handle":"night_owl","message":"second entry"}' http://127.0.0.1:3411/api/guestbook
HTTP/1.1 201 Created
{"entry":{"id":2,"handle":"night_owl","message":"second entry","createdAt":"2026-09-22T21:41:38.625Z"}}


$ curl -si http://127.0.0.1:3411/api/guestbook
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'none';frame-ancestors 'none'
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: DENY
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
x-request-id: 965fde37-ebb7-4fc2-910f-104645b576d8
x-ratelimit-limit: 120
x-ratelimit-remaining: 115
x-ratelimit-reset: 60
content-type: application/json; charset=utf-8
content-length: 214
Date: Tue, 22 Sep 2026 21:41:38 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"items":[{"id":2,"handle":"night_owl","message":"second entry","createdAt":"2026-09-22T21:41:38.625Z"},{"id":1,"handle":"ghost_42","message":"hello grid","createdAt":"2026-09-22T21:41:38.616Z"}],"nextBefore":null}

$ curl -si "http://127.0.0.1:3411/api/guestbook?limit=1"
HTTP/1.1 200 OK
{"items":[{"id":2,"handle":"night_owl","message":"second entry","createdAt":"2026-09-22T21:41:38.625Z"}],"nextBefore":2}


$ curl -si -X POST -H "Content-Type: application/json" -d '{"handle":"a","message":""}' http://127.0.0.1:3411/api/guestbook   (invalid: short handle, empty message)
HTTP/1.1 400 Bad Request
Content-Security-Policy: default-src 'none';frame-ancestors 'none'
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: DENY
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
x-request-id: c2e235e3-88f8-4137-89bf-16dc8639eca5
x-ratelimit-limit: 3
x-ratelimit-remaining: 0
x-ratelimit-reset: 600
content-type: application/json; charset=utf-8
content-length: 267
Date: Tue, 22 Sep 2026 21:41:38 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"validation_error","message":"The request is invalid.","requestId":"c2e235e3-88f8-4137-89bf-16dc8639eca5","details":[{"path":"handle","message":"handle must be 2 to 24 characters"},{"path":"message","message":"message must be 1 to 280 characters"}]}}

$ curl -si -X POST -H "Content-Type: application/json" -d '{"handle":"ghost_42","message":"3rd"}' http://127.0.0.1:3411/api/guestbook   (3rd post)
HTTP/1.1 429 Too Many Requests
x-ratelimit-limit: 3
x-ratelimit-remaining: 0
x-ratelimit-reset: 600
retry-after: 600

$ curl -si -X POST -H "Content-Type: application/json" -d '{"handle":"ghost_42","message":"4th (over guestbook limit)"}' http://127.0.0.1:3411/api/guestbook
HTTP/1.1 429 Too Many Requests
Content-Security-Policy: default-src 'none';frame-ancestors 'none'
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: DENY
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
x-request-id: c754f676-9ab2-488e-a8a8-ea36c606d848
x-ratelimit-limit: 3
x-ratelimit-remaining: 0
x-ratelimit-reset: 600
retry-after: 600
content-type: application/json; charset=utf-8
content-length: 132
Date: Tue, 22 Sep 2026 21:41:38 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":{"code":"rate_limited","message":"Too many requests. Try again later.","requestId":"c754f676-9ab2-488e-a8a8-ea36c606d848"}}

$ lsof -nP -iTCP:3411 -sTCP:LISTEN
COMMAND NAME 
node 127.0.0.1:3411 (LISTEN)
```
(The sequence: 2 successful POSTs, then 1 invalid POST that still counts toward the guestbook limit, so the *next* POST, a 4th request to the route, is the one rejected with `429` and `x-ratelimit-limit: 3`/`retry-after: 600`.)

## Mutation checks (run by hand, reverted; `git diff` is clean afterward)
- Removing the scoped per-route limiter (leaving only the global one): 1 test failed (the 429-on-4th-post test).
- Forcing `hasMore` to always be `false` in `listGuestbookEntries`: 1 test failed (keyset pagination across 3 pages).
- Replacing the parameterized `INSERT` with string-concatenated SQL: 3 tests failed (all three SQLi-payload tests), confirming they would catch a real injection, not just a validation gap.

## Not covered
- `DELETE /api/admin/guestbook/:id` and operator auth are B4 (the repo function `deleteGuestbookEntry` exists and is unit-tested here so B4 only needs to wire the route and the `requireOperator` hook).
- No CI run yet (B5). No graceful shutdown / WAL checkpoint on exit yet (B6).
- `journal_mode = WAL` is set for file-backed DBs but not exercised by a test (tests use `:memory:`, where WAL is skipped); the live curl run above did use the real file path and produced `site.db`, `site.db-shm` and `site.db-wal`, confirming WAL mode engages there.

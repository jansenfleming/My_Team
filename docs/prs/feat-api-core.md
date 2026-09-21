# feat/api-core (B2): API core

Branch `feat/api-core` (cut from main, then `main` at `7463816` merged in), worktree `.worktrees/api`, author backend-engineer. Implements board task B2 exactly per `docs/architecture/api-contract.md` v1.0: Fastify 5 app factory, validated env config, contract error handler, request id, helmet, global rate limit, Origin/Sec-Fetch-Site check, `GET /api/health`. No database yet (B3), no auth (B4).

## What changed (`apps/api/**` only, plus the generated `package-lock.json`)
- `src/app.ts`: `buildApp(config, deps?)` returns an un-started Fastify instance. Order of hooks: request id, helmet, global rate limit (app-level `onRequest`, so unknown routes and origin-rejected requests count), Origin check, then routes. Error handler, not-found handler and `frameworkErrors` (malformed URL) all produce the contract body. Removes Fastify's default `text/plain` parser so any non-JSON body is 415. `bodyLimit` = 4096. Own uuid request ids only (`requestIdHeader: false`, a client `X-Request-Id` is ignored). `trustProxy` from config (default off). Basic pino redaction of `authorization`/`cookie`/`set-cookie` headers (full redaction test is B6).
- `src/errors.ts`: fixed generic messages per code, `ApiHttpError` (throw from routes/hooks), `mapError` (ZodError -> `validation_error` with `details` via `toValidationDetails`; framework 404/413/415/429/other 4xx; everything else `internal_error`, details only in server logs), `sendError`.
- `src/config.ts`: zod-validated env: `NODE_ENV`, `HOST` (127.0.0.1), `PORT` (3001), `WEB_ORIGIN` (contract default, exact origins only, no wildcard), `TRUST_PROXY` (false), `LOG_LEVEL`. Errors name the variable, never the value.
- `src/routes/health.ts`: `GET /api/health`; `deps.healthChecks` lets B3 plug the DB check in (a failing or throwing check gives 503 `unavailable`, no detail leaked).
- `src/server.ts` (binds `127.0.0.1:3001` by default), `src/version.ts`, `.env.example` (placeholders; later variables are commented and marked "not read yet"), `package.json` scripts `dev` (tsx watch), `start`, `test`, `typecheck`, `tsconfig.json`, `vitest.config.ts`, `src/test-helpers.ts`.
- Tests: `src/app.test.ts` (65) and `src/config.test.ts` (23), 88 total.

## Dependencies added (`@site/api`)
- `fastify@^5.12`, `@fastify/helmet@^13`, `@fastify/rate-limit@^11`, `zod@^4.6` (config validation and shared schemas), `@site/shared` (workspace link, `"*"`): all in the ADR/kickoff list.
- dev: `tsx@^4`, `vitest@^5`.
- Not added yet: `@fastify/cookie` (B4), `better-sqlite3` (B3). `npm audit --audit-level=high`: found 0 vulnerabilities.

## Behaviour notes for reviewers and QA
- CSP is exactly `default-src 'none';frame-ancestors 'none'` (`useDefaults: false`; helmet's web-page defaults were being merged in until I looked at the live headers). Also sent: nosniff, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, CORP/COOP same-origin, HSTS (ignored by browsers on plain http). No `X-Powered-By`, no `Server`, no `Access-Control-*` even for preflights or foreign origins.
- Rate limit is per socket IP; `X-Forwarded-For` is ignored unless `TRUST_PROXY=true` (both cases tested). The plugin also sends `x-ratelimit-*` headers and `Retry-After` (integer seconds) on 429.
- Origin check runs on POST/PUT/PATCH/DELETE before routing: no Origin passes; exact-match allow-list otherwise (case-sensitive; `null`, empty, trailing slash, other port/scheme, look-alike hosts all rejected); `Sec-Fetch-Site: cross-site` rejected (case-insensitive) even with an allowed Origin.
- Malformed JSON, empty JSON body and prototype-poisoning payloads (`__proto__`, `constructor.prototype`) are 400 `validation_error` and the body never echoes input.
- Per-route limits (login 5/min, guestbook 3/10 min) and `Cache-Control: no-store` for auth/admin are B3/B4 work. A route-level limit will run in addition to the global one.
- Possible contract nit, no action needed now: `POST /api/auth/logout` is "no body". Fastify answers 400 if a client sends `Content-Type: application/json` with an empty body; a POST with no body and no content-type is fine (tested). B4 will decide whether to accept an empty JSON body there; I will raise it with the Architect then if it matters for the web client.

## How to test
```
cd .worktrees/api && npm install
npm test -w @site/api
npm run typecheck -w @site/api
npm run dev -w @site/api        # then: curl -si http://127.0.0.1:3001/api/health
```

## Real command output (run 2026-09-21 in `.worktrees/api` after merging main; `npm warn EBADENGINE`/deprecation lines filtered out)
```
$ npm test -w @site/api

> @site/api@0.1.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/apps/api

 Test Files  2 passed (2)
      Tests  88 passed (88)
   Start at  18:00:31
   Duration  474ms (tests 53%, import 24%, transform 22%, worker 1%)
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

 Test Files  2 passed (2)
      Tests  88 passed (88)
   Start at  18:00:37
   Duration  468ms (tests 53%, import 24%, transform 22%, worker 1%)

> @site/web@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/apps/web

 Test Files  3 passed (3)
      Tests  7 passed (7)
   Start at  18:00:37
   Duration  1.29s (environment 67%, setup 18%, import 5%, tests 5%, transform 4%, worker 1%)

> @site/shared@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/packages/shared

 Test Files  5 passed (5)
      Tests  243 passed (243)
   Start at  18:00:39
   Duration  258ms (transform 49%, import 41%, tests 7%, worker 3%)

> @site/qa@0.0.0 test
> node --test "tools/*.test.mjs"

TAP version 13
# Subtest: clean tree passes (exit 0)
ok 1 - clean tree passes (exit 0)
  ---
  duration_ms: 66.3485
  ...
# Subtest: planted fake secrets are caught (exit 1) and never printed
ok 2 - planted fake secrets are caught (exit 1) and never printed
  ---
  duration_ms: 64.004292
  ...
# Subtest: generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
ok 3 - generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
  ---
  duration_ms: 122.436125
  ...
# Subtest: token-format secrets in test paths still fail
ok 4 - token-format secrets in test paths still fail
  ---
  duration_ms: 61.296083
  ...
# Subtest: inline allow marker and allowlist file (with reason) suppress findings
ok 5 - inline allow marker and allowlist file (with reason) suppress findings
  ---
  duration_ms: 122.9745
  ...
# Subtest: allowlist entry without a reason is rejected (exit 2)
ok 6 - allowlist entry without a reason is rejected (exit 2)
  ---
  duration_ms: 51.503583
  ...
# Subtest: --path scans a directory (for build output)
ok 7 - --path scans a directory (for build output)
  ---
  duration_ms: 52.14375
  ...
# Subtest: --history finds a secret that was committed then deleted
ok 8 - --history finds a secret that was committed then deleted
  ---
  duration_ms: 210.670708
  ...
# Subtest: usage errors exit 2
ok 9 - usage errors exit 2
  ---
  duration_ms: 50.283416
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 871.281375
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
✓ built in 479ms
exit: 0
```

## Real dev-server output (`npm run dev -w @site/api`, then curl on localhost only; server stopped afterwards)
```
$ npm run dev -w @site/api   (background; startup log line)
{"level":30,"msg":"Server listening at http://127.0.0.1:3001"}

$ curl -si http://127.0.0.1:3001/api/health
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
x-request-id: 22bc5d5c-e790-4db0-b645-52dcd67a717f
x-ratelimit-limit: 120
x-ratelimit-remaining: 118
x-ratelimit-reset: 60
content-type: application/json; charset=utf-8
content-length: 84
Date: Mon, 21 Sep 2026 22:00:53 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"status":"ok","version":"0.1.0","contract":"1.0","time":"2026-09-21T22:00:53.755Z"}

$ curl -si http://127.0.0.1:3001/api/nope
HTTP/1.1 404 Not Found
Content-Security-Policy: default-src 'none';frame-ancestors 'none'
x-request-id: 594f3cb9-0265-4947-b1d1-5de83bbc2366
{"error":{"code":"not_found","message":"Not found.","requestId":"594f3cb9-0265-4947-b1d1-5de83bbc2366"}}


$ curl -si -X POST -H "Origin: https://evil.example" -H "Content-Type: application/json" -d "{}" http://127.0.0.1:3001/api/nope
HTTP/1.1 403 Forbidden
x-request-id: a92a086f-2450-4779-9e51-d06e57903523
{"error":{"code":"origin_rejected","message":"Request origin is not allowed.","requestId":"a92a086f-2450-4779-9e51-d06e57903523"}}


$ curl -s -o /dev/null -w "%{http_code}
" (130 requests, count of each status)
 116 200
  14 429

$ curl -si http://127.0.0.1:3001/api/health   (after the burst)
HTTP/1.1 429 Too Many Requests
x-request-id: 5fe6bafe-799a-4d12-b76b-aa8397d65a62
retry-after: 60
{"error":{"code":"rate_limited","message":"Too many requests. Try again later.","requestId":"5fe6bafe-799a-4d12-b76b-aa8397d65a62"}}

$ lsof -nP -iTCP:3001 -sTCP:LISTEN
COMMAND NAME 
node 127.0.0.1:3001 (LISTEN)
```
(The 130-request burst shows 116 x 200 then 14 x 429: the 4 requests above it plus the startup probe count toward the same 120/minute window.)

Mutation checks run by hand and reverted: removing the global rate-limit hook made 4 tests fail; disabling the Origin check made 19 fail; before adding `removeContentTypeParser("text/plain")` the `text/plain` 415 test failed (Fastify accepted it with 200).

## Not covered
- No database, sessions, cookies, per-route limits or graceful shutdown yet (B3, B4, B6). No CI has run these (B5).
- `requestTimeout`/`keepAliveTimeout` are set but not tested. HSTS is set even over http (browsers ignore it there).
- `tsx watch` restarts were not exercised beyond first start.

# Gate: feat/api-core (B2)

- Verdict: PASS
- Branch: `feat/api-core` at commit `170d002b68e0bf6b87877847779b20defb76aed6` (this gate covers this commit only)
- Author: backend-engineer
- Gated by: security-qa-engineer, 2026-09-21
- Worktree used: `.worktrees/qa-check-api-core` (detached at the commit, read-only, removed afterward)
- PR file reviewed: `docs/prs/feat-api-core.md`
- Oracle: `docs/architecture/api-contract.md` v1.0 with clarifications. Node v22.12.0, npm 11.6.1. **All traffic went to a locally spawned instance on `127.0.0.1` (random free ports).**

## Verdict rule
FAIL on any open Critical or High finding, a failing test, a failing hygiene tool, or edits outside the author's owned paths. None occurred. One Low finding (QA-003) is open and non-blocking.

## Commands run and real output
| Command (from the check worktree) | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `found 0 vulnerabilities` |
| `npm test -w @site/api` | 0 | `Test Files 2 passed (2)`, `Tests 88 passed (88)` |
| `npm run typecheck -w @site/api` | 0 | `tsc --noEmit -p tsconfig.json`, no output |
| `npm run typecheck` (root, all workspaces) | 0 | api, web, shared all clean |
| `npm run lint` | 0 | `eslint .`, no output |
| `npm test` (root) | 0 | api 88 passed, web 7 passed, shared 243 passed, `@site/qa` scanner self-tests 9 passed |
| `npm run build` (root) | 0 | web builds (`index-BPUhLTGv.js 222.77 kB, gzip 69.43 kB`) |
| `node qa/tools/scan-secrets.mjs --root <check worktree>` | 0 | `100 files scanned, 0 skipped, 0 error(s), 1 warning(s) -> PASS`. The warning is `apps/api/src/config.test.ts:72`: a test that feeds the string `S3CRET-VALUE-123` through config validation to prove it is never echoed. A test fixture, not a secret. |
| `npm audit --audit-level=high` | 0 | `found 0 vulnerabilities` |
| `PORT=3411 npm start -w @site/api` then `curl -i http://127.0.0.1:3411/api/health` | 0 | `HTTP/1.1 200 OK`, body `{"status":"ok","version":"0.1.0","contract":"1.0","time":"..."}`; log line `Server listening at http://127.0.0.1:3411`; `lsof` shows `TCP 127.0.0.1:3411 (LISTEN)` only |

`npm run dev` (`tsx watch`) was not run separately; `npm start` runs the same entrypoint (`tsx src/server.ts`).

## Independent black-box attack run (QA-authored)
File: `qa/gates/b2-api-core.attack.test.mjs` (usage in its header). It spawns the branch's API on free `127.0.0.1` ports (fresh server per group so the 120/min limit does not leak), refuses any non-loopback host, and uses node `http` plus raw sockets.
```
$ QA_API_DIR=<worktree>/apps/api node --test qa/gates/b2-api-core.attack.test.mjs
# tests 50
# pass 50
# fail 0
```
Initial runs had 3 failures that were wrong assumptions in my tests, not API bugs (Fastify answers 404 rather than 415 for an unknown content type on an unrouted path; secure-json-parse strips a BOM; Node dropped the Content-Length on a GET-with-body). I corrected the tests and reran; the file above is the final version.

Covered and PASS (case IDs from `qa/test-plan.md`):
- **A-CON-2/3, A-HDR-1..4, A-CON-6:** health body is exactly `status, version, contract, time`; CSP is exactly `default-src 'none';frame-ancestors 'none'`; `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`; no `X-Powered-By`, no `Server`, no `Access-Control-*`, no `Set-Cookie`. 26 odd paths (traversal, encoded traversal, `%00`, `%`, `%zz`, invalid UTF-8 percent sequences, 3000-char path, 500-parameter query, `.env`, `//`, `;jsessionid`, case changes, admin/auth/guestbook paths that do not exist yet) all return a 4xx contract error whose `requestId` equals `X-Request-Id`, or health for the legitimate encodings; nothing 5xx, no stack or path text.
- **A-HDR-4:** a client `X-Request-Id` (short, 5000 chars) is ignored; ids are UUIDs and unique.
- **A-CSRF-1..6:** 18 hostile `Origin` values (foreign, `null`, trailing slash, `localhost:5173.evil.test`, `@` trick, port and scheme mismatch, uppercase, `*`, IPv6, `file://`, extension scheme) rejected with `403 origin_rejected` on POST, PUT, PATCH and DELETE; allowed origins, no Origin, and `Sec-Fetch-Site` of `same-origin`, `same-site`, `none` pass; `cross-site` in any letter case rejected even alongside an allowed Origin; GET is never blocked; the check runs before content-type, body parsing and routing; a duplicate `Origin` header pair is rejected; OPTIONS and preflight return no CORS headers.
- **A-ERR-3, A-INJ-7 (at the framework level):** 4096-byte body accepted, 4097 and 100 KB rejected with `413 payload_too_large`, chunked 6 KB without Content-Length rejected with 413, a declared `Content-Length` of 9999999 rejected with 413 immediately; malformed JSON (12 variants) gives `400 validation_error` with no echo and no parser or framework text; `__proto__` and `constructor.prototype` bodies give 400 with no echo; invalid UTF-8 gives 400; 2000-deep nesting does not 5xx.
- **A-RL-1/4/5, A-CFG-3:** 120 requests (a third of them 404s, a third bad-origin POSTs) all pass with spoofed `X-Forwarded-For`, `Forwarded` and `X-Real-IP` values; the 121st is `429 rate_limited` with contract body, `Retry-After: 60` (positive integer), `X-Request-Id` present; further spoofed requests stay limited. With `TRUST_PROXY=true`, distinct `X-Forwarded-For` values get separate buckets and one repeated value is limited, so the switch works and is off by default.
- **A-CFG-1/2:** 10 bad environments (`PORT` text and out of range, bad `NODE_ENV`, `WEB_ORIGIN` wildcard, trailing slash, path, `javascript:` scheme, one bad entry in a list, bad `TRUST_PROXY`, bad `LOG_LEVEL`) exit non-zero within 12 s, name the variable, never echo the value, and print no stack. Default bind with `HOST` unset is `127.0.0.1`.
- **A-HDR-6:** `lsof` shows only `127.0.0.1:<port> (LISTEN)`; no wildcard.
- **A-LOG-1/2:** with hostile `Cookie`, `Authorization`, a body containing a marker, CRLF and ANSI in the URL, no marker appears in server logs, every log line parses as JSON, and no forged log entry exists.
- **A-DOS-lite / A-ERR-4:** with 60 stalled half-open connections open, `/api/health` answered 200 in 5 ms; the server recovered after they closed; it stayed healthy after every group. Transport abuse (bad request line, bad HTTP version, LF-only, 20 KB header, 20 KB URL, many cookies, CL plus TE, duplicate CL, space and NUL in path, missing Host, absolute-form URL to another host, CONNECT) never produced a 5xx, never leaked a path or stack, and never crashed the process.

## Observations and findings
| ID | Severity | Status | Path |
|---|---|---|---|
| QA-003 | Low | open, non-blocking | `qa/reports/QA-003-transport-level-errors-not-in-contract-format.md` |

- **QA-003:** HTTP-parse-level errors (garbage request line, invalid Content-Length, oversized headers 431) use Fastify's default body `{"error":"Bad Request","message":"Client Error","statusCode":400}` with no `X-Request-Id`, not the contract shape. No leak. F3's client must tolerate it (already on the F3 done-criteria).
- HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains` is sent on plain HTTP. Browsers ignore it over HTTP, so it is harmless locally. Note for the deploy runbook (B6): once the API is served over HTTPS on the owner's real domain, `includeSubDomains` pins every subdomain to HTTPS for a year, so confirm that is intended or drop `includeSubDomains`.
- Retry-After on the limit response is `60` seconds even when the window started a moment ago (the plugin reports the full window as reset time); acceptable, always a positive integer.
- `POST/PUT/PATCH/DELETE/OPTIONS` on `/api/health` return `404 not_found` (contract has no 405); `HEAD` returns 200. Consistent with the contract's code table.
- An absolute-form request line (`GET http://other-host/api/health`) is served as a normal local request; the host is ignored, so there is no proxy or SSRF behavior.
- `x-ratelimit-limit/remaining/reset` headers are exposed on every response. Informational, no secret.

## Ownership check
`git log --no-merges --name-only` from the merge-base: `apps/api/**` (config, errors, app, server, health route, version, tests, `.env.example`, package.json, tsconfig, vitest config), `docs/prs/feat-api-core.md`, `package-lock.json`. All within backend-engineer's paths. `apps/api/.env.example` holds placeholders only (scanner PASS). New dependencies match the PR file and ADR (fastify 5, `@fastify/helmet`, `@fastify/rate-limit`, zod, tsx); `npm audit` 0.

## Not verified
- **Routes beyond health do not exist**, so nothing about the real 415/413/400 paths of `POST /api/guestbook`, guestbook and auth behavior, per-route limits, cookies, or `no-store` headers. On an unrouted path Fastify answers unknown content types with 404; the 415 case must be retested at a real POST route in Q3 (`QA_EXPECT_ROUTED_POST=1` flips the expectation in the attack file). Also not testable yet: forced 500 paths (A-ERR-1) and DB-down 503.
- No mutation check of the attack file against a deliberately weakened API (the worktree is read-only); assertion strength is shown by the three assumption failures caught during development and the QA-003 change detector, not by a mutation run.
- Timing and slow-request limits (`requestTimeout` 15 s) were not exercised beyond the 60 stalled connections; no sustained load (out of scope).
- No browser and no TLS; HSTS effect cannot be observed locally.

## Recommendation to Architect
Merge. Contract behavior, headers, Origin/CSRF layer, body limits, config failure and the global limit all hold under hostile input, including spoofed forwarding headers. Q2 can start after the merge. Decide QA-003 (fix the client-error handler or document the exception) and carry the HSTS note into the runbook.

# feat/qa-harness: black-box QA harness (Q2)

Author: security-qa-engineer. Branch: `feat/qa-harness`. Base: `main` (df5e6ca). Files: `qa/**` and this PR file only.

## What changed
- `qa/harness/guard.ts`: `assertLocalUrl` / `isLocalUrl`, the one place that decides "local" (127.0.0.1, localhost, ::1, http/https only). Every other harness function routes through it.
- `qa/harness/spawnApi.ts`: `spawnApi()` runs `tsx src/server.ts` for `apps/api` (this worktree's copy by default, or `apiDir`/`QA_API_DIR`-style override for gating another branch) on an OS-picked free `127.0.0.1` port, with `NODE_ENV=test`, a temp `DATABASE_PATH` in its own `mkdtemp` directory (forward-looking for B3; harmless today since B2 ignores unknown env vars), waits for the "Server listening" log line, and returns `{ baseUrl, port, logs, exitCode, stop() }`. `stop()` sends SIGTERM, waits up to 5s then SIGKILL, and always removes the temp directory; it is idempotent.
- `qa/harness/httpClient.ts`: `createHttpClient(baseUrl)` — guards the base URL on creation and every request, a small cookie jar (parses `Set-Cookie`, honors `Max-Age=0`/an expiry in the past as deletion, resends `Cookie` on the next request), JSON body/`Content-Type` convenience, `skipCookieJar` per request, `redirect: "manual"` (the API sends no redirects; a proxy that started redirecting should fail loudly, not be followed silently).
- `qa/harness/index.ts`: barrel export.
- `qa/harness/harness.test.ts`: the Q2 done-when tests plus jar mechanics (see below).
- `qa/vitest.config.ts`: runs only `harness/**/*.test.ts` by default, so `npm test -w @site/qa` never fails for lack of `QA_API_DIR`/`QA_WEB_DIR` (the `qa/gates/**` suites need a branch worktree and are run explicitly, as before).
- `qa/tsconfig.json`: extends the base config, covers `harness`, `gates`, `tools`.
- `qa/package.json`: `test` now runs the existing `node --test "tools/*.test.mjs"` (scanner self-tests) and then `vitest run`; added `typecheck`; added `vitest` as a devDependency (only new dependency).

## How to test
```
npm install
npm test -w @site/qa
npm run typecheck -w @site/qa
npm run lint
node qa/tools/scan-secrets.mjs
npm audit --audit-level=high
```

## Real output (2026-09-22, Node 22.12.0, npm 11.6.1)
```
$ npm test -w @site/qa
node --test "tools/*.test.mjs" && vitest run
... (node:test) # tests 9  # pass 9  # fail 0
 Test Files  1 passed (1)
      Tests  8 passed (8)
```
The 8 vitest tests: guard accepts 127.0.0.1/localhost/::1 over http(s) and rejects 12 hostile cases (foreign host, `127.0.0.1.evil.test`, a cloud metadata IP, `0.0.0.0`, a private IP, `ftp:`, `file:`, `javascript:`, garbage, empty, protocol-relative); `spawnApi` + `createHttpClient` health smoke test (`200`, contract body, a UUID `X-Request-Id`, `lsof` shows only `127.0.0.1:<port>` listening); `createHttpClient` itself refuses a non-loopback base URL before any request; `stop()` is idempotent, frees the port (a second spawn succeeds), and removes the temp directory; a bad environment (`WEB_ORIGIN=*`) makes the API exit non-zero and `spawnApi` rejects instead of hanging; the cookie jar (tested against a tiny local `node:http` server, since no login route exists yet) carries `Set-Cookie` values across requests, deletes on `Max-Age=0`, and `clearCookies()`/`skipCookieJar` work.

```
$ npm run typecheck -w @site/qa    exit 0
$ npm run lint                     exit 0
$ node qa/tools/scan-secrets.mjs   151 files scanned, 0 error(s), 3 warning(s) (fake-secret test fixtures) -> PASS
$ npm audit --audit-level=high     found 0 vulnerabilities
```

Non-vacuity check on the guard (the security-critical part): I temporarily added `"evil.test"` to `LOOPBACK_HOSTS` in a scratch edit; `npx vitest run -t guard` then failed the "rejects any other host" case (`AssertionError: http://evil.test/api/health`). Reverted; the suite is back to `8 passed (8)`.

## New dependencies
`vitest ^5.0.1` in `qa` (already used elsewhere in the repo at the same version; no new major).

## Not verified
- No database exists yet (B3), so `DATABASE_PATH` is set but unread by the current API; this will need re-verification once B3 lands.
- No guestbook or auth routes exist yet, so the cookie jar's real-world use (a login flow) is exercised against a throwaway local test server, not the real API.
- No browser; the harness is a Node-side black-box client only, as the kickoff specifies.

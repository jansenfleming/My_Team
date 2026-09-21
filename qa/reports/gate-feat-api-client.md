# Gate: feat/api-client (F3)

- Verdict: PASS
- Branch: `feat/api-client` at commit `c020aa900825a7efb75158e86798f674ec30d9dc` (this gate covers this commit only)
- Author: frontend-engineer
- Gated by: security-qa-engineer, 2026-09-21
- Worktree used: detached worktree at the commit (read-only, removed afterward)
- PR file reviewed: `docs/prs/feat-api-client.md`
- Node v22.12.0, npm 11.6.1. The client was exercised with a fake `fetch`; **no request left the process** and no API was contacted. No browser was available.

## Verdict rule
FAIL on any open Critical or High finding, a failing test, a failing hygiene tool, or edits outside the author's owned paths. None occurred. No findings filed.

## Commands run and real output
| Command (from the check worktree) | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `found 0 vulnerabilities` |
| `npm test -w @site/web` | 0 | `Test Files 6 passed (6)`, `Tests 68 passed (68)` |
| `npm run typecheck -w @site/web` | 0 | no output |
| `npm run lint` | 0 | no output |
| `npm run build -w @site/web` | 0 | `index-BPUhLTGv.js 222.77 kB, gzip 69.43 kB` (same as F1: the client is not imported by `App` yet, so it is not in the bundle and the "no zod in the bundle" property is not yet observable in `dist/`; `grep -c zod dist/assets/*.js` gives 0) |
| `node qa/tools/scan-secrets.mjs --root <check worktree>` | 0 | `107 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS` |
| `npm audit --audit-level=high` | 0 | `found 0 vulnerabilities` |

Source grep over `apps/web/src` (non-test): no `innerHTML`, `dangerouslySetInnerHTML`, storage, `console.*`, `document.cookie` or `eval`. The branch's own `bundle-safety.test.ts` enforces that the `@site/shared` barrel is imported with `import type` only and that zod is never imported; it passes.

## Independent hostile-response run (QA-authored)
File: `qa/gates/web/f3-api-client.hostile.test.mjs` with `qa/gates/web/vitest.gate.config.mjs` (usage in the headers). It imports the branch's real `createApiClient` and `ApiError`.
```
$ QA_WEB_DIR=<worktree>/apps/web <worktree>/node_modules/.bin/vitest run --config qa/gates/web/vitest.gate.config.mjs f3-api-client
 Test Files  1 passed (1)
      Tests  37 passed (37)
```
Non-vacuity: in a scratch worktree I removed the error-code allow-list check, the id validation in `deleteGuestbookEntry`, and the success-body validation; the same file then failed 10 tests (unknown code, all the unexpected-2xx cases, wrong field types, the password-leak test, the path-safety test). The scratch worktree was deleted.

Covered and PASS:
- **Non-JSON, empty and off-contract error bodies become `network_error`, keep the HTTP status, and never echo the body**, for all 8 client calls and 17 body shapes: the dev proxy's bare `500 text/plain` with an empty body, 500 plain text, 502 and 504 HTML, **Fastify's default `{"error":"Bad Request","message":"Client Error","statusCode":400}` and the 431 shape (the QA-003 bodies)**, an unknown error code, non-string code, empty or non-string message, `error` as an array, top-level array, `null`, a bare number, empty 429, truncated JSON, JSON with a BOM, and a 302 with a body. `ApiError.message`, its own properties and its first stack line never contain the marker text; `details` is undefined; `isNetworkFailure` is true.
- **2xx with an unexpected body is a `network_error`**, not a crash and not a fake success: HTML (SPA fallback), empty, `{}`, `[]`, `null`, a JSON string; wrong types and roles (`role: "admin"`, numeric username, string `id`, `id: 0`, `id: 1.5`, `nextBefore: 0`, missing `nextBefore`, `db: "down"`, negative uptime). Valid bodies pass, unknown extra fields are ignored, a JSON body with `__proto__` does not pollute `Object.prototype`, and 204 resolves for logout and delete.
- **Contract errors map faithfully:** code, status, requestId, `Retry-After` (only 1 to 7 digits accepted; `-1`, `abc`, `1e3`, an HTTP date, 8 digits, empty and `0x10` are ignored), details filtered to well-formed `{path, message}`, message capped at 200 characters, requestId at 128 (also when taken from `X-Request-Id`).
- **No leaks:** with a fake `fetch` that throws an error containing the URL, the request body and the password, the resulting `ApiError` (message, own properties, stack, cause) contains none of it; server responses echoing the password (401, 500 text, 200) also do not reach the error; no `console` method is ever called with it. The password appears only in the JSON body of `POST /api/auth/login`; the URL is `/api/auth/login`, headers are exactly `Accept` and `Content-Type`, `credentials` is `same-origin`, `cache` is `no-store`. GET requests send no body and no `Content-Type`.
- **Path and query safety:** `deleteGuestbookEntry` rejects `0`, `-1`, `1.5`, `NaN`, `Infinity`, `2**53`, `1e21`, strings such as `"1/../../admin/diagnostics"` and `"1?x=y"`, `null`, `undefined`, objects, arrays and `true` with a `validation_error` and never calls `fetch`; a valid id builds `/api/admin/guestbook/12`. List parameters are URL-encoded; a smuggled `"5&admin=1#x"` cannot add a parameter or a fragment.
- **Timeout and abort:** a `fetch` that never settles, a `fetch` that ignores the abort signal, and a stalled body read each end in `timeout`; an external abort gives `aborted` and a pre-aborted signal never calls `fetch`; abort after completion is harmless; a late rejection after the timeout produces no unhandled rejection; 5 MB and 50 000-deep bodies do not crash the client.

## Observations (no finding)
- **Info:** requests use the default `redirect: "follow"`. The API sends no redirects, so this is theoretical, but `redirect: "error"` would make a misconfigured proxy fail loudly instead of following it.
- **Info:** the response guards check shape and primitive types only (by design; the server is the authority). Text such as `message` is later rendered as text by the terminal, which F2 shows is inert.
- The QA-003 finding (parse-level errors with a non-contract body) is handled correctly on the client side, as the Architect requested.

## Ownership check
`git log --no-merges --name-only` from the merge-base: `apps/web/src/api/**`, `apps/web/package.json` (adds `@site/shared` as a workspace dependency), `docs/prs/feat-api-client.md`, `package-lock.json`. All within frontend-engineer's paths. OK.

## Not verified
- Behavior against the real API (only B2 exists, and it has no guestbook or auth routes yet); real cookies and `SameSite=Strict` in a browser; the actual Vite proxy's bare 500 was not re-observed here (it was in the F1 gate).
- `SessionProvider` was not attacked beyond the author's own tests (race between the initial `/me` and a login is covered there); the QA harness will exercise it end to end after B4 and F4.
- No browser, so `fetch` cancellation and `credentials` semantics were not observed for real.

## Recommendation to Architect
Merge. Non-JSON, empty and off-contract bodies all degrade to a network-style `ApiError` without echoing the body, secrets do not leak into errors or console, and timeout, abort and path safety behave.

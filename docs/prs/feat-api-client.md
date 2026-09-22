# feat/api-client: API client and session (task F3)

Author: frontend-engineer. Branch: `feat/api-client` (the board says `feat/web-api-client`; the lead named this one). Base: `main` at 80bf8ba, then `git merge main` (6dc6df5, which includes the vite 7 pin and the logout clarification). Worktree: `.worktrees/web`. Independent of F2: it touches only `apps/web/src/api/`, `apps/web/package.json` and one lockfile line.

## What changed
`apps/web/src/api/`:
- `client.ts` `createApiClient({ fetch?, timeoutMs?, basePath? })` and a shared `api` instance. One typed function per MVP endpoint: `getHealth`, `login`, `logout`, `getMe` (returns `User | null`), `listGuestbook({limit?, before?})`, `createGuestbookEntry`, `deleteGuestbookEntry(id)`, `getDiagnostics`. Every call takes an optional `{ signal }` so the terminal's Ctrl+C can cancel it.
  - Always `credentials: "same-origin"`, `cache: "no-store"`, `Accept: application/json`; `Content-Type: application/json` only when there is a body (logout sends none, which the contract's logout clarification allows).
  - 8 s timeout (`DEFAULT_TIMEOUT_MS`) covering the response body too. The request races the abort signal, so a fetch that ignores the signal still ends at the timeout.
  - Text is sent exactly as given. **No guestbook character rules are duplicated client-side** (the server is the authority). The one local check is path safety: `deleteGuestbookEntry` refuses anything that is not a positive safe integer before making a request, because the id goes into the URL path.
  - Never logs anything (no `console` use at all).
- `errors.ts` `ApiError extends Error` with `code`, `status`, `requestId`, `retryAfter` (seconds), `details` (validation), and `isNetworkFailure`. `code` is one of the contract's `ErrorCode` values or `network_error`, `timeout`, `aborted`. Callers should branch on `code`, not `message`. Messages are generic; server errors keep the server's safe text (capped at 200 chars). The error never holds a request or response body, the password, or the underlying fetch error's text.
- `guards.ts`: light shape checks for 2xx bodies and for the contract's error envelope (zod stays out of the browser). Unknown extra fields are ignored (additive contract).
- `session.tsx` `<SessionProvider client?>` and `useSession()` returning `{ status: "loading" | "ready", user: User | null, error: ApiError | null, refresh, login, logout }`. It checks `GET /api/auth/me` on mount. A failed check gives `ready`, `user: null`, and the `error` (so the UI can say "offline" rather than pretend to know). `login` throws the `ApiError` and keeps the password out of state. A failed `logout` throws and keeps the user (the server still has the session). Stale answers are ignored (an initial `/me` that lands after a login cannot overwrite it; a failed login does not strand the initial check).
- `index.ts` barrel. **Nothing wires the client into `App` yet**; F4 does that.

**Error mapping, per the QA gate note on F1 and the board:** a response that is not the contract's error (empty body, `text/plain`, an HTML page, JSON of another shape, an unknown `code`) becomes `network_error` with the HTTP status kept (for example the Vite proxy's bare `500 text/plain` when the API is down). A 2xx whose body is not the expected shape is also `network_error`. A rejected fetch is `network_error` with status 0.

Imports follow the rules: `import type { ... } from "@site/shared"` and `import { API_BASE_PATH, ERROR_CODES } from "@site/shared/constants"`. `bundle-safety.test.ts` enforces this for all of `apps/web/src`.

## Dependencies
No new third-party packages. `apps/web/package.json` now declares the workspace package `"@site/shared": "*"` (it already resolved through the workspace link; declaring it makes the dependency explicit). Lockfile: one line added.

## How to test
```
npm install
npm test -w @site/web
npm run typecheck -w @site/web
npm run lint
npm run build -w @site/web
```

## Output seen (2026-09-21, Node v22.12.0, npm 11.6.1), from this branch after `git merge main`
`npm test -w @site/web` (exit 0):
```
 Test Files  6 passed (6)
      Tests  68 passed (68)
```
47 tests in `client.test.ts` (mocked `fetch`, node environment): every endpoint's success path with the exact method, URL, headers, body, and credentials; 400 (with `details`), 401 `invalid_credentials`, 401 `unauthenticated`, 403 `origin_rejected`, 404, 413, 415, 429 with `Retry-After` (and malformed `Retry-After` values ignored), 500, 503, and the remaining contract codes via a table; `X-Request-Id` fallback; empty `500 text/plain`; HTML error page; JSON of the wrong shape or unknown code; 2xx with HTML, empty, or wrong-shape bodies; rejected fetch (underlying text not leaked); a body that fails mid-read; timeout at exactly 8000 ms (still pending at 7999), custom timeout, timeout while the body stalls, timeout when `fetch` ignores the signal, timer cleared after success; caller abort (and already-aborted signal makes no request); invalid delete ids make no request; text such as `<img src=x onerror=alert(1)>` and a bidi override is sent unchanged; no `console.*` calls and no password, body, or stack leaks. 12 tests in `session.test.tsx` (loading, anonymous, operator, failed check and recovery, login, failed login, logout, failed logout, stale-answer ordering, unmount, use outside the provider). 2 in `bundle-safety.test.ts`.

Negative checks that the tests are live (temporary edits, reverted, not committed): a value import from the `@site/shared` barrel failed the bundle-safety test; changing the default timeout to 80 s failed the timeout test; adding `console.error(spec.body)` failed the no-leak test.

`npm run typecheck -w @site/web`: exit 0. `npm run lint`: exit 0. `npm audit --audit-level=high`: `found 0 vulnerabilities`.
`npm run build -w @site/web`: exit 0, `dist/assets/index-BPUhLTGv.js 222.77 kB, gzip 69.43 kB`. Identical to F1 because nothing imports the client yet, so the bundler drops it; the size and zod checks below were therefore measured separately.

zod check: a scratch Vite library build of the whole `src/api/index.ts` (React external, minified, not written to disk) is 7,773 bytes, and the output contains no `zod`, `safeParse`, or `z.object`.

Dev server (`npm run dev -w @site/web`, after the vite 7 pin from main): `/`, `/src/main.tsx`, `/src/App.tsx`, `/src/api/client.ts`, `/src/api/session.tsx`, `/src/api/index.ts` all returned HTTP 200 and the log had no errors.

Real proxy-down check for the QA note: with nothing listening on 3001, `curl -i http://127.0.0.1:5173/api/health` returned `HTTP/1.1 500 Internal Server Error`, `Content-Type: text/plain`, empty body. I then ran the real client (through `tsx`, base path `http://127.0.0.1:5173/api`) against that dev server:
```
getHealth     -> ApiError {"code":"network_error","status":500,"message":"Could not reach the API or it sent an unexpected response."}
getMe         -> ApiError {"code":"network_error","status":500,"message":"Could not reach the API or it sent an unexpected response."}
listGuestbook -> ApiError {"code":"network_error","status":500,"message":"Could not reach the API or it sent an unexpected response."}
```
(`npx tsx` downloaded `tsx` into the npx cache for this one-off run; it is not a repo dependency and the scratch script was deleted.)

## Not verified
- **The client has never talked to the real API**: `apps/api` has no server on `main` yet (B2 not merged). Success paths are checked only against mocked `fetch` responses shaped like the contract. Cookies, real error bodies, and `Retry-After` from the real server are untested. Re-check when B3/B4 land (F4 does the real transcript).
- **No browser check.** `fetch` semantics in a real browser (cookie sending, abort behavior, CORS-free same-origin proxy) were tested only in Node and jsdom.
- Not built here by design: wiring into the terminal or `App`, and the commands (F4). `useSession` is not yet mounted anywhere.
- F4 notes: on an admin `401 unauthenticated` call `refresh()` from `useSession` so the UI drops back to anonymous; `login`'s password must come only from the masked prompt.

## Status
Ready for QA gate. Nothing pushed.

# API Contract v1.0

Owner: Architect (this file). Implemented by the Backend Engineer in `apps/api`; types and zod schemas live in `packages/shared` (`@site/shared`) and must match this file exactly. Consumed by the Frontend Engineer; tested independently by Security/QA. If code and this file disagree, this file wins until the Architect amends it. Nobody changes an endpoint silently.

## 1. Conventions
- Base path `/api`. JSON only. Requests with a body must send `Content-Type: application/json` (else `415`). Max body 4 KB (else `413`).
- No API version prefix. The contract is **additive-only** within v1: fields and endpoints may be added, never removed, renamed, or re-typed. Clients must ignore unknown response fields. A breaking change means a new `/api/v2` prefix and a new contract file.
- Timestamps: ISO-8601 UTC strings (`2026-09-21T17:00:00.000Z`). Ids: positive integers.
- Single object responses use a named key (`{ "entry": ... }`, `{ "user": ... }`). Lists are `{ "items": [...], "nextBefore": number | null }` (keyset pagination: pass `before=<id>` to get entries with a smaller id; `null` means no more).
- Paths are lowercase nouns, plural for collections. Operator-only routes live under `/api/admin`.
- Every response carries `X-Request-Id`. Auth and admin responses carry `Cache-Control: no-store`.
- Same-origin only: the API sends no CORS headers. In dev, Vite proxies `/api` to `http://127.0.0.1:3001`.
- All text fields are plain text. The server never returns HTML. **Clients must render them as text nodes** (no `innerHTML`).

## 2. Error format
Every non-2xx response, including unknown routes, has this body:

```ts
type ApiError = {
  error: {
    code: ErrorCode;
    message: string;          // safe, generic, human readable; never echoes raw input, SQL, paths, or stack traces
    requestId: string;        // same value as the X-Request-Id header
    details?: { path: string; message: string }[]; // only for validation_error
  };
};
```

| code | HTTP | When |
|---|---|---|
| `validation_error` | 400 | Body/query/params fail schema validation |
| `invalid_credentials` | 401 | Login failed. Identical response for unknown user and wrong password |
| `unauthenticated` | 401 | Operator route called without a valid session |
| `origin_rejected` | 403 | Mutating request from a disallowed `Origin` or `Sec-Fetch-Site: cross-site` |
| `forbidden` | 403 | Authenticated but not allowed (reserved; MVP has one role) |
| `not_found` | 404 | Unknown route or unknown resource id |
| `payload_too_large` | 413 | Body over 4 KB |
| `unsupported_media_type` | 415 | Body not `application/json` |
| `rate_limited` | 429 | Sends `Retry-After: <seconds>` |
| `unavailable` | 503 | Dependency (database) unavailable |
| `internal_error` | 500 | Anything unexpected. Generic message, details only in server logs |

## 3. Auth model
- One role: `operator` (the site owner). No registration. Credentials come from env (`OPERATOR_USERNAME`, `OPERATOR_PASSWORD_HASH`); see `apps/api/.env.example`.
- Session cookie `sid`: 32 random bytes, base64url; server stores only its SHA-256 in SQLite. Attributes: `HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` (8 h absolute), plus `Secure` when `NODE_ENV=production`. A new id is issued on every login (no fixation); logout deletes the server-side session and clears the cookie.
- Passwords: `node:crypto` scrypt with per-hash salt, compared in constant time. An unknown username still performs a dummy hash so timing does not reveal valid usernames.
- CSRF: every `POST`/`PUT`/`PATCH`/`DELETE` is rejected with `origin_rejected` if an `Origin` header is present and not in `WEB_ORIGIN` (comma-separated allow-list, default `http://localhost:5173,http://127.0.0.1:5173`), or if `Sec-Fetch-Site` is `cross-site`. Requests with no `Origin` (curl, tests) pass this check but still need a valid cookie for operator routes.
- In dev with no `OPERATOR_PASSWORD_HASH` set, the API generates a random operator password at startup and prints it once to the console. In production it refuses to start without it.

### Access matrix
| Endpoint | Anonymous | Operator |
|---|---|---|
| `GET /api/health` | yes | yes |
| `GET /api/auth/me` | yes (`user: null`) | yes |
| `POST /api/auth/login`, `POST /api/auth/logout` | yes | yes |
| `GET /api/guestbook`, `POST /api/guestbook` | yes | yes |
| `DELETE /api/admin/guestbook/:id` | 401 | yes |
| `GET /api/admin/diagnostics` | 401 | yes |

## 4. Rate limits (per client IP; `TRUST_PROXY` env off by default)
| Scope | Limit |
|---|---|
| Global, all routes | 120 requests / minute |
| `POST /api/auth/login` | 5 / minute |
| `POST /api/guestbook` | 3 / 10 minutes |

Exceeding returns `429 rate_limited` with `Retry-After`.

## 5. Shared types (implemented in `packages/shared`)
```ts
type Role = "operator";
type User = { username: string; role: Role };
type GuestbookEntry = { id: number; handle: string; message: string; createdAt: string };
```
Constants exported from `@site/shared` and used by both sides: `HANDLE_MIN=2`, `HANDLE_MAX=24`, `MESSAGE_MAX=280`, `GUESTBOOK_PAGE_DEFAULT=20`, `GUESTBOOK_PAGE_MAX=50`, `USERNAME_MAX=64`, `PASSWORD_MAX=256`.

## 6. Endpoints (MVP)

### GET /api/health
Public. `200`:
```json
{ "status": "ok", "version": "0.1.0", "contract": "1.0", "time": "2026-09-21T17:00:00.000Z" }
```
`503 unavailable` if the database check fails.

### POST /api/auth/login
Public, rate limited. Request: `{ "username": string (1..64), "password": string (1..256) }`.
`200` `{ "user": { "username": "operator", "role": "operator" } }` plus `Set-Cookie: sid=...`.
`400 validation_error`, `401 invalid_credentials`, `429 rate_limited`.

### POST /api/auth/logout
Public and idempotent. No body. `204`, clears the cookie, deletes the session if one existed.

### GET /api/auth/me
`200` `{ "user": User | null }`. `null` when anonymous or the session expired. Never `401`.

### GET /api/guestbook
Public. Query: `limit` (1..50, default 20), `before` (positive int, optional). Newest first (`id` descending).
`200`:
```json
{ "items": [ { "id": 7, "handle": "ghost_42", "message": "hello grid", "createdAt": "2026-09-21T17:00:00.000Z" } ], "nextBefore": 7 }
```
`nextBefore` is the smallest `id` on this page if more entries exist, else `null`. `400 validation_error` on bad query.

### POST /api/guestbook
Public, rate limited. Request: `{ "handle": string, "message": string }`.
- `handle`: 2..24 chars, `^[A-Za-z0-9_-]+$`.
- `message`: 1..280 chars after trimming, single line. Rejected if it contains any Unicode control character `\p{Cc}` (C0, DEL U+007F, C1; includes newline and tab), line/paragraph separators U+2028/U+2029, bidi override/isolate characters (U+202A-U+202E, U+2066-U+2069), bidi marks U+200E, U+200F, U+061C, or lone surrogates. The check runs on the raw input before trimming (so `"hi\n"` is rejected). Zero-width characters such as U+200B/U+200D are accepted (needed for emoji sequences). Lengths of `handle`, `message`, `username`, `password` count UTF-16 code units (JS `.length`). Stored verbatim otherwise (no HTML escaping server-side; clients render as text).

`201` `{ "entry": GuestbookEntry }`. `400 validation_error`, `403 origin_rejected`, `429 rate_limited`.

### DELETE /api/admin/guestbook/:id
Operator only. `:id` positive integer. `204` on success. `400 validation_error` (bad id), `401 unauthenticated`, `403 origin_rejected`, `404 not_found`.

### GET /api/admin/diagnostics
Operator only. `200`:
```json
{ "uptimeSeconds": 1234, "startedAt": "2026-09-21T16:40:00.000Z", "nodeVersion": "v22.12.0", "db": "ok", "guestbookCount": 12, "activeSessions": 1 }
```
`401 unauthenticated`.

## 7. Terminal command mapping (default; the Creative Director's `docs/design/terminal-commands.md` defines exact names and text)
| Command (default) | Call |
|---|---|
| `status` | `GET /api/health` |
| `guestbook` | `GET /api/guestbook` |
| `guestbook sign <handle> <message>` | `POST /api/guestbook` |
| `login <username>` (then masked password prompt) | `POST /api/auth/login` |
| `logout` | `POST /api/auth/logout` |
| `whoami` | `GET /api/auth/me` |
| `guestbook rm <id>` (operator) | `DELETE /api/admin/guestbook/:id` |
| `diagnostics` (operator) | `GET /api/admin/diagnostics` |

Rules: the terminal parses commands **on the client**. The server never executes or interprets command strings (decision: keeps the attack surface small). The password is read from a masked prompt, sent only in the login body, never stored in history, state persisted to storage, URLs, or logs.

## 8. Extending the contract (Creative Director and others)
Static copy (about text, agent roster, easter eggs, help text) lives in the web app, not the API. Add API surface only for data that changes or must be trusted (server-verified, stored, or authenticated).

Process:
1. Requester messages the Architect: the command or screen, why it needs the server, an example request and response.
2. Architect amends this file in the same commit that adds a changelog line, and adds a board task (owner: Backend for the endpoint, Frontend for the consumer). Additive only.
3. Backend updates `packages/shared` and implements in one branch; QA extends the test plan; Frontend consumes after merge.

Reserved names (planned, not built; do not use for anything else): `/api/missions`, `/api/missions/:id/submit`, `/api/agents/activity`, `/api/dossiers`, `/api/events` (SSE), `/api/admin/*` for operator tools.

## Changelog
- v1.0 (2026-09-21): initial MVP contract.
- v1.0 clarification (2026-09-21, pre-implementation, no consumers yet): guestbook `message` rejection list extended (U+2028/2029, U+200E/200F/061C, DEL, lone surrogates); length unit and validation order stated. Requested by backend-engineer during B1.

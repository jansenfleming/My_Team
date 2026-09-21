# QA Test Plan (MVP)

Owner: Security / QA Engineer. Version 1.0, 2026-09-21. Oracle: `docs/architecture/api-contract.md` v1.0 (if code and contract disagree, the contract wins and the disagreement is a finding). Risks: `qa/threat-model.md`.

## 1. Principles

1. **Authorized scope only.** This repo and its own local instance on `127.0.0.1`. The harness (Q2) must refuse any non-loopback URL. No load beyond small, bounded bursts needed to trip rate limits.
2. **Evidence or it did not happen.** A test counts only if it ran; reports paste real output. Anything not run is listed under "Not verified".
3. **QA writes no application code.** Everything QA adds lives under `qa/**`. Bugs are reported to the owning engineer; only QA marks a fix verified, with the original reproduction plus adjacent cases.
4. **Black-box first.** Prefer real HTTP against a spawned API on a free `127.0.0.1` port with a temp database. Import from `apps/*` and `packages/*` only when needed (for example the zod schemas as a conformance oracle).
5. **No real secrets.** Test credentials are generated at run time and fake. Findings that touch secrets record the location and redact the value.

## 2. Environments and tooling

| Item | Choice |
|---|---|
| Runtime | Node 22.12.0, npm 11.6.1 (per ADR 0001) |
| Runner | Vitest 5 (QA workspace `@site/qa`) for API and web-rendering checks |
| API target | Spawned per test run by the Q2 harness, `127.0.0.1:<free port>`, temp SQLite file, deterministic env (`NODE_ENV=test`, known operator hash generated in the harness) |
| Web target | jsdom via Testing Library for render tests; build-output inspection of `apps/web/dist/`. **No real browser** available; see section 7 |
| Hygiene tools | `qa/tools/scan-secrets.mjs` (no dependencies) and `npm audit` (Q4) |
| Reports | `qa/reports/` per `qa/reports/README.md` (finding and gate templates) |

## 3. Test levels and what each protects

| Level | Who owns tests | What QA does with them |
|---|---|---|
| Unit (schemas, parser, components) | Engineers | On a gate: run them, read them for gaps, add boundary cases QA thinks are missing as findings |
| API integration (`fastify.inject`) | Backend | Run on a gate |
| **Black-box API suite** | **QA (Q2, Q3)** | Contract conformance, access matrix, attack cases |
| Web render/DOM | Frontend (unit) and QA (hostile payloads, Q5) | jsdom hostile-payload tests |
| Build output | QA (Q5) | `dist/` has no inline script, no external hosts, no secrets, no source maps that leak paths (report if present) |
| Hygiene | QA (Q4) | Secret scan, dependency audit, on every gate |
| Manual checklist | QA (Q5) | Labeled MANUAL, results reported as such |

## 4. Test areas and cases

Case IDs are stable; suites (Q3, Q5) implement them and reports cite them. Priority: P1 must pass to gate, P2 should, P3 nice.

### 4.1 Contract conformance (A-CON)
| ID | Case | Pri |
|---|---|---|
| A-CON-1 | Each success response validates against the shared zod schema; unknown fields tolerated by schema but flagged if unexpected keys appear | P1 |
| A-CON-2 | Every non-2xx (including unknown route, wrong verb, malformed JSON) matches `ApiError`; `requestId` equals `X-Request-Id`; `details` only on `validation_error` | P1 |
| A-CON-3 | Status and code pairs match the section 2 table (400/401/403/404/413/415/429/503/500) | P1 |
| A-CON-4 | Keyset pagination: `before`, `nextBefore` null vs number, ordering by id descending, `limit` 1, 50, 0, 51, non-numeric | P1 |
| A-CON-5 | `GET /api/auth/me` never 401; `POST /api/auth/logout` idempotent 204 anonymous and authenticated | P1 |
| A-CON-6 | Health body shape; 503 `unavailable` when DB unavailable (if the harness can induce it locally) | P2 |

### 4.2 Access control matrix (A-ACL)
| ID | Case | Pri |
|---|---|---|
| A-ACL-1 | Each row of the contract access matrix: anonymous and operator, expected status | P1 |
| A-ACL-2 | Forged, truncated, empty, and oversized `sid` values on admin routes all give 401 | P1 |
| A-ACL-3 | Cookie from before logout is rejected after logout (server-side invalidation) | P1 |
| A-ACL-4 | Expired session (time control or short-lived test config) yields anonymous `me` and 401 on admin | P1 |
| A-ACL-5 | IDOR probes on `DELETE /api/admin/guestbook/:id`: 0, -1, 1.5, huge ints, non-numeric, existing, non-existing, already-deleted | P1 |
| A-ACL-6 | Method tampering (`PUT`/`PATCH`/`HEAD`/`OPTIONS`) on each route returns contract errors, not 500 or data | P2 |

### 4.3 Authentication and sessions (A-AUTH)
| ID | Case | Pri |
|---|---|---|
| A-AUTH-1 | Valid login: 200 body, `Set-Cookie: sid` with `HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`; `Secure` iff production mode | P1 |
| A-AUTH-2 | Unknown user vs wrong password: byte-identical status and body (ignoring `requestId`), similar timing (coarse statistical check over N attempts, reported as indicative only) | P1 |
| A-AUTH-3 | New session id on every login; old id not reusable as operator after re-login where applicable | P1 |
| A-AUTH-4 | Logout deletes the server session and clears cookie | P1 |
| A-AUTH-5 | Login input validation: missing, wrong types, empty, `username` 65 chars, `password` 257 chars, arrays, objects, null bytes | P1 |
| A-AUTH-6 | SQL/NoSQL style payloads in username/password give the standard 401 or 400, never 500 | P1 |
| A-AUTH-7 | Session id entropy sanity: 32 bytes base64url (43 chars), no repeats across N logins | P2 |
| A-AUTH-8 | Production mode start without `OPERATOR_PASSWORD_HASH` exits non-zero (spawn a child) | P1 |
| A-AUTH-9 | Password never appears in any response body, header, or log output | P1 |

### 4.4 CSRF and origin (A-CSRF)
| ID | Case | Pri |
|---|---|---|
| A-CSRF-1 | Mutating verbs with `Origin` not in allow-list: 403 `origin_rejected` (login, logout, guestbook POST, admin DELETE) | P1 |
| A-CSRF-2 | `Sec-Fetch-Site: cross-site` rejected; `same-origin`, `same-site`(per contract wording), `none` accepted or explicitly noted | P1 |
| A-CSRF-3 | Allowed `Origin` values pass; `Origin: null`, trailing-slash variants, subdomain lookalikes (`http://localhost:5173.evil.test`), scheme and port mismatches rejected | P1 |
| A-CSRF-4 | No `Origin` header (curl style) passes CSRF but operator routes still need a valid cookie | P1 |
| A-CSRF-5 | Safe verbs (GET) are not blocked by the Origin check | P2 |
| A-CSRF-6 | Responses carry no CORS headers (`Access-Control-*`) even for preflight `OPTIONS` | P1 |

### 4.5 Injection and hostile input (A-INJ)
| ID | Case | Pri |
|---|---|---|
| A-INJ-1 | Guestbook `message` HTML/script/SVG/attribute-breaking payloads stored verbatim and returned unchanged; response `Content-Type: application/json` | P1 |
| A-INJ-2 | Handle charset: `<`, quotes, spaces, unicode homoglyphs, emoji rejected with `validation_error` | P1 |
| A-INJ-3 | Control characters (NUL, TAB, LF, CR, ESC, C1 range), bidi overrides U+202A-202E and U+2066-2069 rejected; zero-width and other format characters noted (contract does not mention them) | P1 |
| A-INJ-4 | Length boundaries: handle 1/2/24/25, message 0/1/280/281, whitespace-only, surrogate pairs vs code-unit counting | P1 |
| A-INJ-5 | SQL injection strings in `message`, `handle`, `before`, `limit`, `:id`, login fields; table intact afterward; no 500 | P1 |
| A-INJ-6 | Type confusion: arrays, nested objects, numbers, booleans, null for each field; duplicate keys; `__proto__`/`constructor` keys (prototype pollution) | P1 |
| A-INJ-7 | Malformed JSON, BOM, invalid UTF-8, trailing garbage: 400 with contract body, not 500 | P1 |
| A-INJ-8 | Path traversal in URL (`/api/../`, encoded `%2e%2e`, double-encoded, backslashes) returns `not_found`, never file content | P2 |

### 4.6 Rate limits (A-RL)
| ID | Case | Pri |
|---|---|---|
| A-RL-1 | Global 120/min: 121st request in a minute gives 429 + `Retry-After` (bounded burst, local only) | P2 |
| A-RL-2 | Login: 6th attempt within a minute gives 429; correct password after the limit is still blocked | P1 |
| A-RL-3 | Guestbook POST: 4th within 10 minutes gives 429 | P1 |
| A-RL-4 | `X-Forwarded-For` / `Forwarded` / `X-Real-IP` spoofing does not reset or bypass limits while `TRUST_PROXY` is off | P1 |
| A-RL-5 | 429 body is contract-shaped, `Retry-After` is a positive integer, limit counters do not leak other clients' data | P2 |

### 4.7 Headers and transport hygiene (A-HDR)
| ID | Case | Pri |
|---|---|---|
| A-HDR-1 | Helmet set present (nosniff, frame protection, referrer policy, HSTS decision documented) on 200 and error responses | P1 |
| A-HDR-2 | No `X-Powered-By`, no `Server` version disclosure | P1 |
| A-HDR-3 | `Cache-Control: no-store` on all `/api/auth/*` and `/api/admin/*` responses including errors | P1 |
| A-HDR-4 | `X-Request-Id` on every response, unique per request, not client-controllable to inject header/log content (send CRLF and long values) | P1 |
| A-HDR-5 | Oversized headers, many cookies, very long URL: handled with a contract error or connection close, no crash | P2 |
| A-HDR-6 | Server binds to `127.0.0.1` only (not `0.0.0.0`) | P1 |

### 4.8 Error hygiene (A-ERR)
| ID | Case | Pri |
|---|---|---|
| A-ERR-1 | Force 500 paths (where reachable) and confirm generic message, no stack, path, SQL, or library names | P1 |
| A-ERR-2 | Validation messages never echo raw input | P1 |
| A-ERR-3 | 413 for body of 4097 bytes, including chunked bodies without `Content-Length`; 415 for missing or wrong `Content-Type` (`text/plain`, `application/x-www-form-urlencoded`, `application/json; charset=utf-16`) | P1 |
| A-ERR-4 | Server still healthy after every hostile request (health check after the fuzz run) | P1 |

### 4.9 Fuzzing (A-FUZ)
| ID | Case | Pri |
|---|---|---|
| A-FUZ-1 | Seeded, bounded (for example 500 cases per endpoint) generation of malformed bodies, queries, and headers; invariant: response is either a contract success or a contract error, never 5xx other than a deliberate `unavailable`, and the server survives | P2 |

### 4.10 Logging (A-LOG)
| ID | Case | Pri |
|---|---|---|
| A-LOG-1 | Capture server stdout/stderr during an auth flow: no password, no cookie value, no `Authorization` | P1 |
| A-LOG-2 | Hostile input (CRLF, ANSI escapes) does not forge log lines (structured JSON logging escapes them) | P2 |
| A-LOG-3 | Dev-generated operator password printed only in non-production mode | P2 |

### 4.11 Configuration (A-CFG)
| ID | Case | Pri |
|---|---|---|
| A-CFG-1 | Missing/invalid env values fail fast with a non-leaking message | P2 |
| A-CFG-2 | `WEB_ORIGIN` allow-list parsing: whitespace, empty entries, wildcard `*` handled safely | P2 |
| A-CFG-3 | `TRUST_PROXY` default off | P1 |
| A-CFG-4 | `.env.example` contains only placeholders (covered by the secret scanner) | P1 |

### 4.12 Web app (W), jsdom and build output
| ID | Case | Pri |
|---|---|---|
| W1 | Render guestbook items containing `<script>`, `<img onerror>`, `<svg onload>`, `javascript:` URLs, HTML entities: DOM contains them as text only; no element created from payload; no `innerHTML` sink | P1 |
| W2 | Type the same payloads into the terminal; echoed output is inert text | P1 |
| W3 | Source scan of `apps/web/src` for `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `new Function`, `document.write`, `insertAdjacentHTML`, `href={userValue}` (reported as findings with file:line; QA does not edit) | P1 |
| W4 | Terminal parser: empty, whitespace, unbalanced quotes, 10 kB input, unicode, ANSI, NUL, bidi | P1 |
| W5 | Password prompt: masked, absent from history, DOM text, `localStorage`, `sessionStorage`, URL, and console output | P1 |
| W6 | Server error and rate-limit messages show the friendly text, not raw response bodies | P2 |
| W7 | Scrollback and history caps hold under 10k lines | P2 |
| W8 | Rapid repeated commands and double-submit do not duplicate requests or break state | P3 |
| W9 | Content grep: no employer, degree, address, phone, email, or credential claims outside `[PLACEHOLDER: ...]` | P1 |
| W-DIST-1 | `dist/index.html` has no inline `<script>`, no `eval`-requiring code, no absolute URLs to third-party hosts | P1 |
| W-DIST-2 | `dist/` contains no `.env`, `.map` with absolute local paths, or secret-shaped strings (run the scanner over `dist/`) | P1 |
| W-DIST-3 | Gzipped JS under the 250 kB budget (F5) | P3 |
| W-A11Y-M | **MANUAL** checklist: keyboard-only use, visible focus, `aria-live` output region, contrast, `prefers-reduced-motion`, 320 px width, mobile keyboard | P2 |

### 4.13 Hygiene (H)
| ID | Case | Pri |
|---|---|---|
| H-SEC-1 | Secret scanner passes on the working tree | P1 |
| H-SEC-2 | Secret scanner catches a planted fake secret (proves the tool is live) | P1 |
| H-SEC-3 | Git history scan for the same patterns (`--history` mode) | P1 |
| H-SEC-4 | No tracked `*.db`, `.env`, private keys | P1 |
| H-DEP-1 | `npm audit --audit-level=high` exits 0 (or every finding is triaged in a report) | P1 |
| H-DEP-2 | New dependencies in a branch are listed in its PR file and checked (maintenance, install scripts, size) | P2 |
| H-DEP-3 | Lockfile is committed and consistent (`npm ci --dry-run` or `npm ls` clean) | P2 |
| G-CI | B5 review: workflow `run:` steps do not interpolate untrusted event fields; `permissions:` minimal; no `pull_request_target`; no secrets on fork PRs | P1 |

## 5. Gate procedure (standing task G)

Trigger: an engineer messages that a code branch is ready. Steps:
1. `git worktree add .worktrees/qa-check-<slug> <branch>` (read-only; never edit inside it). Run `npm install` there.
2. Run the branch's own tests (`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` where defined). Paste real output.
3. Run hygiene: `node qa/tools/scan-secrets.mjs` and `npm audit --audit-level=high`.
4. Run the applicable QA cases from section 4 (whatever suites exist at that point) and targeted manual probes against the branch's local instance.
5. Check the diff against `ownership-map.md` (files outside the author's ownership are a finding).
6. Write `qa/reports/gate-<slug>.md` with `Verdict: PASS` or `FAIL`, commands, real output, finding links, and a "Not verified" list.
7. Message the Architect with the verdict, and the engineer with finding paths.
8. Remove the check worktree.

Verdict rules: any open Critical or High finding, a failing test, or a failing hygiene tool means FAIL. Medium and Low findings do not block but must be listed. A gate is scoped to the commit it tested; record the commit hash. Later commits need a re-gate.

Retest: on "ready to retest", re-run the original reproduction and adjacent cases, then set the finding status to `verified`, `not fixed`, or `regression` with evidence.

Early gates (B1 shared schemas, F1 web shell) are short: tests, hygiene, dependency list, ownership check, and the relevant boundary cases.

## 6. Entry and exit criteria

| Stage | Entry | Exit |
|---|---|---|
| Q2 harness | B2 merged | Harness spawns API on loopback with temp DB, refuses non-loopback URLs, self-test passes |
| Q3 API suite | Q2, B3, B4 merged | Sections 4.1 to 4.11 P1 cases implemented and run; failures filed as findings |
| Q5 web review | F4, F5 merged | Section 4.12 run; manual checklist executed and labeled |
| Q6 MVP review | B6, F6, Q3, Q5 merged | `qa/reports/security-review-mvp.md` with no open Critical/High, or an explicit list of what remains |
| MVP release recommendation | All above | Architect decides; QA states residual risk plainly |

Severity scale for findings: Critical (auth bypass, RCE, stored XSS against the operator, secret exposure), High (significant data exposure, CSRF on admin, working brute-force bypass), Medium (missing defense-in-depth, info disclosure of low value), Low (hardening, cosmetic security), Info.

## 7. Known coverage gaps (stated up front)

- **No real browser.** CSP enforcement, real cookie handling across origins, actual script execution, and clickjacking cannot be observed. jsdom does not run `onerror` handlers from `innerHTML` the way a browser does, so hostile-payload tests assert on DOM structure (no element created from payload text), not on alert dialogs. Playwright is a Phase 2 item needing owner approval for a browser download.
- Timing checks (A-AUTH-2) on a shared dev machine are indicative, not proof.
- No TLS, reverse proxy, or production topology exists to test. `Secure` cookie behavior is verified by config/header inspection only.
- Load and DoS testing is deliberately minimal (bounded bursts on localhost).
- Third-party dependency internals are not source-reviewed; only `npm audit` advisories and install-script checks are used.

## 8. Reporting

Findings: one file per finding in `qa/reports/` named `<ID>-<slug>.md` (for example `QA-001-guestbook-xss.md`), template in `qa/reports/README.md`. Gates: `qa/reports/gate-<branch-slug>.md`. Final: `qa/reports/security-review-mvp.md`. Message the owning engineer with the finding path; Critical also goes to `architect` immediately.

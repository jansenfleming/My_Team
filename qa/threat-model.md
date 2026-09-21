# Threat Model (MVP)

Owner: Security / QA Engineer. Version 1.0, 2026-09-21. Scope: this repository and its own local instance on `127.0.0.1` only. Oracle documents: `docs/architecture/api-contract.md` (v1.0), `docs/architecture/adr/0001-stack.md`, `docs/architecture/ownership-map.md`.

Status of this document: written before any application code exists (B1, B2, F1 are unmerged). Every "mitigation" below is what the contract and ADR **promise**, not something verified. Verification status is tracked in `qa/test-plan.md` and the gate and review reports. Nothing here is a claim that the code is secure.

## 1. System overview

```
 Visitor / Operator browser
        |  same origin (Vite proxy in dev; single host later)
        v
 apps/web (static React SPA, terminal UI)  --parses commands client-side-->  fetch /api/*
        |
        v
 apps/api (Fastify 5, zod, helmet, rate-limit, cookie)  --parameterized SQL-->  SQLite file (better-sqlite3)
        ^
        |  env: OPERATOR_USERNAME, OPERATOR_PASSWORD_HASH, WEB_ORIGIN, TRUST_PROXY, DB path
 CI (GitHub Actions files, not yet runnable) / npm registry (supply chain)
```

Actors:
- **Anonymous visitor**: reads pages, signs the guestbook, types terminal commands. Untrusted.
- **Operator** (site owner): one account, moderates the guestbook, reads diagnostics. Highest-value target.
- **Attacker**: a visitor with malicious intent, or a third-party website luring the operator's browser.
- **Maintainers / agents**: trusted but fallible (accidental secret commits, risky dependencies).

## 2. Assets

| ID | Asset | Why it matters |
|---|---|---|
| A1 | Operator session (`sid` cookie, server-side session row) | Grants deletion and diagnostics; takeover = full admin |
| A2 | Operator password / `OPERATOR_PASSWORD_HASH` | Long-lived credential; leak enables offline cracking |
| A3 | Visitors of the site (their browsers) | XSS or clickjacking turns the site into an attack platform; reputational damage to a resume piece |
| A4 | Guestbook data integrity and availability | Public write surface; spam or defacement is visible to all |
| A5 | API availability | A single-process Node + SQLite service is easy to exhaust |
| A6 | Repo, git history, CI config | Secrets, workflow injection, supply-chain foothold |
| A7 | Owner's reputation and privacy | The site is a resume artifact; no invented facts, no leaked personal data |

## 3. Trust boundaries and entry points

| # | Boundary / entry point | Untrusted input |
|---|---|---|
| E1 | `POST /api/guestbook` body (`handle`, `message`) | Everything |
| E2 | `GET /api/guestbook` query (`limit`, `before`) | Everything |
| E3 | `POST /api/auth/login` body, `sid` cookie, `Origin`, `Sec-Fetch-Site` | Everything |
| E4 | `DELETE /api/admin/guestbook/:id` path param | Everything |
| E5 | All routes: headers (`X-Forwarded-For`, `Content-Type`, `Content-Length`, `Host`), unknown paths, verb tampering | Everything |
| E6 | Terminal input in the browser (parsed client-side) | Typed or pasted text, incl. control characters, huge input |
| E7 | Guestbook content rendered back into the terminal | Stored, attacker-authored text viewed by other visitors and the operator |
| E8 | Environment variables at API start | Operator-controlled, but misconfiguration is a risk (missing hash, wide `WEB_ORIGIN`, `TRUST_PROXY` on) |
| E9 | `npm install` / lockfile / dependabot PRs | Third-party code |
| E10 | Repo content: commits, `.env*` files, workflows | Accidental secrets, unsafe `run:` interpolation |

## 4. Threats (STRIDE per entry point) with ratings

Likelihood (L) and Impact (I): 1 low, 2 medium, 3 high. Risk = L x I. "Promised control" is from the contract or ADR. "Planned test" points at `qa/test-plan.md` section 4 IDs.

| ID | Threat | STRIDE | Entry | L | I | Risk | Promised control | Planned test |
|---|---|---|---|---|---|---|---|---|
| T1 | **Stored XSS / terminal injection**: attacker posts `<img src=x onerror=...>` or `<script>` in a guestbook message or handle; a visitor or the operator opens `guestbook` and it executes, stealing nothing directly (HttpOnly cookie) but riding the operator's session (issuing `DELETE`, reading diagnostics) | Tampering, Elevation | E1, E7 | 3 | 3 | 9 | Server stores verbatim; **clients render text nodes only** (contract s1); web CSP-clean; handle restricted to `^[A-Za-z0-9_-]+$` | W1, W2, W3, A-INJ-1..4 |
| T2 | **Operator auth attack**: password guessing / credential stuffing on `/api/auth/login`; timing-based username enumeration; session fixation; stolen or replayed cookie | Spoofing, Info disclosure | E3 | 2 | 3 | 6 | scrypt + constant-time compare + dummy hash for unknown user; identical `invalid_credentials`; 5/min limit per IP; new sid per login; 8 h absolute expiry; HttpOnly, SameSite=Strict | A-AUTH-1..8, A-RL-2 |
| T3 | **CSRF on operator actions**: a hostile page makes the operator's browser send `DELETE /api/admin/...` or `POST /api/guestbook` | Tampering, Elevation | E3, E4 | 2 | 3 | 6 | SameSite=Strict cookie; Origin allow-list + `Sec-Fetch-Site: cross-site` rejection on mutating verbs; no CORS headers | A-CSRF-1..6 |
| T4 | **Rate-limit bypass / API abuse**: spoofed `X-Forwarded-For` to reset per-IP limits, or IP rotation, to brute-force login (5/min) or flood guestbook (3/10 min) | DoS, Spoofing | E3, E1, E5 | 3 | 2 | 6 | Limits per client IP; `TRUST_PROXY` off by default so XFF is ignored | A-RL-1..5 |
| T5 | **Secret leakage**: real password, hash, or session value committed to repo/history; printed in logs; the dev random password logged in a shared/CI context | Info disclosure | E8, E10 | 2 | 3 | 6 | `.env` gitignored, `.env.example` placeholders; production refuses to start without hash; B6 log redaction | H-SEC-1..3, A-LOG-1..3 |
| T6 | **Injection into SQL** via guestbook fields, `before`/`limit`, `:id` | Tampering, Info disclosure | E1, E2, E4 | 1 | 3 | 3 | Parameterized statements; zod validation with integer coercion rules | A-INJ-5..8 |
| T7 | **Information disclosure via errors and headers**: stack traces, SQL text, file paths, `X-Powered-By`, verbose 500s, differing 404/401 that leak existence, missing `no-store` on auth responses | Info disclosure | E5 | 2 | 2 | 4 | Contract error format never echoes input; helmet; `no-store` on auth/admin | A-ERR-1..6, A-HDR-1..6 |
| T8 | **Broken access control / IDOR**: anonymous or forged-cookie access to `/api/admin/*`; deletion of arbitrary ids; expired or post-logout cookie still works | Elevation | E3, E4 | 1 | 3 | 3 | `requireOperator` hook; access matrix; server-side session deletion on logout | A-ACL-1..6 |
| T9 | **Resource exhaustion**: oversized body, deeply nested JSON, huge headers, slowloris, thousands of guestbook rows making list slow, SQLite write lock contention | DoS | E1, E5 | 2 | 2 | 4 | 4 KB body cap (413); global 120/min; `limit` max 50; keyset pagination | A-DOS-1..4 (local, small scale only) |
| T10 | **Terminal-specific input attacks**: ANSI/control characters and bidi overrides to spoof or hide output ("Trojan Source" style), giant pastes freezing the UI, password captured in history/URL/logs | Spoofing, Info disclosure | E6, E7 | 2 | 2 | 4 | Server rejects C0/C1 + bidi in messages; client parser input cap; masked prompt never stored | W4..W8 |
| T11 | **Supply chain**: malicious or vulnerable npm dependency, typosquat, compromised install script, new transitive dependency via dependabot PR | Tampering | E9 | 2 | 3 | 6 | Lockfile committed; `npm audit --audit-level=high` in CI; dependabot; caret ranges within pinned majors | H-DEP-1..3 |
| T12 | **CI workflow injection**: `${{ github.event... }}` interpolated into `run:` steps, `pull_request_target` misuse, over-broad `permissions`, secrets exposed to fork PRs | Elevation | E10 | 1 | 3 | 3 | Not yet built (B5). Reviewed when B5 arrives | G-CI checklist |
| T13 | **Clickjacking / missing headers** on the web app | Tampering | E5 | 2 | 1 | 2 | helmet on API (frame-ancestors, nosniff); production CSP is Phase 3 | A-HDR-*, W-HDR-1 |
| T14 | **Invented personal facts / privacy**: site claims employers or credentials the owner never supplied | Reputation | E10 | 2 | 2 | 4 | Brief rule: `[PLACEHOLDER: ...]` only | W9 (content grep) |
| T15 | **Insecure defaults in dev leak into production**: dev-only random password path, `Secure` cookie flag off outside production, wide `WEB_ORIGIN` | Misconfiguration | E8 | 2 | 2 | 4 | `NODE_ENV=production` gates: `Secure`, refuse start without hash | A-CFG-1..4 |
| T16 | **SQLite file exposure**: DB under a web-served path or committed to git | Info disclosure | E10 | 1 | 2 | 2 | `*.db`, `apps/api/data/` gitignored; web does not serve `data/` | H-SEC-4 |

### Top three (highest risk score, in order)
1. **T1 Stored XSS / terminal injection (9)**: the only place attacker-authored content is shown to the operator, whose browser holds the admin session. The whole defense is a client convention (text nodes only), so it must be tested with hostile payloads in a DOM, not assumed.
2. **T2 Operator authentication attack (6, tie)**: single high-value account behind a public login endpoint; correctness of scrypt, constant-time behavior, session lifecycle and rate limiting all need black-box confirmation.
3. **T4 Rate-limit bypass (6, tie; broken by likelihood 3)**: per-IP limits are the only brute-force and spam control. A `TRUST_PROXY` misconfiguration or header spoofing would silently disable the 5/min login limit. T3 (CSRF), T5 (secrets) and T11 (supply chain) are tied at 6 and are next.

Ranking is judgment, not measurement; it will be revisited in `qa/reports/security-review-mvp.md` (Q6) with real findings.

## 5. Out of scope and assumptions

- Only the local instance is tested. No traffic to any other host. Production hosting, TLS termination, reverse proxy, and WAF do not exist yet and are not assessed.
- Physical, social engineering, and browser-vulnerability threats are out of scope.
- Real browsers are not available in the default toolchain (Playwright is Phase 2). Browser-executed XSS, CSP enforcement, cookie behavior across real origins, and clickjacking can only be approximated with jsdom tests, header inspection, and a labeled manual checklist. That is a known coverage gap, not a pass.
- Assumed: one operator, one API process, SQLite on local disk, no email, no file upload, no third-party requests from the web app.
- Not modeled yet because reserved in the contract but unbuilt: missions/flags, SSE events, dossiers.

## 6. Residual risk register (open until verified)

| ID | Item | Owner of fix | Status |
|---|---|---|---|
| R1 | Client "text nodes only" rule unenforced by tooling (no lint rule banning `innerHTML`/`dangerouslySetInnerHTML`) | Architect (root ESLint config); QA to propose | Open. Suggest adding `no-restricted-syntax` / `react/no-danger`. |
| R2 | No production CSP until Phase 3 | Backend (Phase 3) | Accepted for MVP; note in review |
| R3 | In-memory or per-process rate limiting resets on restart | Backend | Accepted for MVP |
| R4 | Dev random operator password printed to console | Backend | Accepted for dev; QA verifies it never appears in production mode |
| R5 | Real-browser behavior unverified | QA / Phase 2 | Open until Playwright is approved |

## 7. Change control

New endpoints from contract amendments add rows to section 4 and cases to the test plan in the same QA branch cycle. The Architect notifies QA of every contract change (per `api-contract.md` section 8).

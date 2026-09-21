# Phase 1 Task Board (MVP)

Owner: Architect. This file is the source of truth for task state (the native task list is unavailable). Teammates report status by message; the Architect updates this file after each merge. Read the main checkout's copy, not your worktree's.

Status values: `todo`, `in-progress`, `review` (PR file written, waiting on QA gate or Architect), `approved` (QA gate PASS and Architect approved; waiting for the lead to merge the real PR), `done` (lead confirmed the merge to `main`).
Every code task is done only when: owner tests pass with real output in the PR file, QA gate PASS in `qa/reports/gate-<slug>.md`, Architect approved and the lead merged the real PR (`gh pr merge --merge`) from wave 2 on; wave 1 was merged locally `--no-ff`. Docs-only design tasks need Architect review only. QA tasks need Architect review and a green suite run. Process details: `ownership-map.md`.

Names: `architect`, `creative-director`, `frontend-engineer`, `backend-engineer`, `security-qa-engineer`. Worktree dirs: `.worktrees/{design,web,api,qa}`.

Site name: **PARZIVAL** (all working names in earlier docs, PICKET-07 and GRAYDOT, are superseded).

## Index
| ID | Owner | Title | Depends on | Status |
|---|---|---|---|---|
| A1 | architect | Phase 0 plan and scaffold | none | done |
| A2 | architect | Contract change control and CD request triage | ongoing | in-progress |
| A3 | architect | Review and merge backend branches (B1-B6) | B* | todo |
| A4 | architect | Review and merge frontend and design branches | F*, D* | todo |
| A5 | architect | Review and merge QA branches, run integration check | Q*, B4, F4 | todo |
| A6 | architect | Release-readiness report and Phase 2 board | all | todo |
| B1 | backend-engineer | Shared contract package | none | done (merged 6915843); QA-001 fix pending |
| B2 | backend-engineer | API core | B1 | todo |
| B3 | backend-engineer | SQLite and guestbook | B2 | todo |
| B4 | backend-engineer | Auth and admin endpoints | B3 | todo |
| B5 | backend-engineer | CI/CD workflows | B2, Q4 | todo |
| B6 | backend-engineer | Runbook, README, hardening | B4, B5 | todo |
| F1 | frontend-engineer | Web shell | none | done |
| F2 | frontend-engineer | Terminal engine | F1 | todo |
| F3 | frontend-engineer | API client and session | F1, B1 | todo |
| F4 | frontend-engineer | Commands | F2, F3, D4 | todo |
| F5 | frontend-engineer | Boot, layout, effects | F1, D2, D3 | todo |
| F6 | frontend-engineer | Easter eggs, a11y, polish | F4, F5, D5 | todo |
| D1 | creative-director | Concept and voice | none | done; rename amendment `feat/design-rename` in progress |
| D2 | creative-director | Tokens and style guide | D1, D1-rename | todo (hold released) |
| D3 | creative-director | Boot, layout, motion spec | D1, D2 | todo (waits on D2) |
| D4 | creative-director | Terminal command spec | D1, D1-rename | todo (hold released; after D2) |
| D5 | creative-director | Easter eggs and backlog | D4 | todo (waits on D4) |
| D6 | creative-director | Design review of the build | F4, F5 | todo (waits on F4, F5) |
| Q1 | security-qa-engineer | Test plan and threat model | none | done |
| Q2 | security-qa-engineer | QA harness | B2 | todo |
| Q3 | security-qa-engineer | API test and attack suite | Q2, B3, B4 | todo |
| Q4 | security-qa-engineer | Secret scan and dependency audit tooling | none | done |
| Q5 | security-qa-engineer | Web security and a11y review | F4, F5 | todo |
| Q6 | security-qa-engineer | MVP security review | B6, F6, Q3, Q5 | todo |
| G | security-qa-engineer | Standing: gate + retest for every code branch | each branch | ongoing |

## Suggested waves (parallel starts)
1. Start now: B1, D1, F1, Q1, Q4.
2. After wave 1 merges: B2, F2, F3, D2, D4, Q2.
3. B3, D3, F5, D5. 4. B4, F4, Q3, B5. 5. Q5, D6, F6, B6. 6. Q6, A5, A6.
Blocked work should do its non-blocked part first (read specs, draft tests) and message the Architect if idle.

---

## Architect

### A1 Phase 0 plan and scaffold
- Owner: architect. Branches: `docs/architecture`, `chore/scaffold`. Status: done (both merged `--no-ff`).
- Deliverable: ADR 0001, roadmap, api-contract, ownership-map, this board, kickoff briefs, root workspace scaffold, `docs/prs/chore-scaffold.md`.
- Done when: `npm install` succeeds at the root; both branches merged `--no-ff`.

### A2 Contract change control and CD request triage
- Owner: architect. Ongoing. Branch: `docs/contract-<n>` per amendment.
- Deliverable: amendments to `api-contract.md` (additive, with changelog line) plus a board task for each accepted request; a written "no, later" (roadmap) for the rest.
- Done when: every request from the Creative Director or engineers gets an answer within one exchange and lands in a file.

### A3 Review and merge backend branches
- Owner: architect. Depends: B1-B6 each reaching `review`. Branch: none (merges only).
- Deliverable: `docs/architecture/reviews/<slug>.md` per branch (contract match, ownership check, tests seen) and `--no-ff` merges in order B1, B2, B3, B4, B5, B6.
- Done when: all merged with QA gate PASS present; board updated.

### A4 Review and merge frontend and design branches
- Owner: architect. Depends: F1-F6, D1-D6 each reaching `review`.
- Deliverable: reviews and merges. Check web against the contract and CSP-clean rules; check design docs against the MVP scope (roadmap) and placeholder rule (no invented facts about the owner).
- Done when: all merged; board updated.

### A5 Review and merge QA branches; integration check
- Owner: architect. Depends: Q1-Q6, plus B4 and F4 merged.
- Deliverable: merges of QA branches; `docs/architecture/reviews/integration-check.md`: from a fresh worktree of `main` run `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, start `npm run dev`, curl `/api/health` and one guestbook round trip; paste the real output.
- Done when: the integration check is green or failures are turned into tasks.

### A6 Release-readiness report and Phase 2 board
- Owner: architect. Depends: all Phase 1 tasks done.
- Deliverable: `docs/architecture/release-readiness.md` (MVP exit criteria checked one by one, open risks, what the owner must do to publish: create remote, push, enable Actions, hosting choice, real password hash, real content); `docs/architecture/board-phase2.md`.
- Done when: the report cites evidence for each exit criterion; recommendations only, no deploy.

---

## Backend Engineer (worktree `.worktrees/api`)

### B1 Shared contract package
- Owner: backend-engineer. Depends: none. Branch: `feat/shared-contract`. Status: done (merged). Follow-up: `fix/qa-001-message-invisible-chars` implements the contract's 2026-09-21 QA-001 clarification (extra rejected characters and the visible-character rule) with boundary tests; QA retests and gates.
- Deliverable: `packages/shared` (`@site/shared`): `src/index.ts` exporting types (`User`, `GuestbookEntry`, `ApiError`, `ErrorCode`), zod schemas for every request/query/response in `api-contract.md` sections 5-6 (including the handle and message rules: trim, length, charset, control and bidi rejection), and the constants. `exports` points at TS source; vitest tests.
- Done when: `npm test -w @site/shared` and `npm run typecheck -w @site/shared` pass; boundary tests for handle 1/2/24/25 chars, message 0/1/280/281 chars, newline, tab, NUL, U+202E all pass; the Frontend can `import type` from `@site/shared`; PR file lists dependencies.

### B2 API core
- Owner: backend-engineer. Depends: B1. Branch: `feat/api-core`. Status: todo.
- Deliverable: `apps/api`: `buildApp(config)` factory, `src/server.ts` (binds `127.0.0.1:3001`), env config validated with zod, `apps/api/.env.example` (placeholders only), request id, `@fastify/helmet`, global rate limit, contract error handler (all codes in section 2, no stack traces, unknown route -> `not_found`), 413/415 handling, Origin/`Sec-Fetch-Site` check on mutating requests, `GET /api/health`. Scripts: `dev` (`tsx watch`), `start`, `test`, `typecheck`.
- Done when: inject tests cover health shape, 404/413/415/origin_rejected error bodies, `X-Request-Id`, helmet headers, no `X-Powered-By`, no CORS headers, 429 with `Retry-After`; `npm run dev -w @site/api` then `curl http://127.0.0.1:3001/api/health` returns the contract body (paste output); `npm test -w @site/api` passes.

### B3 SQLite and guestbook
- Owner: backend-engineer. Depends: B2. Branch: `feat/api-guestbook`. Status: todo.
- Deliverable: `better-sqlite3@^12` DB module, migration runner and `apps/api/migrations/001_init.sql` (`guestbook_entries`, `sessions`), `GET/POST /api/guestbook` exactly per contract with parameterized statements, the 3-per-10-min POST limit, and a real DB check in `/api/health` (503 `unavailable` when down). DB path from env, `data/` gitignored.
- Done when: tests cover keyset pagination (`before`, `nextBefore`), validation errors with `details`, SQLi and HTML payloads stored verbatim and returned unchanged, 429 on the 4th post, DB-closed gives 503; all pass; PR shows a `curl` create+list round trip.

### B4 Auth and admin endpoints
- Owner: backend-engineer. Depends: B3. Branch: `feat/api-auth`. Status: todo.
- Deliverable: scrypt hash util and `npm run hash-password -w @site/api -- <password>`; session store (sha256 of id, 8 h expiry, expired-row cleanup); `POST /api/auth/login|logout`, `GET /api/auth/me`; `requireOperator` hook; `DELETE /api/admin/guestbook/:id`; `GET /api/admin/diagnostics`; login limit 5/min; dev random-password-at-startup; production refuses to start without `OPERATOR_PASSWORD_HASH`. Cookie attributes exactly per contract section 3.
- Done when: tests cover the full access matrix (each admin route anonymous -> 401), identical `invalid_credentials` for unknown user vs wrong password, cookie flags, new session id per login, logout invalidates the old cookie, expired session -> anonymous, 6th login attempt -> 429, production start without hash exits non-zero; a failed login emits a structured log line (requestId and client IP only, never the username, password or cookie), because the concept's voice says failed logins are logged; no password or cookie value in logs (assert on captured log output).

### B5 CI/CD workflows
- Owner: backend-engineer. Depends: B2, and Q4 merged (uses `qa/tools/scan-secrets.mjs`). Branch: `feat/ci-workflows`. Status: todo.
- Deliverable: `.github/workflows/ci.yml` (triggers: `push` to `main` and `pull_request` targeting `main`; Node from `.nvmrc`; `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`), `.github/workflows/security.yml` (`npm audit --audit-level=high`, `node qa/tools/scan-secrets.mjs`, weekly schedule), `.github/dependabot.yml` (npm, weekly), `.github/pull_request_template.md` mirroring the `docs/prs` format (PR files are written so they can be pasted into real GitHub PRs later). A `deploy.yml` stub that is `workflow_dispatch` only and echoes "not configured".
- Done when: every workflow parses as valid YAML (validate with a YAML parser installed outside the repo; say how); every `run:` command is executed locally in the same order with real output pasted in the PR file; the PR file states plainly that the workflows have not run on GitHub.

### B6 Runbook, README, hardening
- Owner: backend-engineer. Depends: B4, B5. Branch: `feat/api-runbook`. Status: todo.
- Deliverable: `apps/api/README.md` (env vars, endpoints with curl examples against localhost, how to create the operator hash), `infra/RUNBOOK.md` (owner-executed steps to go live: remote, push, Actions, hosting options, env/secret checklist, SQLite backup, rollback; marked NOT EXECUTED), graceful shutdown (SIGTERM closes DB), pino log redaction of cookie/authorization/password, plus fixes for any Critical/High QA finding open against the backend.
- Done when: tests prove redaction and clean shutdown; runbook contains no real secrets or invented owner facts; QA gate PASS.

---

## Frontend Engineer (worktree `.worktrees/web`)

### F1 Web shell
- Owner: frontend-engineer. Depends: none. Branch: `feat/web-shell`. Status: todo.
- Deliverable: `apps/web`: `package.json` (vite 7, react 19, plugin-react 5, vitest 5, jsdom 28, testing-library), `vite.config.ts` (proxy `/api` -> `http://127.0.0.1:3001`, vitest jsdom config), `index.html`, `src/main.tsx`, `src/App.tsx` placeholder, `tsconfig.json` extending the base, scripts `dev`, `build`, `test`, `typecheck`, `preview`.
- Done when: `npm run dev -w @site/web` serves on 5173; `npm run build -w @site/web` succeeds and `dist/index.html` has no inline `<script>`; a smoke test passes; PR lists each dependency.

### F2 Terminal engine
- Owner: frontend-engineer. Depends: F1. Branch: `feat/web-terminal-engine`. Status: todo.
- Deliverable: `src/terminal/`: input parser (quotes, escapes, max input length), command registry (`name`, `aliases`, `usage`, `run(ctx,args)` returning typed output lines of plain strings), history (up/down, capped, never stores masked input), scrollback cap, masked-prompt mode, `<Terminal>` component and `useTerminal` hook. No API calls, no design dependencies.
- Done when: unit tests for parser (quotes, empty, unicode, 10 kB input), history, dispatch, unknown command; a Testing Library test types `<img src=x onerror=alert(1)>` and finds it as inert text; tests pass.

### F3 API client and session
- Owner: frontend-engineer. Depends: F1, B1 merged (both now done). Branch: `feat/web-api-client`. Status: todo. Note from QA gate F1: with the API down, the Vite proxy returns a bare `500 text/plain` with an empty body, so the client must map non-JSON and empty error bodies to a generic network-style error.
- Deliverable: `src/api/client.ts`: typed functions for every MVP endpoint (`import type` from `@site/shared`), `credentials: "same-origin"`, 8 s timeout, `ApiError` class carrying `code`/`requestId`/`retryAfter`, no body logging; `useSession` context (`user | null | loading`).
- Done when: tests with mocked `fetch` cover each endpoint success plus 400, 401, 403, 404, 429 (Retry-After), 500, network failure, and timeout, and a non-JSON or empty error body (proxy 500 when the API is down); tests pass.

### F4 Commands
- Owner: frontend-engineer. Depends: F2, F3, D4 merged. Branch: `feat/web-commands`. Status: todo.
- Deliverable: every command in `docs/design/terminal-commands.md` with the exact strings, static copy in `src/content/` (placeholders where the spec has them), server-backed commands via the client, masked login prompt, operator-only commands gated by session, friendly rate-limit and offline messages.
- Done when: a test per command (success and at least one error) using a mocked client; help output matches the spec; after B3 and B4 are merged, run the real API and paste a transcript of `status`, `guestbook`, `guestbook sign`, `login`, `whoami`, `guestbook rm`, `logout` in the PR file.

### F5 Boot, layout, effects
- Owner: frontend-engineer. Depends: F1, D2, D3 merged. Branch: `feat/web-boot-layout`. Status: todo.
- Deliverable: `src/styles/tokens.css` (copy of `docs/design/tokens.css`, header says so), boot sequence per D3 (skippable with any key or tap), page layout and landmarks, CSS/canvas effects from D3, mobile layout, `prefers-reduced-motion` path per spec.
- Done when: tests show boot skip works, reduced-motion renders the final state immediately without animation, landmarks exist; bundle is under 250 kB gzipped JS (report `npm run build` output); no external network requests (fonts/assets are local).

### F6 Easter eggs, a11y, polish
- Owner: frontend-engineer. Depends: F4, F5, D5 merged. Branch: `feat/web-polish`. Status: todo.
- Deliverable: the easter eggs in `easter-eggs.md`; a11y pass (output region `aria-live`, focus never lost, keyboard-only use, contrast per D2 table, tap-to-focus and visible prompt with the mobile keyboard); fixes for every Critical/High QA finding open against the web app (each fix on its own `fix/<id>` branch and PR file).
- Done when: tests for each easter egg and the a11y roles; QA gate PASS; Creative Director has no open blocking feedback.

---

## Creative Director (worktree `.worktrees/design`)

**Site name: PARZIVAL** (owner's decision, relayed by the lead, 2026-09-21). D1 merged under the old working name PICKET-07. The rename amendment (`feat/design-rename`, docs-only, `docs/design/concept.md`) goes first, then D2, then D4, each as its own docs-only branch. The GRAYDOT draft of `feat/design-rename` is superseded and must not be merged. The hold on D2 and D4 is released; D3, D5, D6 follow their dependencies.

### D1 Concept and voice
- Owner: creative-director. Depends: none. Branch: `feat/design-concept`. Status: done (merged).
- Deliverable: `docs/design/concept.md`: the system's name and premise, voice guide with do/don't sample lines, the 60-second visitor journey, three specific things that keep it from looking like a generic cyberpunk template, and an explicit list of ideas from the brief left out of the MVP with reasons. Personal facts only as `[PLACEHOLDER: ...]`.
- Done when: fits the MVP scope in `roadmap.md`; Architect review.

### D2 Tokens and style guide
- Owner: creative-director. Depends: D1. Branch: `feat/design-tokens`. Status: todo.
- Deliverable: `docs/design/tokens.css` (custom properties: exact hex colors, spacing scale, type scale, motion durations and easings, z-index), `docs/design/style-guide.md` (usage rules, contrast table with computed ratios: body text >= 4.5:1, large text and UI >= 3:1). System font stack only; no external font or asset loads. Optional SVG glyph/logo in `docs/design/assets/`.
- Done when: every text/background pair used is in the contrast table; Architect review.

### D3 Boot, layout, motion spec
- Owner: creative-director. Depends: D1, D2. Branch: `feat/design-screens`. Status: todo.
- Deliverable: `docs/design/screens.md`: the boot sequence (exact lines, timings, skip rule), main layout with ASCII wireframes for desktop and mobile, empty/loading/API-offline states, an effects catalog (each effect: trigger, duration, easing, reduced-motion fallback, CPU cost note), keyboard and focus rules.
- Done when: an engineer could build it with no questions; every effect has a fallback; Architect review.

### D4 Terminal command spec
- Owner: creative-director. Depends: D1 (contract already published). Branch: `feat/design-commands`. Status: todo.
- Deliverable: `docs/design/terminal-commands.md`: prompt string, at most 14 MVP commands, and for each: syntax, help line, exact success output, exact error outputs, auth requirement, API call (map to contract section 7), placeholders. Login flow, rate-limit and offline messages. Any endpoint or field you need beyond the contract goes in a "Requests to Architect" section (or message the Architect early).
- Done when: no command needs an API call outside the contract; every string is exact; Architect review.

### D5 Easter eggs and backlog
- Owner: creative-director. Depends: D4. Branch: `feat/design-easter-eggs`. Status: todo.
- Deliverable: `docs/design/easter-eggs.md` (two MVP easter eggs with exact trigger, exact output, discoverability hint; client-side only, harmless, no external assets), `docs/design/backlog.md` (Phase 2+ ideas ranked, each with its API need so the Architect can plan).
- Done when: MVP eggs are buildable in under a day of frontend work each; Architect review.

### D6 Design review of the build
- Owner: creative-director. Depends: F4, F5 merged. Branch: `feat/design-review`. Status: todo.
- Deliverable: `docs/design/reviews/mvp-review.md`: run the site locally (`npm run dev`), check every spec item pass/fail, list the top five fixes in priority order, message the Frontend Engineer with the path.
- Done when: every spec item is marked; a verdict on "does it feel like its own thing"; Architect review.

---

## Security / QA Engineer (worktree `.worktrees/qa`)

### Q1 Test plan and threat model
- Owner: security-qa-engineer. Depends: none. Branch: `feat/qa-test-plan`. Status: done (merged).
- Deliverable: `qa/test-plan.md` (scope, per-endpoint test matrix from the contract, severity scale, exit criteria), `qa/threat-model.md` (assets, entry points, top threats with planned test: session fixation, brute force, XSS via guestbook or terminal, CSRF, Trojan Source/bidi, SQLi, verbose errors, secrets in repo, supply chain), `qa/reports/README.md` (finding and gate templates).
- Done when: every contract endpoint has at least one negative test planned; every threat maps to a test or checklist item; Architect review.

### Q2 QA harness
- Owner: security-qa-engineer. Depends: B2 merged. Branch: `feat/qa-harness`. Status: todo.
- Deliverable: `qa/package.json` (`@site/qa`, vitest), `qa/vitest.config.ts`, a global setup that spawns the API from source (`tsx`) on a free `127.0.0.1` port with a temp DB and known test env, an HTTP helper with a cookie jar, and a hard guard that refuses any base URL that is not localhost.
- Done when: `npm test -w @site/qa` runs a green health smoke test; a test proves the guard rejects a non-local URL; the spawned process is always torn down.

### Q3 API test and attack suite
- Owner: security-qa-engineer. Depends: Q2, B3, B4 merged. Branch: `feat/qa-api-suite`. Status: todo.
- Deliverable: `qa/api/*.test.ts`: contract conformance (validate bodies with the `@site/shared` schemas), access matrix, session lifecycle, CSRF/Origin, injection payloads (SQLi, HTML, control and bidi characters) in every input, oversize and malformed JSON, rate limits, header checks, error hygiene (no stack, path, or SQL text). Each failure is filed in `qa/reports/` and sent to the Backend Engineer.
- Done when: suite runs; every finding has a report; tests for verified-fixed findings stay in the suite as regressions.

### Q4 Secret scan and dependency audit tooling
- Owner: security-qa-engineer. Depends: none. Branch: `feat/qa-hygiene-tools`. Status: done (merged).
- Deliverable: `qa/tools/scan-secrets.mjs` (Node, zero dependencies: scans the working tree and `git log -p` history for key/token/private-key patterns and committed `.env` files, redacts values in output, ignores `.env.example` placeholders, exits 1 on a hit), its own test with fixtures (Node's built-in `node --test`, no dependencies), and `qa/reports/dependency-baseline.md` from `npm audit`. The script path is fixed because CI (B5) calls it.
- Done when: the fixture test (`node --test qa/tools`) proves it flags a fake token and ignores placeholders; a real run against this repo is recorded (redacted); Architect review.

### Q5 Web security and a11y review
- Owner: security-qa-engineer. Depends: F4, F5 merged. Branch: `feat/qa-web-review`. Status: todo.
- Deliverable: `qa/web/*.test.tsx` (hostile guestbook payloads render inert; terminal input edge cases: very long input, control characters, escape-sequence lookalikes, paste; the password never appears in DOM, history, or storage), `qa/tools/check-dist.mjs` (built `dist/` has no inline script, no `eval`, no external URLs), and `qa/reports/web-review.md` (keyboard-only pass, focus order, reduced-motion, 360 px width, contrast spot checks against the D2 table).
- Done when: results recorded with real output; each finding reported to the Frontend Engineer.

### Q6 MVP security review
- Owner: security-qa-engineer. Depends: B6, F6, Q3, Q5. Branch: `feat/qa-mvp-review`. Status: todo.
- Deliverable: `qa/reports/security-review-mvp.md`: all findings with status and retest evidence, `npm audit` and secret-scan output (history included), authz matrix result, residual risks, and a list of every merged branch with its gate file.
- Done when: no open Critical/High findings, or an explicit list for the Architect to decide on.

### G Standing gates (per code branch)
- Owner: security-qa-engineer. Ongoing. Output: `qa/reports/gate-<slug>.md` with `Verdict: PASS|FAIL`, what was run (real commands and output), and links to any finding reports. Retest each fix with the original reproduction plus adjacent cases; record verified / not fixed / regression. Never approve your own work (you write no application code, so there is nothing of yours to approve in code branches).

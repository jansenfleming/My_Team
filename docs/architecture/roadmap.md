# Roadmap

Owner: Architect. Principle from the owner: start simple, then keep improving. Each phase must leave `main` working.

## MVP (Phase 1): "the terminal that talks to a real backend"

One screen. A visitor boots into a command-center terminal, types commands, reads placeholder dossier content, signs a public guestbook, and an operator can log in and moderate. It is small on purpose but touches every layer.

### In
1. **Boot + terminal UI** (web): boot sequence, then a keyboard-first terminal with history, `help`, tab-complete-free basics, mobile-usable input. Styled per the Creative Director's tokens and specs; degrades under `prefers-reduced-motion`.
2. **Client-side commands** (no API): content and UI commands as specified by the Creative Director (e.g. help, about, agents, clear, and 1-2 easter eggs). All personal facts are `[PLACEHOLDER: ...]`.
3. **Server-backed commands**: `status` (health), `guestbook` (list), `guestbook sign` (create), `login`, `logout`, `whoami`, and operator-only `guestbook rm <id>` and `diagnostics`.
4. **API**: `health`, `auth/login|logout|me`, `guestbook` list/create, `admin/guestbook/:id` delete, `admin/diagnostics`. Contract: `api-contract.md`.
5. **Auth**: single operator account, scrypt password, server-side session cookie, Origin check, login rate limit.
6. **Data**: SQLite with migrations (guestbook entries, sessions).
7. **Security baseline**: input validation, parameterized SQL, security headers, rate limits, generic errors, no secrets in repo, dependency audit, secret scan.
8. **Automated tests**: API (inject), web (Testing Library), shared schemas, and an independent QA black-box suite plus security tests.
9. **CI/CD files**: `.github/workflows/ci.yml` (install, lint, typecheck, test, build), `security.yml` (audit + secret scan), `dependabot.yml`, a deploy runbook in `infra/`. They cannot run until a remote exists; they are checked locally by running the same npm scripts.
10. **Agent collaboration evidence**: board, PR description files, QA reports and gates, ADRs, and the git history itself.

### Explicitly out of MVP
Missions / CTF / flag submission, network or map visualizations, real-time (WebSocket/SSE), live agent-activity feed, multi-user accounts or registration, password reset or email, analytics, CMS or admin UI beyond terminal commands, hidden routes/pages beyond the terminal's own easter eggs, Playwright/browser E2E, Docker, real deployment, custom domain/TLS, an ORM, i18n, SSR, service worker/PWA, audio.

Anything the Creative Director proposes that needs a new endpoint or field goes through the change process in `api-contract.md` and lands in a later phase unless it is cheap and additive.

### MVP exit criteria
- Fresh clone: `npm install`, then `npm run dev` gives a working site and API; `npm test` passes; `npm run lint` and `npm run typecheck` pass.
- Every Phase 1 board task is Done per the brief's definition of done (owner tests, QA gate PASS, Architect merge).
- `qa/reports/security-review-mvp.md` has no open Critical/High findings.
- The Architect's `release-readiness.md` exists and recommends (does not perform) next steps for the owner.

## Phase 2: "make it feel alive" (starts after MVP merge; board written then)
- Missions: a small server-verified challenge set (`/api/missions`), progress stored per visitor session. Flags stored as hashes.
- Agent-activity feed: `GET /api/agents/activity`, generated from git log at build time (no runtime git access).
- Creative Director's approved terminal/command additions, each with a contract change.
- Playwright E2E smoke test (needs `npx playwright install`; owner approval for the browser download).
- Hidden pages via hash routes; a richer easter-egg set; sound off by default.
- Frontend: visualization (canvas) for the network/diagnostics view.
- QA: fuzzing of the terminal parser, expanded authz matrix, dependency-review automation.

## Phase 3: "ship it" (only with the owner's approval)
- Bundle the API (esbuild/tsup), serve the web build from the API or static host, strict CSP headers in production.
- Deploy runbook executed by the owner: create remote, push, enable Actions, pick a host. Agents prepare, the owner clicks.
- Backups for the SQLite file, log redaction review, uptime check.

## Phase 4: continuous improvement
Owner-directed backlog. Candidates: SSE-based live agent feed, Postgres if needed, richer operator tooling, additional authorized security demos against the local instance only.

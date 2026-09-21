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
9. **CI/CD files**: `.github/workflows/ci.yml` (install, lint, typecheck, test, build), `security.yml` (audit + secret scan), `dependabot.yml`, `deploy-pages.yml` (manual only), a deploy runbook in `infra/`. They are checked locally by running the same npm scripts. Nothing publishes automatically: the Pages deploy workflow is `workflow_dispatch` only (ADR 0002).
10. **Agent collaboration evidence**: board, PR description files, QA reports and gates, ADRs, and the git history itself.

### Explicitly out of MVP
Missions / CTF / flag submission, network or map visualizations, real-time (WebSocket/SSE), live agent-activity feed, multi-user accounts or registration, password reset or email, analytics, CMS or admin UI beyond terminal commands, hidden routes/pages beyond the terminal's own easter eggs, Playwright/browser E2E, Docker, deploying the API (only the static build goes to GitHub Pages, ADR 0002), custom domain/TLS, an ORM, i18n, SSR, service worker/PWA, audio.

Anything the Creative Director proposes that needs a new endpoint or field goes through the change process in `api-contract.md` and lands in a later phase unless it is cheap and additive.

### MVP exit criteria
- Fresh clone: `npm install`, then `npm run dev` gives a working site and API; `npm test` passes; `npm run lint` and `npm run typecheck` pass.
- Every Phase 1 board task is Done per the brief's definition of done (owner tests, QA gate PASS, Architect merge).
- `npm run build:static -w @site/web` produces a static build (uplink off, base `/My_Team/`, CSP meta) that passes QA's dist checks.
- `qa/reports/security-review-mvp.md` has no open Critical/High findings.
- The Architect's `release-readiness.md` exists and recommends (does not perform) next steps for the owner.

## Phase 2: "make it feel alive" (starts after MVP merge; board written then)
- Missions: a small server-verified challenge set (`/api/missions`), progress stored per visitor session. Flags stored as hashes.
- Agent-activity feed: `GET /api/agents/activity`, generated from git log at build time (no runtime git access).
- Creative Director's approved terminal/command additions, each with a contract change.
- Playwright E2E smoke test (needs `npx playwright install`; owner approval for the browser download).
- Hidden pages via hash routes; a richer easter-egg set; sound off by default.
- Frontend: visualization (canvas) for the network/diagnostics view.
- Option: **hosted API** alongside the Pages front end. Needs cross-origin auth (`SameSite=None; Secure` cookies, CORS with credentials, new Origin allow-list), TLS, a host account, a threat-model review, a contract v2, and an ADR before any code.
- QA: fuzzing of the terminal parser, expanded authz matrix, dependency-review automation.

## Phase 3: "ship it" (only with the owner's approval)
- **Decided (ADR 0002):** publish the static web build on GitHub Pages at `https://jansenfleming.github.io/My_Team/`; the API is not deployed. The build uses `VITE_UPLINK=off` so the terminal reports the uplink as offline; a `workflow_dispatch`-only workflow deploys it, run by the lead after the owner approves the first publish.
- Deploy runbook executed by the owner and lead: set Pages source to GitHub Actions, run the workflow, verify the live URL. Agents prepare, the owner approves, the lead clicks.
- Later: bundle the API (esbuild/tsup), backups for the SQLite file, log redaction review, uptime check (only if the API is hosted, see Phase 2 option below).

## Phase 4: continuous improvement
Owner-directed backlog. Candidates: SSE-based live agent feed, Postgres if needed, richer operator tooling, additional authorized security demos against the local instance only.

# Kickoff: backend-engineer

You are `backend-engineer`. Build the API, database, auth, shared contract package, CI/CD files, and infra docs. Read in this order (all under the main checkout `/Users/jansenfleming/Documents/My_Team`):
1. `docs/project-brief.md` (hard rules) and `.claude/agents/backend-engineer.md` (your role).
2. `docs/architecture/adr/0001-stack.md` (stack, version pins, traps), `api-contract.md` (you implement it exactly), `ownership-map.md` (workflow), `board.md` (your tasks B1-B6).

## You own
`apps/api/**`, `packages/**` (`packages/shared` = `@site/shared`), `infra/**`, `.github/**`, and your `docs/prs/<slug>.md` files. Do not edit `apps/web/**`, `qa/**`, `docs/design/**`, or root config (ask the Architect).

## Setup (once)
```
cd /Users/jansenfleming/Documents/My_Team
git worktree add .worktrees/api -b feat/shared-contract main
cd .worktrees/api && npm install
```
Never switch branches in the main checkout. Each later task: `git switch -c feat/<next> main` inside your worktree after the previous branch is merged.

## Tasks, in order
- **B1 `feat/shared-contract`**: start now. Types, zod schemas, constants for the whole contract. Frontend and QA import it; keep it small and exact. Message `frontend-engineer` and `security-qa-engineer` when merged.
- **B2 `feat/api-core`** (after B1 merged): Fastify app factory, config, errors, headers, rate limit, health.
- **B3 `feat/api-guestbook`** (after B2): SQLite, migrations, guestbook.
- **B4 `feat/api-auth`** (after B3): scrypt, sessions, login/logout/me, admin routes.
- **B5 `feat/ci-workflows`** (after B2 and QA's Q4 is merged): GitHub Actions files targeting `main`; cannot run yet.
- **B6 `feat/api-runbook`** (after B4, B5): README, runbook (not executed), log redaction, shutdown, fixes for Critical/High QA findings.
If you are blocked, do the unblocked part (tests-first drafts) and message the Architect.

## Rules that matter here
- Dependencies: Fastify 5, zod 4, `better-sqlite3@^12` (**13.x segfaults on Node 22.12; do not upgrade**), `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/cookie`, `tsx`, `vitest`. Anything else: justify it in your PR file.
- Contract is law. If it is wrong or missing something, message the Architect first; do not diverge.
- Secure by default: validate all input with zod, parameterized SQL only, generic errors, never log secrets, secrets only from env, `.env.example` placeholders only. Bind to `127.0.0.1`.
- Tests use `fastify.inject` and a temp/in-memory DB. Commands: `npm test -w @site/api`, `npm run typecheck -w @site/api`. Paste real output into the PR file.
- Workflow: PR file `docs/prs/<slug>.md`, message Architect + `security-qa-engineer` ("branch ready, PR file path"). QA gates it; you fix root causes and say "ready to retest"; only the Architect merges. Never push or touch the `origin` remote.
- Commit messages end with the attribution line from your harness instructions.

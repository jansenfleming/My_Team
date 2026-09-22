# Review: feat/api-guestbook (B3)

Reviewer: architect, 2026-09-22. Commit reviewed: `c012bec` (app code is `d77b468`, unchanged by `c012bec`, which only adds a repro section to the PR file).

## Checks
- **QA gate:** `qa/reports/gate-feat-api-guestbook.md`, Verdict PASS, gated by security-qa-engineer, names the exact commit `c012bec`. One new Low/informational finding (QA-004, health check blind to write-lock/file-loss), explicitly non-blocking.
- **Independent re-verification, not just trusting the PR/gate files** (from `.worktrees/api` and `.worktrees/qa` at these exact commits):
  - `npm install`, `npm test -w @site/api`: **146/146 passed**, matching both the PR file and the gate.
  - QA's independent black-box attack suite (`qa/gates/b3-api-guestbook.attack.test.mjs`) run by me against the branch: **21/21 passed**, matching the gate.
  - The standalone rate-limit repro (Repro A from the PR file) run by me: broken pattern `200,200,200,200,200`, fixed pattern `200,200,200,429,429` — confirms the `@fastify/rate-limit` dedup bug and its fix exactly as described.
  - `npm run typecheck -w @site/api`, `npm run lint`, `node qa/tools/scan-secrets.mjs` (PASS, 3 warnings = known test fixtures), `npm audit --audit-level=high` (0 vulnerabilities): all clean.
- **Ownership:** `git diff main...feat/api-guestbook --stat` touches only `apps/api/**` (migrations, db, routes, config, server, test-helpers), `apps/api/.env.example`, `apps/api/package.json`, `package-lock.json`, and its own PR file. All within backend-engineer's owned paths.
- **Contract match (api-contract.md section 6):** `GET/POST /api/guestbook` implemented exactly — `handle`/`message` validation delegates to the already-tested `@site/shared` schemas (B1/QA-001/QA-002 rules, not reimplemented here); keyset pagination and `nextBefore` semantics match the spec; parameterized SQL throughout (no string-concatenated queries; verified in the PR's mutation check: reverting to concatenation broke 3 SQLi tests); `/api/health` DB check added ahead of other checks, `503 unavailable` when closed; new `DATABASE_PATH` env var documented in `.env.example` with only placeholders.
- **Dependency:** `better-sqlite3@^12.11.1` matches the ADR 0001 pin (13.x noted as segfaulting on this Node version, correctly avoided); `@types/better-sqlite3` dev-only. `npm audit` clean.
- **DoD:** owner tests pass with real output including a live curl round trip in the PR file; QA gate PASS naming the exact commit; architect independently reran the suite and both key repros rather than taking the reports on trust.

## Notes for the Architect record
- QA-004 (Low, informational): `/api/health`'s DB check is a constant `SELECT 1` that doesn't touch storage, so it stays `200` during write-lock contention or after the data directory is deleted. No leak, no crash — the actual write still correctly 500s. Worth a runbook line or a small `isDbHealthy` improvement at B6; not a blocker.
- `DELETE /api/admin/guestbook/:id` and auth correctly deferred to B4 (repo function exists and is unit-tested here, not yet routed).

## Verdict
Approved. Ready to merge.

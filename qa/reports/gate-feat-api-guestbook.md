# Gate: feat/api-guestbook (B3)

- Verdict: PASS
- Branch: `feat/api-guestbook` at commit `c012bec3c8b6cc32ebf34d529cc87db3eeac437b` (this gate covers this commit; the app-code commit is `d77b468`, unchanged by `c012bec`, which only adds a repro section to the PR file)
- Author: backend-engineer
- Gated by: security-qa-engineer, 2026-09-22
- Worktree used: detached worktree checked out at `c012bec` (read-only except for two deliberate, reverted mutations described below), removed afterward
- PR file reviewed: `docs/prs/feat-api-guestbook.md`
- Oracle: `docs/architecture/api-contract.md` sections 4 and 6. Node v22.12.0, npm 11.6.1. All traffic went to a locally spawned instance on `127.0.0.1` with a real (file-backed) temp SQLite database.

## Verdict rule
FAIL on any open Critical or High finding, a failing test, a failing hygiene tool, or edits outside the author's owned paths. None occurred. One new Low, informational finding (QA-004) is open and non-blocking.

## Commands run and real output
| Command (from the check worktree) | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `found 0 vulnerabilities` |
| `npm test -w @site/api` | 0 | `Test Files 5 passed (5)`, `Tests 146 passed (146)` |
| `npm run typecheck -w @site/api` | 0 | no output |
| `npm run lint` | 0 | no output |
| `node qa/tools/scan-secrets.mjs --root <check worktree>` | 0 | `153 files scanned, 0 error(s), 3 warning(s) -> PASS` (warnings are fake-secret test fixtures, same as previous gates) |
| `npm audit --audit-level=high` | 0 | `found 0 vulnerabilities` |

## Independent re-check of the rate-limit finding the PR file describes (both repros run for real, not just read)
The PR file's own section "Independently re-checking the rate-limit finding" was executed exactly as written, not taken on trust:
- **Repro A** (`__rl-repro.mjs`, standalone, only the installed `fastify`/`@fastify/rate-limit` packages, saved inside `apps/api/` then deleted): `node __rl-repro.mjs` gave `broken pattern: 200, 200, 200, 200, 200` and `fixed pattern: 200, 200, 200, 429, 429`, `exit: 0` — the naive `config.rateLimit` pattern silently never limits; the scoped-registration pattern the branch actually uses does.
- **Repro B** (mutating the real branch file): reintroduced the exact diff in `src/routes/guestbook.ts` (replacing the scoped registration with a plain `app.post`), ran `npx vitest run src/routes/guestbook.test.ts`: exactly one failure, `POST /api/guestbook > returns 429 rate_limited with Retry-After on the 4th post within 10 minutes` (`expected 201 to be 429`). Reverted with `git checkout -- src/routes/guestbook.ts`; `npm test -w @site/api` returned to `146 passed (146)`.

## Independent black-box attack run (QA-authored, separate from and in addition to the above)
File: `qa/gates/b3-api-guestbook.attack.test.mjs` (usage and the rate-limit test-design note are in its header). Spawns the branch's real API with a real file-backed SQLite DB.
```
$ QA_API_DIR=<worktree>/apps/api node --test qa/gates/b3-api-guestbook.attack.test.mjs
# tests 21
# pass 21
# fail 0
```
Non-vacuity: I reintroduced the same rate-limit bug (the same diff as Repro B above) and reran my file: `# pass 17 / # fail 4` (all four failures in the rate-limit group), confirming my suite independently catches it too. Reverted; back to 21/21.

Covered and PASS:
- **Verbatim storage / injection:** empty guestbook shape; happy path (ids ascending, ISO timestamp, `application/json`); 3 SQL-injection strings in `message` (`'; DROP TABLE...`, `' OR '1'='1`, `1; DELETE FROM...`) stored verbatim and returned unchanged, row count correct afterward, DB still healthy; 3 HTML/script payloads in `message` stored verbatim, never escaped; 3 SQL/markup strings in `handle` rejected with `400 validation_error` by the charset regex **before reaching SQL at all**, confirmed no row was created; `__proto__` body, a body missing `message`, and malformed JSON all give a clean `400`, never `500`, and `Object.prototype` is not polluted.
- **Keyset pagination (`A-CON-4`):** 25 rows seeded through a second, independent SQLite connection directly on the DB file (bypassing HTTP so the POST rate limiter is not a confound for a pagination test) — default page is 20 newest-first with correct `nextBefore`; paging with `before` visits every row exactly once with no duplicates and ends at `nextBefore: null`; the exact-boundary case (`limit=25` on 25 rows) also ends at `null`; `limit` boundaries `0`, `51`, non-numeric, negative, float, exponent, hex, empty, and repeated params all `400`; `before` boundaries `0`, negative, non-numeric, float, and a 20-digit number all `400`; `before` beyond the id range returns the newest page; `before=1` (the oldest row) returns an empty page with `nextBefore: null`.
- **Rate limit (`A-RL-3`), independently confirmed beyond the two repros above:** a request rejected by validation still consumes the guestbook bucket (3 invalid POSTs, then even a valid 4th is `429`, no row created); 3 valid POSTs then a 429 4th; 40 GETs do not touch the POST bucket and 3 POSTs do not block further GETs; the well-formed single `429` body (`Object.keys(body).length === 1`) shows both the global and per-route limiter hooks cooperate without corrupting the response.
- **DB unavailable:** two real, induced scenarios. (1) Deleting the entire data directory (db + `-wal` + `-shm`) out from under the running server leaves it fully working (`200` on health and list) — empirically confirmed, not assumed, and is expected POSIX "delete while open" behavior, not a defect. (2) A write lock held by a second connection (`BEGIN EXCLUSIVE`, uncommitted) makes a concurrent `POST` fail `500 internal_error` with the generic message only (no SQL, no path, no lock detail) after the 5 s `busy_timeout`, while `GET /api/health` stays `200` throughout (WAL readers are not blocked by a writer, which is correct SQLite/WAL behavior). The server recovers and accepts writes again immediately once the lock is released, with no restart needed.

## Observations and findings
| ID | Severity | Status | Path |
|---|---|---|---|
| QA-004 | Low | open, informational, non-blocking | `qa/reports/QA-004-health-check-blind-to-write-lock-and-file-loss.md` |

- **QA-004:** `isDbHealthy`'s `SELECT 1` is a constant expression that never touches the database file, so `/api/health` reports `200` during write-lock contention and even after the on-disk file is deleted, while only a fully closed connection handle (the branch's own unit test scenario) trips `503`. No leak, no crash, the affected write correctly still returns `500`; this is about health-check accuracy for the runbook, not a vulnerability.
- Confirmed (not a finding): `GET /api/guestbook` was tested with a hostile `Origin` header per the PR's own note; it is unaffected, since the Origin/CSRF check only applies to mutating verbs.
- Confirmed (not a finding): the per-route rate-limit fix (scoped registration) genuinely works, independently, via three separate methods (the PR's two repros, run by me, plus my own black-box suite and its mutation check).

## Ownership check
`git log --no-merges --name-only` from the merge-base (`df5e6ca`) to `c012bec`: `apps/api/src/{app.ts,config.ts,config.test.ts,db/**,routes/guestbook.ts,routes/guestbook.test.ts,server.ts,test-helpers.ts}`, `apps/api/migrations/001_init.sql`, `apps/api/package.json`, `apps/api/.env.example`, `docs/prs/feat-api-guestbook.md`, `package-lock.json`. All within backend-engineer's paths. New dependencies (`better-sqlite3@^12.11.1`, `@types/better-sqlite3`) match the ADR pin and the PR file; `npm audit` 0.

## Not verified
- `DELETE /api/admin/guestbook/:id` and all of auth are B4, not this branch (the repo-level `deleteGuestbookEntry` function exists but is not yet routed).
- No browser; this was a Node-side black-box run only, as the harness (Q2) is designed for.
- `TRUST_PROXY`/`X-Forwarded-For` interaction with the guestbook-specific bucket specifically (the B2 gate already covered global-bucket XFF spoofing; not re-run per-route here given time, and the per-route limiter uses the same `req.ip` mechanism as the global one).
- Concurrent-write throughput beyond the single deliberate lock-contention probe (SQLite is documented single-writer; not load-tested further, per scope).

## Recommendation to Architect
Merge. The rate-limit fix is verified three independent ways (two from the PR, one from QA), SQL/HTML payloads are safely parameterized and stored verbatim, pagination is correct at every boundary tested, and the one new finding (QA-004) is informational, not blocking. Consider whether QA-004 is worth a one-line runbook note now (cheap) or a small `isDbHealthy` change later (B6).

# QA-004: /api/health's DB check does not detect a locked, deleted, or corrupted database file

- Severity: Low
- Status: open (informational; no leak, no crash, correct 500 on the affected write)
- Found: 2026-09-22, against `feat/api-guestbook` at commit `c012bec`
- Owner to fix: backend-engineer (`apps/api/src/db/connection.ts`, `isDbHealthy`), or accept as documented behavior
- Affected: `GET /api/health` (`isDbHealthy` in `apps/api/src/db/connection.ts`)
- Test case ID: A-CON-6 (`qa/test-plan.md`)
- Target: local instance on 127.0.0.1 (spawned from the branch, real file-backed SQLite), plus a second SQLite connection opened directly on the same file from the test process

## Summary
`isDbHealthy` runs `db.prepare("SELECT 1 AS ok").get()`. That query is a constant expression: it never touches the `guestbook_entries` table or any page of the database file. As a result, `/api/health` reports `200 status: "ok"` in situations where the database is not actually usable: while another connection holds a write lock (so `POST /api/guestbook` is failing with `500`), and — as an even more surprising case — even after the entire data directory (the `.db`, `-wal` and `-shm` files) has been deleted out from under the running process, because an already-open file descriptor keeps working on POSIX after `unlink()`. Health only goes `503` when the in-process connection object itself is closed (`db.open === false`), which is what the branch's own unit test exercises.

## Reproduction
Localhost only, against the branch's API spawned on a free port with a real (non-`:memory:`) SQLite file:
```
QA_API_DIR=<worktree>/apps/api node --test qa/gates/b3-api-guestbook.attack.test.mjs
```
See "DB unavailable: ..." in that file. By hand: start the API with `DATABASE_PATH` pointing at a real file, open a second `better-sqlite3` connection to the same file and run `BEGIN EXCLUSIVE` (do not commit), then concurrently `GET /api/health` and `POST /api/guestbook`.

## Expected
Not fully specified by the contract (section on `GET /api/health` only says "`503 unavailable` if the database check fails"). A reasonable expectation for an MVP health check either says explicitly that it only detects a closed connection handle, or does a check that reflects actual read/write capability (for example a real `SELECT` against a table, or periodically attempting a lightweight write).

## Actual
Real output from the reproduction:
- With a write lock held by a second connection: `GET /api/health` -> `200 {"status":"ok",...}` (unaffected: WAL allows concurrent reads, which is correct SQLite behavior, not itself a bug) while `POST /api/guestbook` -> `500 {"error":{"code":"internal_error","message":"Internal server error.",...}}` after the 5 s `busy_timeout`. No SQL, path, or lock detail is in the response body (verified).
- With the entire data directory deleted while the server keeps running: both `GET /api/health` and `GET /api/guestbook` still return `200`, because the process's open file descriptor is unaffected by the directory entry's removal.

## Impact
Low. Nothing leaks and the affected write correctly returns a generic `500`, so there is no security exposure. The impact is operational/observability: a monitoring or deploy script that polls `/api/health` to decide "is the database OK" can see `200` while writes are actually failing (lock contention) or while the on-disk file has been deleted or is corrupted. This is worth knowing before B6 writes the runbook's health-check guidance.

## Suggested fix direction
Either (a) change `isDbHealthy` to run a query that actually touches storage, for example `SELECT COUNT(*) FROM guestbook_entries LIMIT 1` or a page-integrity check, so a locked/corrupted/missing file surfaces as `503`; or (b) keep `SELECT 1` (cheap, correct for its narrow purpose) and add one sentence to the API README/runbook stating plainly that `/api/health` verifies the connection handle only, not on-disk file integrity or write availability.

## Retest log
| Date | Commit | Result | Evidence and adjacent cases run |
|---|---|---|---|

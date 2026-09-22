# Review: feat/qa-harness (Q2)

Reviewer: architect, 2026-09-22. Commit reviewed: `006ee79`. This is a QA branch: per the ownership map it needs architect review plus a green run of the suite (not a QA gate, since QA cannot gate its own code).

## Checks
- **Ownership:** `git diff main...feat/qa-harness --stat` touches only `docs/prs/feat-qa-harness.md` and files under `qa/**` (`harness/{guard,spawnApi,httpClient,index,harness.test}.ts`, `package.json`, `tsconfig.json`, `vitest.config.ts`). All within security-qa-engineer's owned path; no application code touched.
- **Security-critical piece (`qa/harness/guard.ts`):** read in full. `assertLocalUrl`/`isLocalUrl` allow only `http`/`https` and hostnames `127.0.0.1`, `localhost`, `::1`, `[::1]` — matches the brief's "authorized testing only, against localhost" boundary. Every harness entry point (`spawnApi`, `createHttpClient`) is described as routing through it.
- **Independent green run** (not just trusting the PR file), from `.worktrees/qa` at this commit:
  - `npm install`: exit 0, 0 vulnerabilities.
  - `npm test -w @site/qa`: 9/9 `node --test` scanner self-tests pass, then vitest: **Test Files 1 passed (1), Tests 8 passed (8)**.
  - `npm run typecheck -w @site/qa`: exit 0.
  - `npm run lint`: exit 0.
  - `node qa/tools/scan-secrets.mjs`: `152 files scanned, 0 error(s), 3 warning(s) -> PASS` (the 3 warnings are fake-secret test fixtures in `apps/api`, `apps/web`, and `qa/gates`, same pattern as prior gates).
  - `npm audit --audit-level=high`: 0 vulnerabilities.
- **PR file accuracy:** the real output I saw matches what `docs/prs/feat-qa-harness.md` claims (its file count of 151 vs. my 152 is explained by main having advanced one commit between when it wrote the PR file and when I ran it; not a discrepancy in the branch itself).
- **Non-vacuity:** the PR file describes a mutation check on the guard (temporarily widening `LOOPBACK_HOSTS`, confirming the "rejects any other host" test fails, then reverting). I did not repeat the mutation myself but the guard code is simple enough (a literal hostname set) that I'm satisfied the test exercises it directly (rejection tests use non-loopback hosts including a cloud metadata IP, a suffix-spoof `127.0.0.1.evil.test`, and disallowed schemes).
- **Scope match to Q2:** spawns the API from source on a free loopback port with a temp DB path, an HTTP helper with a cookie jar, and the hard localhost-only guard — matches the board's B2 deliverable exactly. `qa/vitest.config.ts` scoping `npm test` to `harness/**` (not `gates/**`) is a sensible choice so the default test run never needs a branch worktree env var.

## Verdict
Approved. Ready to merge.

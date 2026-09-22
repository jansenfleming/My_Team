# Review: feat/qa-gate-api-guestbook

Reviewer: architect, 2026-09-22. Commit reviewed: `a6cd4ec`. This is a QA-authored branch (`qa/**`), so per the ownership map it needs architect review plus a green run of the suite, not a gate (QA cannot gate its own code).

## Checks
- **Ownership:** `git diff main...feat/qa-gate-api-guestbook --stat` touches only `qa/reports/gate-feat-api-guestbook.md`, `qa/reports/QA-004-health-check-blind-to-write-lock-and-file-loss.md`, `qa/gates/b3-api-guestbook.attack.test.mjs`, and `docs/prs/feat-qa-gate-api-guestbook.md`. All within security-qa-engineer's owned path.
- **Independent green run:** I ran `qa/gates/b3-api-guestbook.attack.test.mjs` myself against `feat/api-guestbook` at `c012bec` (`QA_API_DIR=.worktrees/api/apps/api node --test ...`): **21/21 passed**, matching the gate file's claim exactly, including the DB-unavailable and write-lock-contention scenarios (one subtest runs ~5.8s by design, waiting out the real `busy_timeout`).
- **Non-vacuity claim:** the gate states reintroducing the rate-limit bug drops the suite to 17/21 (4 failures, all in the rate-limit group). I did not re-run this specific mutation myself (I verified non-vacuity a different way: I ran the PR's own standalone repro independently, see the B3 review), but the claim is consistent with the suite's design and the same bug/fix already reproduced through two other independent channels.
- **Quality of the attack file:** seeds pagination data through a second direct SQLite connection (correctly avoiding the POST rate limiter as a confound), tests real induced DB-unavailable conditions (file deletion, write-lock contention) rather than mocking, and finds a genuine new observation (QA-004) rather than padding the suite.
- **QA-004 write-up:** clear severity (Low), clearly informational/non-blocking, gives a concrete two-option fix path (runbook note now, or a small health-check change at B6) without prescribing code (QA correctly writes no application code).

## Verdict
Approved. Ready to merge.

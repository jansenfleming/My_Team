# feat/qa-hygiene-tools: secret scanner and dependency audit baseline (Q4)

Author: security-qa-engineer. Branch: `feat/qa-hygiene-tools`. Base: `main` (scaffold merged). Unblocks B5 (CI workflows call `node qa/tools/scan-secrets.mjs`).

## What changed
- `qa/tools/scan-secrets.mjs`: dependency-free (Node built-ins only) secret scanner.
  - Default: scans tracked and untracked-not-ignored files (`git ls-files --cached --others --exclude-standard`); falls back to a directory walk outside git. Skips binaries and files over 2 MB.
  - `--history`: scans every added line across all refs, plus files that were ever added and match forbidden names.
  - `--path <p> ...`: scan chosen files or dirs (for `apps/web/dist`). `--json`, `--root`, `--fail-on-warn`, `--help`.
  - Rules: AWS key ids, GitHub tokens (classic and fine-grained), Slack, Stripe live, Google API, Anthropic and OpenAI-style keys, npm tokens, JWTs, private key blocks, credentials in URLs, generic `password/secret/token/api_key = "<value>"` assignments (entropy and placeholder filtered; bare `KEY=value` only in dotenv/ini/yaml-like files), and forbidden files (`.env` other than `.env.example`, key material, SQLite files).
  - Generic assignments in test/fixture/example paths are warnings (tests contain fake passwords); token-format matches always fail.
  - **Matched values are never printed**: output is rule, file:line, and `[REDACTED len=N]` (plus a non-secret token prefix for token formats). Source lines are never echoed.
  - Exit codes: 0 clean, 1 findings, 2 usage or internal error.
  - False positives: `secretscan:allow` in a same-line comment, or an entry with a mandatory written reason in `qa/tools/scan-secrets.allow.json` (not created; no allowlist is needed today).
- `qa/tools/scan-secrets.test.mjs`: 9 `node:test` cases (clean tree, planted secrets caught and not echoed, test-path warning vs failure, token in test path fails, allow marker and allowlist, allowlist without reason rejected, `--path`, `--history` on a temp repo with a committed-then-deleted secret, usage error). Fake secrets are assembled from fragments at runtime, so the repo never contains a matching literal.
- `qa/package.json`: scripts `test` (`node --test "tools/*.test.mjs"`), `scan:secrets`, `scan:secrets:history`. No dependencies added.
- `qa/reports/npm-audit-baseline.md`: audit baseline and gate policy.

## How to test (from the repo root or the worktree)
```
node qa/tools/scan-secrets.mjs               # working tree
node qa/tools/scan-secrets.mjs --history     # all commits
npm test -w @site/qa                         # scanner self-tests
npm audit --audit-level=high
```

## Real output (2026-09-21, Node 22.12.0, npm 11.6.1)

Clean tree passes:
```
$ node qa/tools/scan-secrets.mjs
scan-secrets [working-tree]: 39 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS
exit=0
$ node qa/tools/scan-secrets.mjs --history
scan-secrets [history]: 20 commits scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS
exit=0
```

Planted fake secrets in a throwaway untracked file inside the repo (`qa/tools/zz-planted-fake-secret.tmp.ts`, values assembled at runtime, file deleted afterward) are caught, with values redacted:
```
ERROR aws-access-key-id            qa/tools/zz-planted-fake-secret.tmp.ts:1  AKIA[REDACTED len=20]
ERROR github-token                 qa/tools/zz-planted-fake-secret.tmp.ts:2  ghp_[REDACTED len=40]
ERROR generic-secret-assignment    qa/tools/zz-planted-fake-secret.tmp.ts:3  key "password" = [REDACTED len=20]
scan-secrets [working-tree]: 40 files scanned, 0 skipped, 3 error(s), 0 warning(s) -> FAIL
exit=1
```
After `rm` of the planted file, the same command printed `39 files scanned ... -> PASS`, `exit=0`. Running it from `qa/tools/` (a subdirectory) gave the same PASS.

Self-tests:
```
$ npm test -w @site/qa
# tests 9
# pass 9
# fail 0
```
Mutation check (proves the tests can fail): with the AWS rule deliberately broken in a scratch edit, `npm test -w @site/qa` gave `# pass 6 / # fail 3` (tests 2, 4, 8 failed); the file was restored and the run returned to `# pass 9 / # fail 0`.

Dependency audit (details in `qa/reports/npm-audit-baseline.md`):
```
$ npm audit --audit-level=high
found 0 vulnerabilities
exit=0
```

Root suite from this worktree:
```
npm run lint         exit 0   (eslint . lints qa/tools/*.mjs cleanly)
npm run typecheck    exit 0   (no workspace defines it yet; vacuous)
npm test             exit 0   (only @site/qa defines it: # tests 9, # pass 9, # fail 0)
npm run build        exit 0   (no workspace defines it yet; vacuous)
```

## New dependencies
None.

## Not verified / limits
- The dependency baseline covers only root tooling (workspaces are stubs). It must be re-run when B1/B2/F1 land.
- Heuristics: the generic rule can miss short or low-entropy secrets and can flag high-entropy non-secrets; token-format rules are the reliable part. It is a tripwire, not a guarantee. A secret in a rewritten (force-pushed away) history, or in a file over 2 MB, is not seen.
- `--history` scans local refs only (no fetch, by rule).
- The scanner has not run inside GitHub Actions (no remote workflow exists yet); it is dependency-free and uses `git` from PATH, which the Actions runner provides. `actions/checkout` defaults to a shallow clone (depth 1), so B5 should set `fetch-depth: 0` for the `--history` run.

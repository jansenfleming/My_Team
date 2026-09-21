# QA Reports

Owner: Security / QA Engineer. Everything in this directory is written by QA only. Engineers read reports and fix root causes on their own branches; only QA marks a finding `verified`.

## File naming
| Kind | Path |
|---|---|
| Finding | `qa/reports/QA-<NNN>-<short-slug>.md` (NNN zero-padded, never reused) |
| Gate | `qa/reports/gate-<branch-slug>.md` (slug = branch with `/` replaced by `-`, e.g. `gate-feat-shared-contract.md`) |
| Baselines and reviews | `qa/reports/<topic>.md` (for example `npm-audit-baseline.md`, `security-review-mvp.md`) |

## Rules
- Never paste a real secret, cookie value, or password into a report. Record the file and line, and redact the value (for example `AKIA[REDACTED]`).
- Testing is limited to this repo and its own local instance on `127.0.0.1`. State the target in every reproduction.
- Paste real command output. If something was not run, write "Not verified" and why. Never claim a pass that was not seen.
- Severity scale: **Critical** (auth bypass, RCE, stored XSS reaching the operator session, secret exposure), **High** (significant data exposure, CSRF on admin routes, working brute-force or rate-limit bypass), **Medium** (missing defense in depth, low-value information disclosure), **Low** (hardening, minor), **Info** (observation, no action required).
- Status values: `open`, `fix-ready` (engineer says fixed, awaiting retest), `verified`, `not fixed`, `regression`, `wontfix` (Architect decision recorded), `invalid` (QA withdrew it, with reason).
- Who to message: the owning engineer (frontend for `apps/web/**`, backend for `apps/api/**`, `packages/**`, `infra/**`, `.github/**`, Architect for root config and docs) with the path of the report. Critical goes to `architect` too, immediately.

## Finding template

Copy into `qa/reports/QA-<NNN>-<slug>.md`.

````markdown
# QA-NNN: <one-line title>

- Severity: Critical | High | Medium | Low | Info
- Status: open
- Found: YYYY-MM-DD, against branch `<branch>` at commit `<short hash>`
- Owner to fix: frontend-engineer | backend-engineer | architect
- Affected: `<file path>` or `<METHOD /api/path>`
- Test case ID: <e.g. A-CSRF-3>, from qa/test-plan.md
- Target: local instance on 127.0.0.1:<port>, or static analysis of the repo

## Summary
Two sentences: what is wrong and what an attacker gains.

## Reproduction
Exact steps and commands, runnable from a fresh worktree of the branch above. Localhost only.

```
<commands>
```

## Expected
What the contract, ADR, or brief says should happen (cite the section).

## Actual
What happened, with real output (secrets redacted).

## Impact
Who is affected and how, in one short paragraph.

## Suggested fix direction
A direction, not a patch. QA does not edit application code.

## Retest log
| Date | Commit | Result (verified / not fixed / regression) | Evidence and adjacent cases run |
|---|---|---|---|
````

## Gate template

Copy into `qa/reports/gate-<branch-slug>.md`.

````markdown
# Gate: <branch>

- Verdict: PASS | FAIL
- Branch: `<branch>` at commit `<full hash>` (a gate covers this commit only)
- Author: <engineer>
- Gated by: security-qa-engineer, YYYY-MM-DD
- Worktree used: `.worktrees/qa-check-<slug>` (read-only, removed afterward)
- PR file reviewed: `docs/prs/<slug>.md`

## Verdict rule
FAIL if any of: open Critical or High finding, a failing test, a failing hygiene tool, or edits outside the author's owned paths. Medium and Low findings are listed but do not block.

## Commands run and real output
For each command: the exact command, exit code, and the relevant real output.

| Command | Exit | Result |
|---|---|---|
| `npm install` | | |
| `npm test` | | |
| `npm run typecheck` | | |
| `npm run lint` | | |
| `npm run build` | | |
| `node qa/tools/scan-secrets.mjs` | | |
| `npm audit --audit-level=high` | | |

```
<pasted output>
```

## QA cases run
List test-plan case IDs executed and their results. Note any that are not applicable yet.

## Ownership check
Files changed outside the author's owned paths (`git diff --stat main...<branch>`): none | list.

## Findings
| ID | Severity | Status | Path |
|---|---|---|---|

## Not verified
What could not be tested and why (for example: no real browser, dependency not merged yet).

## Recommendation to Architect
One or two sentences.
````

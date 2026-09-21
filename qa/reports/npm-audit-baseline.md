# npm audit baseline

- Date: 2026-09-21. Node v22.12.0, npm 11.6.1. Registry: the default npm registry (the only external service used, by `npm audit` alone).
- Tree audited: worktree `.worktrees/qa` on branch `feat/qa-hygiene-tools`, based on `main` at the scaffold (`chore/scaffold` merged). Workspaces are still stubs, so the dependency set is the root tooling only (eslint, typescript, typescript-eslint, concurrently, globals, `@types/node`).
- Status: this is a **baseline of a nearly empty tree**. It proves the tooling works and records the starting point; it says nothing yet about fastify, vite, react, zod, or better-sqlite3, which arrive with B1/B2/B3/F1.

## Commands and real output

```
$ npm audit --audit-level=high
found 0 vulnerabilities
exit=0

$ npm audit --omit=dev
found 0 vulnerabilities
exit=0

$ npm audit --json   (metadata block)
vulnerabilities: info 0, low 0, moderate 0, high 0, critical 0, total 0
dependencies:    prod 9, dev 131, optional 0, peer 5, peerOptional 0, total 139

$ npm outdated
@types/node  current 22.20.4  wanted 22.20.4  latest 26.6.2  (qa)
typescript   current 5.9.3    wanted 5.9.3    latest 7.0.2   (qa)
```

Both "latest" versions are deliberate holds (ADR 0001: Node 22 types, TypeScript 5.9). Not findings.

## Gate policy (for B5 and the standing gate task)

| Check | Command | Blocks a gate when |
|---|---|---|
| High/Critical advisories | `npm audit --audit-level=high` | exit code non-zero |
| Runtime-only view | `npm audit --omit=dev` | informational; a High in a runtime dependency is treated as more urgent than one in a build tool |
| Lower severities | `npm audit` | listed in the gate report, do not block |

Triage rule: a High or Critical advisory with no fix available, or one that does not apply to how the project uses the package, is not silently ignored. QA writes a finding (`QA-<NNN>`) stating the reachability reasoning, and the Architect records a `wontfix`/accept decision. Nothing is suppressed by editing tooling.

## Limits
- `npm audit` reports known advisories from the registry database only. It does not detect malicious new packages, typosquats, or unpatched zero-days.
- The audit needs registry access; in CI without network it fails closed (non-zero), which is the right behavior.
- Re-run at every dependency change; the first meaningful baseline will be recorded in the B1, B2, and F1 gate reports.

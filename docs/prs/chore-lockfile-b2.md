# chore/lockfile-b2: merge feat/api-core (B2) with a regenerated lockfile

Author: architect. Branch: `chore/lockfile-b2`. Base: `main` (6dc6df5). This PR carries `feat/api-core` (B2, gated PASS at 170d002) into `main`.

## Why a separate branch
`feat/api-core` was cut before PR #9 (vite 7 pin) and conflicts with `main` only in `package-lock.json`. Per the ownership map the Architect resolves lockfile conflicts on a `chore/lockfile-<n>` branch instead of editing the backend's branch (which would invalidate its gate).

## What changed
- A `--no-ff` merge of `feat/api-core` (commits 6c79c14, 75341fd, 170d002, the B2 PR file `docs/prs/feat-api-core.md`, and everything the gate reviewed) into `main`.
- `package-lock.json`: kept `main`'s file and re-ran `npm install`; nothing else was conflicted. No source file differs from `feat/api-core`.
- QA gate for the B2 content: `qa/reports/gate-feat-api-core.md` (PASS at 170d002; the gate branch is a separate PR, `feat/qa-gate-api-core`).

## Output seen (Node 22.12.0)
- `npm install`: 0 vulnerabilities. `npm ls vite`: no vite 8 anywhere.
- `npm test`: api 88, web 7, shared 243, qa 9 passed. `npm run typecheck`, `npm run lint` clean. `npm run build` succeeds. `npm audit --audit-level=high`: 0 vulnerabilities.

# Review: feat/web-shell (F1)

Reviewer: architect. Date: 2026-09-21. Commits reviewed: 725db41, 7346c34 (base 08e589b).

## Verdict
Architect review: **approved**. Merge: **held until `qa/reports/gate-feat-web-shell.md` says `Verdict: PASS`** (ownership-map rule 6).

## Checked
- Ownership: changes only `apps/web/**`, `docs/prs/feat-web-shell.md`, and `package-lock.json` (allowed lockfile diff). No files outside the owner's paths.
- Stack matches ADR 0001: vite ^7, plugin-react ^5, vitest ^5, jsdom ^28, react ^19; no router, state library, or UI kit. All dependencies are listed and justified in the PR file.
- Dev and preview servers bind `127.0.0.1` with `strictPort`; `/api` proxies to `127.0.0.1:3001` with the `Origin` header untouched (`changeOrigin: false`), which the contract's Origin check relies on.
- CSP-clean: `index.html` has one external module script, no inline handlers, no external origins; a test enforces this and the PR shows a negative check that the test fails when an inline script is added.
- Scripts `dev`, `build`, `preview`, `test`, `typecheck` follow the ADR conventions.
- PR file reports real output and states what was not verified (no browser, proxy tested against a stub).

## Notes (non-blocking)
- `<title>` is the placeholder "Web shell"; F5 replaces it with the Creative Director's name for the system.
- Dev server injects an inline React-refresh script; that is dev-only. QA's dist check must target `dist/`.
- `EBADENGINE` warning for `eslint-visitor-keys@5` (needs Node ^22.13): recorded in ADR 0001.

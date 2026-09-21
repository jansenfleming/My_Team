# docs/adr-0002-hosting: GitHub Pages, frontend only

Author: architect. Branch: `docs/adr-0002-hosting`. Base: `main` (6dc6df5). Docs only.

## What changed
- `docs/architecture/adr/0002-hosting.md` (new): the decision (static build on GitHub Pages at `https://jansenfleming.github.io/My_Team/`, API not deployed), rejected options, the requirements it creates for frontend (base path, hash-only routing, `VITE_UPLINK=off`, CSP meta), backend (`deploy-pages.yml`, `workflow_dispatch` only, minimal permissions, full-SHA pinning), and QA (Pages threat model), plus the owner and lead steps.
- `docs/architecture/roadmap.md`: Phase 3 records the decision; MVP scope and exit criteria mention the static build and the manual-only deploy workflow; Phase 2 gets the hosted-API option (cross-origin auth needs a threat-model review, contract v2, and an ADR first).
- `docs/architecture/board.md`: new tasks B7 (Pages workflow), F7 (static build), D7 (static-build copy amendment), Q7 (Pages threat model and static checks); A6 release-readiness now includes the first-publish approval flow; B6 gains QA-003 (transport-level errors in contract format) and an HSTS runbook note; F3 unchanged (it is already at review).

## Open dependency
Agents cannot query GitHub, so B7 needs the lead to supply full commit SHAs for `actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`.

## How to review
Read the diff. No code, no tests apply. Nothing publishes: the site keeps showing the README until the owner approves and the lead runs the workflow.

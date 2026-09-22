# chore/streetwear-pivot-cleanup: repo cleanup, stack decision, and MVP plan for ZeroJance

Author: architect. Branch: `chore/streetwear-pivot-cleanup`. Base: `main` (1add4cb, after
PR #27, `docs/pivot-streetwear`).

## What changed
This is the Architect's first task on the new ZeroJance project (`docs/project-brief.md`,
superseding the cybersecurity-terminal project). It reviews the repo, decides what's
reusable vs. dead weight, does the cleanup, and rewrites the planning docs for the new
three-role team. No product pages or final visual design were built — that's the
Creative Director's and Engineer's work from here.

**Removed** (dead weight tied to the superseded terminal/guestbook concept; kept in git
history, just not in the live tree — see `docs/architecture/adr/0003-streetwear-
pivot.md` for the full reasoning per area):
- `apps/api/**` — the Fastify + SQLite guestbook/auth API. No real backend is needed for
  a v1 mockup catalog per the owner's prompt.
- `packages/shared/**` — existed only to keep the API and web client in sync; nothing
  consumes it once the API is gone.
- `apps/web/src/{terminal,commands,content,api}/**` — the terminal engine, its command
  registry, terminal-specific content, and its API client.
- `qa/**` — the QA workspace (harness, attack-suite gates, reports, threat model), tied
  to the old API's threat model and the old five-role gate process. No standing QA role
  on this project (per the brief); the Architect does basic hygiene itself. The one
  reusable piece, `qa/tools/scan-secrets.mjs` (fully generic, zero-dependency), moved to
  `tools/scan-secrets.mjs` with its test, now run via `npm run scan-secrets` / `npm
  test`.
- `docs/design/{concept,easter-eggs,screens,terminal-commands,style-guide}.md`,
  `tokens.css`, `assets/**`, `tools/check-contrast.py` — all written for the terminal
  concept's voice and palette. The directory is now empty; the Creative Director starts
  fresh (kickoff doc tells them so explicitly).
- `docs/architecture/api-contract.md` — no API to contract in v1.
- Stale kickoff docs for roles that no longer exist:
  `docs/architecture/kickoff/{backend-engineer,frontend-engineer,security-qa-
  engineer}.md`.

**Not touched** (protected per the brief, or low confusion risk as-is): `docs/prs/**`
and `docs/architecture/adr/0001-*`/`0002-*` stay in the tree as history (added a short
`docs/prs/README.md` and a note at the top of each old ADR marking them superseded, so a
reader isn't misled into building against them). `docs/architecture/reviews/**` (old
Architect review notes) left as-is with a new `README.md` explaining they're historical.
`.claude/**` was **not** edited — see "Flagged for the lead" below.

**Rewritten**:
- `docs/architecture/adr/0003-streetwear-pivot.md` (new): the stack decision. Frontend
  only (Vite + React + TypeScript + Vitest, same versions as before — nothing about that
  choice was terminal-specific). Product data as a local typed module, not a database or
  fetched API. Mock cart as client-side state + `localStorage`, no server ever. Hosting
  deliberately not decided yet (GitHub Pages is the likely fit again, but that's its own
  ADR closer to ship).
- `docs/architecture/roadmap.md`, `docs/architecture/board.md`, `docs/architecture/
  ownership-map.md` — full rewrite for the new scope (catalog grid, product detail,
  lookbook, about, mock cart, 2-3 curated easter eggs; 6-12 products, shirts/
  sweatshirts/hats only) and the three-role roster. The board has 5 Creative Director
  tasks (D1-D5) and 7 Engineer tasks (E1-E7), each sized to one focused session, with a
  suggested wave order.
- `docs/architecture/kickoff/creative-director.md` (rewritten) and `docs/architecture/
  kickoff/engineer.md` (new) — self-contained enough to spawn either role immediately:
  scope, owned files, first tasks, and the hard constraints (mock-only cart, no
  fabricated facts about the owner, no external services).
- `README.md` — no longer describes the cybersecurity-terminal project.
- Root `package.json` (workspaces now just `apps/web`; dropped `concurrently`; `dev`
  runs only the web app; `test` also runs the relocated secret-scanner self-test),
  `eslint.config.js` (dropped the `apps/api/data` ignore and the stale QA/API comment),
  `.gitignore` (dropped SQLite/API-data entries).
- `apps/web/**`: `App.tsx`/`App.test.tsx` replaced with a minimal placeholder shell
  (main landmark, "ZeroJance" heading) so the tree stays buildable — this is
  intentionally not real product work, just enough for `npm run dev`/`build`/`test` to
  pass while the Creative Director and Engineer do the real build. `main.tsx` no longer
  imports the deleted content module. `vite.config.ts`/`config.test.ts` drop the `/api`
  proxy (no backend to proxy to). `index.html` title updated. `package.json` drops the
  `@site/shared` dependency.

## Stack decision (short version; full reasoning in ADR 0003)
Keep: npm workspaces, TypeScript strict, Vite + React + Vitest + Testing Library, ESLint
flat config, the branch → PR file → Architect review → lead merge process. Drop: the
API, the shared-schema package, the QA workspace, all terminal content. Product data:
local typed module. Cart: client-side mock only, honest in code and copy about what's
fake.

## How to review
Read `docs/architecture/adr/0003-streetwear-pivot.md` first — it's the record of every
decision here. Then `docs/architecture/{roadmap,board,ownership-map}.md` and the two
kickoff docs for the concrete plan. Diff `apps/web/**` for the minimal placeholder
shell. Confirm nothing under `docs/architecture/adr/0001-*`/`0002-*` or `docs/prs/**`
was deleted (only annotated/left alone).

## Checks run (fresh `npm install` after removing `apps/api`, `packages/shared`, `qa`)
```
$ npm install
added 307 packages, and audited 309 packages in 14s
found 0 vulnerabilities
(expected warnings only: eslint-visitor-keys EBADENGINE, eslint@9 deprecation — both
noted as known/harmless in ADR 0001 on this Node 22.12 baseline)

$ npm run lint
> eslint .
(clean, no output)

$ npm run typecheck
> tsc --noEmit -p tsconfig.json   (apps/web only now)
(clean, no output)

$ npm test
> @site/web test: vitest run
 Test Files  3 passed (3)
      Tests  7 passed (7)
> node --test tools/*.test.mjs
# tests 9
# pass 9
# fail 0

$ npm run build
> @site/web build: vite build
✓ 29 modules transformed.
dist/index.html                 0.48 kB │ gzip:  0.30 kB
dist/assets/index-*.css         0.19 kB │ gzip:  0.17 kB
dist/assets/index-*.js        222.73 kB │ gzip: 69.41 kB
✓ built in 472ms

$ npm run scan-secrets
scan-secrets [working-tree]: 88 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
found 0 vulnerabilities
```

## Flagged for the lead (not done in this branch — out of scope for a spawned worktree)
`.claude/agents/{architect,creative-director,frontend-engineer,backend-engineer,
security-qa-engineer}.md` are subagent-type definitions still describing the old
five-role cybersecurity-terminal team. I did not edit them (touching `.claude/**`
wasn't part of my task and felt outside a cleanup branch's remit). Recommend the lead
reconcile them with the new roster (rewrite `architect.md`/`creative-director.md`,
merge `frontend-engineer.md` + `backend-engineer.md` into a new `engineer.md`, retire
`security-qa-engineer.md`) before relying on them for a real team spawn — otherwise a
teammate spawned via those definitions would load stale, contradictory context.

## Status
Ready for lead review and merge. No product pages, visual design, or copy were built —
per scope, this is the plan; D1/E1 are the next tasks once the Creative Director and
Engineer are spawned.

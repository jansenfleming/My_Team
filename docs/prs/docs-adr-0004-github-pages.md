# docs/adr-0004-github-pages: GitHub Pages hosting decision (ADR 0004)

Author: architect. Branch: `docs/adr-0004-github-pages`. Base: `main` (`c648db0`, after
PR #72 — the founder-story content follow-up, the last merge before this task).

## What changed

Phase 2 backlog Rank 3 (`docs/architecture/phase-2-backlog.md`), the hosting decision
ADR 0003 explicitly deferred to "when the build is close to shippable" — the lead
confirmed that point has arrived (D1-D5, E1-E7, A1-A3 all done, plus the founder-story
follow-up) and asked for the ADR.

New file:
- `docs/architecture/adr/0004-github-pages-hosting.md` — decides and specifies, does not
  implement:
  1. Confirms GitHub Pages as the host (static, free, no backend — same reasoning ADR
     0002 used and ADR 0003 anticipated).
  2. Decides switching the repo's Pages source from the current legacy "Deploy from a
     branch" Jekyll builder (confirmed by the lead to be live today, rendering the
     README via Jekyll's default theme at `https://jansenfleming.github.io/My_Team/`,
     not the app) to a GitHub Actions-based deploy that builds `apps/web` and uploads
     only its `dist/` output. Researches and confirms the `.nojekyll` question the lead
     flagged: yes, an empty `.nojekyll` file in the deployed artifact is still standard
     practice under Actions-based deploys (GitHub's Pages *serving* layer, not just the
     legacy build step, still applies Jekyll's underscore-prefix convention unless
     `.nojekyll` is present) — and flags a sharper, more concrete gotcha found during
     that research: `actions/upload-pages-artifact` v4+ excludes dotfiles from the
     uploaded artifact by default, so the workflow needs `include-hidden-files: true` or
     the `.nojekyll` file will be silently dropped.
  3. Specifies the Vite `base` fix for the `/My_Team/` project-page subpath, conditioned
     on the `GITHUB_ACTIONS` env var so local `npm run dev`/`npm run build` stay
     unaffected.
  4. Specifies the standard "spa-github-pages" 404-redirect pattern (a `404.html` copy
     of `index.html` plus a redirect-via-querystring script) for GitHub Pages' lack of
     server-side rewrites, and confirms — by reading the current
     `apps/web/src/router/{Router.tsx,matchRoute.ts}` — that both files read/write
     `window.location.pathname` with no basename concept today, so they need a shared
     basename (derived from `import.meta.env.BASE_URL`, which Vite sets automatically
     from the `base` config, so there's one source of truth) applied consistently in
     `Link`, `navigate()`, `currentPathname()`, and the 404-decode step.
  5. Explicitly scopes itself to decision + specification: no `vite.config.ts`, router,
     `404.html`, or workflow YAML changes in this branch. A kickoff note (§5) specifies
     exactly what the follow-up Engineer task needs to touch and verify.
  6. Records rejected alternatives: a custom domain (not requested, skip for now),
     another static host (Netlify/Vercel — no reason to switch off an already-half-
     configured free host), and `HashRouter`-style `#/path` routing (rejected in favor of
     fixing the base-path/fallback problem properly, since the existing path-based
     router already works and switching strategies now is more disruptive than the fix).

Changed files (routine board/backlog upkeep, not part of the ADR's substance):
- `docs/architecture/board.md` — added task `E8` ("Implement GitHub Pages hosting (ADR
  0004)", `todo`, blocked on this ADR merging) and a new "Phase 2, started 2026-09-27"
  wave entry recording this ADR's status.
- `docs/architecture/phase-2-backlog.md` — Rank 3 entry now notes the ADR is written and
  points at the ADR file and board task E8.

## Independent verification performed

- Read `docs/architecture/adr/0003-streetwear-pivot.md` (the hosting section it
  deferred), `docs/architecture/phase-2-backlog.md` Rank 3, `docs/architecture/mvp-
  readiness.md`, `docs/architecture/adr/0002-hosting.md` (the old project's hosting ADR,
  used as a format/precedent reference — its base-path/no-server-routing requirements
  for the same project-page URL shape carried over directly), `docs/architecture/
  ownership-map.md`, `docs/architecture/roadmap.md`, and `docs/architecture/board.md` in
  full.
- Read the current `apps/web/vite.config.ts`, `apps/web/src/router/matchRoute.ts`, and
  `apps/web/src/router/Router.tsx` directly (not assumed from memory of the design docs)
  to confirm neither has any basename/base-path handling today — both read/write
  `window.location.pathname` unprefixed.
- Confirmed local `main` matches `origin/main` at `c648db0` before branching (`git fetch
  origin main`, compared SHAs).
- Researched the `.nojekyll`-under-Actions-deploy question via web search rather than
  asserting it from memory, per the lead's explicit ask to "research/decide this."
  Confirmed via GitHub's own "Bypassing Jekyll on GitHub Pages" blog post and the
  `actions/upload-pages-artifact`/`actions/deploy-pages` project pages: `.nojekyll` is
  still standard/recommended under Actions-based deploys, and found the additional
  `upload-pages-artifact` v4+ dotfile-exclusion behavior (not something the lead's task
  description mentioned — a genuinely new finding worth flagging to whoever writes the
  workflow).

## Testing

Documentation-only change (ADR + board/backlog updates). No code, config, or workflow
files were added or modified — per the lead's explicit instruction, this task is
decision and specification only. No test suite applies; `npm run typecheck`/`lint`/
`test`/`build` are unaffected by this branch (verified nothing under `apps/web/**` or
`.github/**` was touched: `git diff --stat main` shows only files under `docs/`).

## New dependencies

None.

## Notes for the lead

Per the task instructions, this branch is not pushed and no PR is opened — reporting the
branch name (`docs/adr-0004-github-pages`) back for your own sanity-check pass, same as
A1/A3. The follow-up Engineer task (board `E8`) is fully specified in ADR 0004 §5 and
can start as soon as this ADR is merged.

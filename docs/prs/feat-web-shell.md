# feat/web-shell: app shell and client-side routing (E1)

Author: engineer. Branch: `feat/web-shell`. Base: `main` (f44f356, after PR #29,
`chore/agent-roster-reconcile`).

## What changed
Board task E1 (`docs/architecture/board.md`): the `apps/web` app shell — client-side
routing for all 6 route shapes, a mobile-first responsive layout skeleton, and
placeholder copy/nav until the Creative Director's specs (D1-D4) land. No product data,
cart, lookbook/about content, or easter eggs — those are E2-E6, scoped separately on the
board.

**Routing — `src/router/matchRoute.ts` + `src/router/Router.tsx`**
Chose a minimal hand-rolled router over a library (e.g. `react-router-dom`):
- Route matching (`matchRoute`) is a pure function from `pathname` to a discriminated
  union (`home | catalog | product | lookbook | about | not-found`), trivial to unit test
  with no rendering involved.
- `RouterProvider` holds the current `pathname` in React state, seeded from
  `window.location.pathname` and kept in sync via a `popstate` listener.
- `Link` is a real `<a href>` that calls `history.pushState`/`replaceState` and
  intercepts only plain left-clicks — modified clicks (ctrl/cmd/shift/middle-click) fall
  through to normal browser behavior so "open in new tab" still works.
- Why hand-rolled: for ~6 static route shapes on a frontend-only mockup, this adds zero
  dependencies, keeps the bundle small, and is easy to reason about end to end. If
  routing needs grow later (nested layouts, real query-string handling, scroll
  restoration), swapping in a library is a small, contained change — nothing else in the
  app depends on the router's internals beyond the `Link`/`useRouter` exports.

**Layout — `src/layout/Layout.tsx` + `src/index.css`**
- Skip link, a header with a brand wordmark and a nav that collapses behind a real
  `<button>` (`aria-expanded`/`aria-controls`) below the 640px breakpoint and sits inline
  above it — no JS media-query duplication, CSS handles the breakpoint switch.
  `aria-current="page"` marks the active nav link.
  Skeleton is mobile-first: 2 columns below 640px, 3 at 640px+, 4 at 960px+.
- `prefers-reduced-motion: reduce` disables the nav's collapse transition.
- One `<main id="main-content">` landmark per page; footer carries an explicit,
  non-final mock-cart honesty line plus a `[PLACEHOLDER: ...]` marker for the Creative
  Director's real footer copy.

**Pages — `src/pages/*.tsx`**
Six placeholder pages (Home, Catalog, Product, Lookbook, About, NotFound), each a small
component with a heading and a note on which later board task replaces it. The Catalog
page renders an already-responsive grid-shaped skeleton (no data yet — that's E2). The
product route is `/product/:slug` and renders the slug it received, proving the dynamic
route shape resolves without any product data module yet (E3). About/NotFound both note
where a Creative-Director-specified joke 404 / real brand copy will land later (E5/E6);
neither invents any fact about the owner or brand.

**`src/App.tsx`**: wires `RouterProvider` + `Layout` + a `Pages` switch over
`matchRoute`, and sets `document.title` per route.

**`apps/web/README.md`**: rewritten — it still described the old terminal project
(Frontend Engineer role, F1-F6 tasks, an `/api` proxy that no longer exists). Now
documents the actual dev/build/test commands, the router choice, and the no-network-call
rule.

No changes to `vite.config.ts`, `tsconfig.json`, `index.html`, or `package.json` — the
existing config already fits (loopback-only dev/preview server, no proxy, strict CSP
test already in place).

## New dependencies
None. Routing uses only the History API and React (already present). Tests use
`@testing-library/user-event`, already a devDependency, to exercise click-navigation and
back/forward.

## How to test
```
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run scan-secrets
npm run audit:ci
```
Manual: `npm run dev -w @site/web`, then visit `/`, `/catalog`, `/product/<anything>`,
`/lookbook`, `/about`, and an unknown path — all render; nav links and back/forward work
without a full page reload.

## Real command output (run in `.claude/worktrees/agent-a600347ad4d62e45a`, Node v22.12.0)

```
$ npm install
npm warn EBADENGINE Unsupported engine { package: 'eslint-visitor-keys@5.0.1', ... }
npm warn deprecated eslint@9.39.5: This version is no longer supported. ...
added 307 packages, and audited 309 packages in 2s
found 0 vulnerabilities
(both warnings pre-exist on this Node 22.12 baseline per ADR 0001; unrelated to this branch)

$ npm run typecheck
> zerojance-site@0.0.0 typecheck
> npm run typecheck --workspaces --if-present
> @site/web@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json
(clean, no output)

$ npm run lint
> zerojance-site@0.0.0 lint
> eslint .
(clean, no output)

$ npm test
> zerojance-site@0.0.0 test
> npm run test --workspaces --if-present && node --test tools/*.test.mjs
> @site/web@0.0.0 test
> vitest run
 RUN  v5.0.1 .../apps/web
 Test Files  4 passed (4)
      Tests  25 passed (25)
   Start at  18:45:20
   Duration  878ms
# tools/*.test.mjs (scan-secrets self-test, unrelated to this branch, run by root `npm test`)
# tests 9
# pass 9
# fail 0

$ npm run build
> zerojance-site@0.0.0 build
> npm run build --workspaces --if-present
> @site/web@0.0.0 build
> vite build
vite v7.3.6 building client environment for production...
✓ 38 modules transformed.
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-B8Te94on.css    2.22 kB │ gzip:  0.94 kB
dist/assets/index-IDxxx1Bq.js   227.73 kB │ gzip: 71.07 kB
✓ built in 435ms

$ npm run scan-secrets
scan-secrets [working-tree]: 98 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
found 0 vulnerabilities

$ npm run dev -w @site/web (backgrounded), then curl each route
/ -> 200
/catalog -> 200
/product/circuit-hoodie -> 200
/lookbook -> 200
/about -> 200
/nope -> 200
(Vite's dev server serves index.html for unrecognized paths, which is exactly the
SPA-fallback behavior this client-side router needs; confirms the same 6 shapes work
through an actual HTTP request, not just in jsdom.)
```

Test breakdown (25 in `@site/web`): `src/router/matchRoute.test.ts` (10 — pure route
matching, trailing slash, encoded slug, missing-slug fallback), `src/App.test.tsx` (10 —
one smoke test per route shape plus `document.title`, click-navigation, browser
back/forward, `aria-current`, no injected `<script>`/`<iframe>`), `src/config.test.ts`
(2, pre-existing, untouched), `src/index-html.test.ts` (3, pre-existing, untouched — the
no-inline-script CSP test named in the board's done criteria still passes).

## Known follow-ups (not this branch)
- Client-side `pushState` routing needs a static-host fallback (e.g. GitHub Pages'
  404.html-redirect trick) once hosting is decided — noted in ADR 0003 as a decision to
  make later, not guessed here.
- Nav links are currently Catalog/Lookbook/About; Home is reachable via the brand
  wordmark. The Creative Director may want a different nav shape in D1 — happy to adjust
  once that spec exists.

## Status
Ready for Architect review. Board status for E1: `todo` -> please move to `review`.

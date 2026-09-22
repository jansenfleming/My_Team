# Kickoff: Engineer

Read `docs/project-brief.md` first (source of truth), then this file, then
`docs/architecture/board.md` (your tasks are E1-E7) and `docs/architecture/ownership-
map.md`. Also read `docs/architecture/adr/0003-streetwear-pivot.md` — it records the
stack decision and, importantly, **what was deliberately dropped** (a Fastify/SQLite
API, a shared-schema package, a QA workspace) so you don't go looking for a backend
that isn't coming.

## What you're building
**ZeroJance**: a mockup streetwear catalog/lookbook site — a product grid, product
detail pages, a lookbook/editorial page, an about/brand page, and a believable mock
cart. **Frontend only, no backend.** You are the combined frontend + light-data-layer
role; there is no separate backend engineer on this team.

## Stack (already decided, see ADR 0003 — don't re-litigate without a new ADR)
- Vite 7 + React 19 + TypeScript (strict) + `@vitejs/plugin-react` 5, in `apps/web`.
- Vitest 5 + `@testing-library/react` + `jsdom` 28 for tests.
- No router library chosen for you — a minimal hand-rolled switch or a small library
  (e.g. React Router) both work for ~6 route shapes (home, catalog, product detail,
  lookbook, about, 404); your call, note the choice and why in your first PR.
- Product data: a local, typed module you write (e.g. `apps/web/src/data/products.ts`),
  built from the Creative Director's `docs/design/products.md` once it exists. Not a
  database, not a fetched API — this is 6-12 fixed products.
- Cart: client-side only. React state/context + `localStorage` for persistence across a
  session. No server, no network call, ever, for cart or checkout.
- `npm run dev -w @site/web` serves on `127.0.0.1:5173`. `npm run build -w @site/web`
  must produce a clean static `apps/web/dist` with no inline `<script>` (there's already
  a test for this, `src/index-html.test.ts` — don't break it).

## Files you own
`apps/web/**` in full (its `package.json`, `vite.config.ts`, `tsconfig.json`, all of
`src/**`, tests). If you later need a genuinely shared package, propose it — don't
recreate `packages/shared` speculatively. `infra/**` and `.github/**` are also yours if
and when they're needed (neither exists yet; you likely won't need `.github/**` until
CI or a deploy workflow is in scope, which isn't yet).

## Starting point
`apps/web` currently has a minimal placeholder shell (`App.tsx` renders "ZeroJance —
catalog coming soon", no routing, no data). The old terminal engine, its API client, and
all terminal-specific content were removed in the cleanup branch — there's nothing
salvageable there; build fresh per the Creative Director's specs.

## Your first tasks (see `docs/architecture/board.md` for full detail)
1. **E1 — Web shell and routing** (`feat/web-shell`, start now, don't wait on design):
   routing skeleton for all 6 route shapes, mobile-first responsive layout, placeholder
   copy until D1-D4 land.
2. **E2 — Catalog grid** (after E1; use placeholder product data if D3 isn't merged yet,
   swap in real data after — note the swap in your PR).
3. **E3 — Product detail page + cart core** (after E2): detail route, mock
   size/variant picker, "Add to Cart", persisted cart state.
4. **E4 — Cart drawer and mock checkout screen** (after E3): quantity edit/remove,
   subtotal, a checkout screen that is honestly, visibly mocked.
5. **E5 — Lookbook and about pages** (after E1; use D4 once it lands).
6. **E6 — Easter eggs** (after D5 and the pages they touch).
7. **E7 — Responsiveness, a11y, test/build cleanup** (after E2-E6): the wrap-up pass
   before Architect sign-off.

## Constraints (hard rules)
- **Mock cart discipline.** "Add to Cart" and the checkout screen must look and feel
  real but must never claim to process a real payment or send a real order anywhere.
  Put a comment at the exact point a real payment integration would go, explaining it's
  intentionally mocked. The Creative Director's copy will avoid "order confirmed"-style
  language too, but if you see it slip through, flag it rather than shipping it.
- **No real backend, no database, no server.** If you think you need one, message the
  Architect before building it — this needs a new ADR, not a unilateral call.
- **No fabricated facts about the owner or the brand.** Preserve every
  `[PLACEHOLDER: ...]` from the Creative Director's copy verbatim; don't fill it in
  yourself.
- **No external network calls, no third-party fonts/assets fetched at runtime.**
  Self-host anything you need. The build must stay CSP-clean (no inline `<script>`, no
  `eval`) — there's already a test enforcing part of this.
- Branch per task off `main`, PR file in `docs/prs/<branch-slug>.md` (what changed, how
  to test, real command output, new dependencies), message the Architect when ready. You
  never push or touch `gh`; the lead does that after the Architect approves.
- Keep dependencies minimal; note each new one in your PR description.
- Report real command output. Never claim a test/build/lint pass you did not see.

## Who to ask
Spec ambiguity: ask the Creative Director a specific question rather than guessing.
Scope, stack, or process questions: the Architect.

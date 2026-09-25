# Phase 1 Task Board (MVP)

Owner: Architect. This file is the source of truth for task state (the native task list
is unavailable). Teammates report status by message; the Architect updates this file
after each merge. Read the main checkout's copy, not your worktree's.

Rewritten 2026-09-22 for the three-role ZeroJance roster and the streetwear-catalog
scope. Supersedes the prior board (terminal/guestbook project); see
`docs/architecture/adr/0003-streetwear-pivot.md`.

Status values: `todo`, `in-progress`, `review` (PR file written, waiting on Architect),
`approved` (Architect approved, waiting for the lead to merge the real PR), `done` (lead
confirmed the merge to `main`). Every task is done only when: owner's own tests/checks
pass with real output in the PR file, Architect reviewed (including basic hygiene) and
approved, and the lead merged the real PR (`gh pr merge --merge`). Process details:
`ownership-map.md`.

Names: `architect`, `creative-director`, `engineer`. Worktree dirs: `.worktrees/{design,web}`.

Site/brand name: **ZeroJance**. No product-copy voice or palette carries over from the
old cybersecurity-terminal project (ADR 0003).

## Index
| ID | Owner | Title | Depends on | Status |
|---|---|---|---|---|
| A1 | architect | Repo cleanup, stack decision, plan (this task) | none | done |
| A2 | architect | Ongoing review, merge, and basic hygiene | every branch | ongoing |
| A3 | architect | MVP readiness report and Phase 2 board | all below | todo |
| D1 | creative-director | Brand identity and voice | none | done |
| D2 | creative-director | Design tokens and style guide | D1 | done |
| D3 | creative-director | Product concepts and copy (6-12 items) | D1 | done* |
| D4 | creative-director | Lookbook and about-page copy/spec | D1 | done |
| D5 | creative-director | Easter-egg specs (curated 2-3) | D1, D3 | done |
| E1 | engineer | Web shell and routing | none | approved |
| E2 | engineer | Catalog grid | E1, D3 (data), D2 (styling) | done |
| E3 | engineer | Product detail page + cart core | E2 | done |
| E4 | engineer | Cart drawer and mock checkout screen | E3 | done |
| E5 | engineer | Lookbook and about pages | E1, D4, D2 | done |
| E6 | engineer | Easter eggs implementation | D5, relevant pages merged | done |
| E7 | engineer | Responsiveness, a11y pass, test cleanup | E2-E6 | approved |

## Suggested waves (parallel starts)
1. ~~**Start now:** D1 (brand identity)~~ — D1 **done**, merged to `main` (PR #30, review
   PR #31; `docs/architecture/reviews/feat-design-brand.md`). E1 (web shell — build
   against placeholder copy/data, restyle once D2 lands) proceeded in parallel.
2. **Now that `feat/design-brand` is merged:** D2, D3, D4 can all start (independent of
   each other). E2 can start once E1 merges, using placeholder product
   data if D3 isn't merged yet — swap in real data when it lands.
   **E1 status:** done, merged to `main` (PR #33, review PR #34) — see
   `docs/architecture/reviews/feat-web-shell.md`. E2 can start now.
   **D2 status:** done, merged to `main` (PR #38, review PR #39) — see
   `docs/architecture/reviews/feat-design-tokens.md`. E2/E5 can use real tokens now.
   **E2 status:** `approved` — Architect review 2026-09-24 (`feat/web-catalog-grid`, PR
   file `docs/prs/feat-web-catalog-grid.md`), no required changes. Full findings:
   `docs/architecture/reviews/feat-web-catalog-grid.md`. Waiting on the lead to push/merge
   the real PR; E3 can start once that merge lands.
3. After D2 + D3 + E2 merge: E3. After D3 (+ D1) merges: D5.
   **D5 status:** approved, waiting for the lead to merge — see
   `docs/architecture/reviews/feat-design-eggs.md`. E6 (and the `ProductPage`-lookup
   part of E3) can start once this merges and each egg's target page(s) are also merged.
4. After E3 merges: E4. After D4 (+ D2) merges: E5. After D5 (+ its target pages) merges: E6.
   **E6 status:** `approved` — Architect review 2026-09-25 (`feat/web-easter-eggs`, PR
   file `docs/prs/feat-web-easter-eggs.md`), no required changes; traced the Konami
   sequence-matcher and the `ProductPage` gating logic directly, confirmed 128/128 tests
   and a clean `dist/index.html` build myself. Full findings:
   `docs/architecture/reviews/feat-web-easter-eggs.md`. Waiting on the lead to push/merge
   the real PR (reviewed in isolation from `feat/web-checkout`/E4, which is under
   separate concurrent review; merge ordering between the two is the lead's call).
   **D4 status:** approved, waiting for the lead to merge — see
   `docs/architecture/reviews/feat-design-pages.md`. E5 can start once this merges (E1
   and D2 are already merged).
   **E3 status:** `approved` — Architect review 2026-09-24 (`feat/web-product-cart`, PR
   file `docs/prs/feat-web-product-cart.md`), no required changes; includes verification
   of the `hiddenProduct.id` -> `"200-ok"` fix (commit `fcc14e3`) requested directly by
   the lead. Full findings: `docs/architecture/reviews/feat-web-product-cart.md`. Waiting
   on the lead to push/merge the real PR; E4 can start and E6's `ProductPage`-lookup
   dependency is satisfied once that merge lands.
   **E5 status:** `approved` — Architect review 2026-09-24 (`feat/web-lookbook-about`, PR
   file `docs/prs/feat-web-lookbook-about.md`), no required changes. Full findings:
   `docs/architecture/reviews/feat-web-lookbook-about.md`. Waiting on the lead to
   push/merge the real PR.
   **E4 status:** `approved` — Architect review 2026-09-25 (`feat/web-checkout`, PR file
   `docs/prs/feat-web-checkout.md`), no required changes. Full findings:
   `docs/architecture/reviews/feat-web-checkout.md`. Waiting on the lead to push/merge
   the real PR. A deferred a11y gap (cart drawer focus trap) is carried forward to E7 —
   see that task's entry below.
5. After E2-E6 merge: E7, then A3.
   **E7 status:** `approved` — Architect review 2026-09-25 (`feat/web-polish`, PR file
   `docs/prs/feat-web-polish.md`), no required changes; traced the `CartDrawer.tsx`
   cyclic Tab/Shift+Tab focus trap directly (live-computed focusable set, correct wrap
   at all four boundary cases, no trap while closed), confirmed both the unit-level and
   header-integration focus tests actually test the claimed keyboard-escape scenario,
   confirmed the `color-scheme` meta fix, the header `flex-wrap` fix, and all 5
   `repeat(N, minmax(0, 1fr))` grid call sites, and re-ran all 7 checks myself
   (157/157 tests across 17 files, clean typecheck/lint/build/scan-secrets/audit).
   Full findings: `docs/architecture/reviews/feat-web-polish.md`. Waiting on the lead to
   push/merge the real PR; A3 (MVP readiness report) can start once this merges, since
   E2-E7 are now all approved or done.

Blocked work should do its non-blocked part first (Creative Director can draft copy
against the roadmap without waiting on tokens; Engineer can build structure against
placeholder content) and message the Architect if idle.

\* D3 (`feat/design-products`): PR file at `docs/prs/feat-design-products.md`. First-pass
  Architect review 2026-09-24 requested one fix (a `git blame` output format mislabeled
  as "porcelain" instead of "default"). Creative Director fixed it on commit `6b5972c`;
  Architect re-reviewed the same day and **approved**. Full findings:
  `docs/architecture/reviews/feat-design-products.md`. Merged to `main` (PR #35, review
  PR #36). D5 can start now.

---

## Creative Director (worktree `.worktrees/design`)

### D1 Brand identity and voice
- Owner: creative-director. Depends: none. Branch: `feat/design-brand`.
- Deliverable: a short `docs/design/concept.md` — the ZeroJance premise (streetwear
  brand making tech/programming/networking in-jokes wearable), voice guide with
  do/don't sample lines for product copy, three specific things that keep the site from
  looking like a generic streetwear template, and an explicit list of easter-egg ideas
  from the brief considered, with which 2-3 are picked for D5 and why the rest are
  deferred. Any fact about the owner or the brand's founding is `[PLACEHOLDER: ...]`.
- Done when: fits the MVP scope in `roadmap.md`; Architect review.

### D2 Design tokens and style guide
- Owner: creative-director. Depends: D1. Branch: `feat/design-tokens`.
- Deliverable: `docs/design/tokens.css` (CSS custom properties: exact hex colors,
  spacing scale, type scale, motion durations/easings), `docs/design/style-guide.md`
  (usage rules, a contrast table with computed ratios — body text >= 4.5:1, large
  text/UI >= 3:1). System font stack or a self-hosted font only (no third-party font
  requests). Streetwear + tech aesthetic (bold type, grid/circuit motif, monospace
  accents) — explicitly not the old cyberpunk-terminal palette.
- Done when: every text/background pair used is in the contrast table; Architect review.

### D3 Product concepts and copy
- Owner: creative-director. Depends: D1. Branch: `feat/design-products`.
- Deliverable: `docs/design/products.md` — 6 to 12 products total, shirts/sweatshirts/
  hats only (no accessories), each with: name, category, price (mock, in USD), a short
  description with a tech/programming/networking in-joke, 1-3 tags, and any special copy
  (e.g. a care label styled like a config file, if picked as part of D5/tag flavor).
  Note which products (if any) are only reachable via an easter egg (e.g. a hidden 13th
  product) so the Engineer knows not to list it in the main grid.
- Done when: every product fits shirts/sweatshirts/hats; count is 6-12; Architect review.

### D4 Lookbook and about-page copy/spec
- Owner: creative-director. Depends: D1. Branch: `feat/design-pages`.
- Deliverable: `docs/design/lookbook.md` (a small editorial/lookbook layout spec:
  sections, image/copy pairing, tone) and `docs/design/about.md` (brand story copy with
  `[PLACEHOLDER: ...]` for anything about the owner or founding not yet supplied).
- Done when: an engineer could build both with no follow-up questions; Architect review.

### D5 Easter-egg specs
- Owner: creative-director. Depends: D1, D3. Branch: `feat/design-eggs`.
- Deliverable: `docs/design/easter-eggs.md` — for each of the 2-3 picked eggs: exact
  trigger, exact output/content, discoverability hint, and which page(s) it touches.
  Client-side only, harmless, no external calls or assets.
- Done when: each egg is buildable in well under a day of engineer work; Architect review.

---

## Engineer (worktree `.worktrees/web`)

### E1 Web shell and routing
- Owner: engineer. Depends: none. Branch: `feat/web-shell`.
- Deliverable: `apps/web` app shell: client-side routing for home/catalog/product-
  detail/lookbook/about/404 (a minimal hand-rolled switch or a small router — engineer's
  call), mobile-first responsive layout skeleton, placeholder copy/nav until D1-D4 land.
- Done when: `npm run dev -w @site/web` serves all routes; `npm run build -w @site/web`
  succeeds; a smoke test per route; PR lists each new dependency.

### E2 Catalog grid
- Owner: engineer. Depends: E1; D3 for real data (start with placeholder data if D3
  isn't merged yet); D2 for real styling (placeholder styling otherwise).
- Deliverable: a typed product-data module (e.g. `apps/web/src/data/products.ts`) built
  from D3, and a responsive product grid on the home/catalog route (image or styled
  placeholder, name, price, category).
- Done when: all 6-12 products render; grid is responsive (mobile through desktop);
  tests cover empty/edge cases (e.g. missing image falls back cleanly); PR notes swap-in
  of real data/styling if it landed after this branch started.

### E3 Product detail page + cart core
- Owner: engineer. Depends: E2. Branch: `feat/web-product-cart`.
- Deliverable: a per-product detail page (route per product), a mock size/variant
  picker, an "Add to Cart" action, and cart state (React context or similar) that
  persists across the session (e.g. `localStorage`).
- Done when: adding an item updates a visible cart count; tests cover add/duplicate/
  remove-by-navigating-away-and-back (persistence); PR states plainly this is a mock
  cart with no server.

### E4 Cart drawer and mock checkout screen
- Owner: engineer. Depends: E3. Branch: `feat/web-checkout`.
- Deliverable: a cart drawer or page (quantity edit, remove, subtotal) and a "checkout"
  screen that looks real but is explicitly mocked in code (a comment at the point a real
  payment integration would go) and in copy (no claim of a processed payment or a sent
  order).
- Done when: quantity edit/remove work and recompute the subtotal; checkout screen
  renders and does not attempt any network call; tests cover the cart math; PR is
  explicit about what's mocked.
- Status: `approved` — Architect review 2026-09-25, no required changes. Full findings:
  `docs/architecture/reviews/feat-web-checkout.md`.

### E5 Lookbook and about pages
- Owner: engineer. Depends: E1, D4 (placeholder copy otherwise), D2 for styling.
- Deliverable: the lookbook/editorial page and the about/brand page per D4's spec.
- Done when: both pages render per spec; `[PLACEHOLDER: ...]` markers from D4 are
  preserved verbatim (not filled in by the engineer); Architect review.

### E6 Easter eggs implementation
- Owner: engineer. Depends: D5, and whichever pages each egg touches (per D5) already
  merged. Branch: `feat/web-easter-eggs`.
- Deliverable: the 2-3 eggs from D5, exactly as specified (trigger, output,
  discoverability).
- Done when: a test per egg proves the trigger produces the specified output; no
  external calls; Creative Director has no open blocking feedback.

### E7 Responsiveness, a11y pass, test cleanup
- Owner: engineer. Depends: E2-E6 merged. Branch: `feat/web-polish`.
- Deliverable: a responsive pass (mobile through desktop) across every page, an
  accessibility pass (landmarks, alt text, keyboard reachability, contrast per D2,
  `prefers-reduced-motion` respected for any motion), and a check that the full test
  suite and `npm run build` output stay clean.
- Done when: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` all pass
  with real output pasted in the PR; Architect review (including its own hygiene pass:
  `npm run scan-secrets`, `npm audit`, broken-link check).
- **Carried over from E4's review** (`docs/architecture/reviews/feat-web-checkout.md`
  §5): `CartDrawer.tsx` has no cyclic Tab/Shift+Tab focus trap. Tabbing past the
  drawer's last focusable element (or Shift+Tab from its first) moves focus into the
  page behind it rather than wrapping — verified in code, not just as claimed in the E4
  PR. The backdrop blocks **mouse/pointer** clicks from reaching background content
  (`pointer-events: auto` + full-viewport `inset: 0` while open), but that has no effect
  on keyboard Tab order: a **keyboard-only** user tabbing out of the open drawer *can*
  land on and activate a control (e.g. a header nav link) in the dimmed background while
  the drawer is still visually open. This is more than a cosmetic "doesn't wrap" issue —
  it's the actual "reach hidden content behind it" case for that one input mode. Add a
  real cyclic focus trap (and a test that Tab/Shift+Tab stay confined to the dialog while
  open) as part of this task's a11y pass.

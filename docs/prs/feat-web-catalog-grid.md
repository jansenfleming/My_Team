# feat/web-catalog-grid: typed product data + real catalog grid + D2 tokens (E2)

Author: engineer. Branch: `feat/web-catalog-grid`. Base: `main` (d08d960, after PR #40,
`docs/board-d2-done`).

## What changed

Board task E2 (`docs/architecture/board.md`): a typed product-data module built from the
Creative Director's `docs/design/products.md` (D3), a real responsive product grid on the
catalog route, and D2's real design tokens/style guide wired in across the site, replacing
E1's placeholder styling. No product detail page content, cart, or easter eggs yet — those
are E3/E4/E6, scoped separately on the board.

**Design tokens — `src/styles/tokens.css` + `src/index.css` + `src/main.tsx`**
- Copied `docs/design/tokens.css` verbatim to `apps/web/src/styles/tokens.css` (not
  hand-transcribed — `diff`ed identical against the source after copy).
- Imported it once, globally, in `main.tsx`, before `index.css`.
- Rewrote `index.css` from scratch to use only `--zjc-*` custom properties for every
  color, spacing, type, motion, and z-index value — no raw hex, no unscaled px, no ad hoc
  easing/duration, per `docs/design/style-guide.md` §6. This replaces E1's neutral
  dark-placeholder palette (`color-scheme: dark`, hardcoded hex) with D2's real light
  theme: system sans for headings/UI/body, monospace reserved for structural accents
  (price, category label, tags), the cobalt `--zjc-signal` accent for links/focus/active
  nav, the shared focus-ring rule (`outline: var(--zjc-focus-width) solid
  var(--zjc-focus-ring); outline-offset: var(--zjc-focus-offset)`) on every interactive
  element, a sticky header, and `prefers-reduced-motion` handling on the nav transition
  (on top of `tokens.css`'s own reduced-motion collapse of all `--zjc-dur-*` to 0ms).
- Breakpoints unchanged from E1's convention (640px / 960px) — task instructions said to
  reuse them, so no new breakpoint values were invented.
- Existing page shells (`AboutPage`, `LookbookPage`, `NotFoundPage`) keep their E1
  placeholder copy verbatim (that's D4/D5/E5/E6 territory) — only their inherited base
  styling (via `.page`, `.placeholder-copy`) changed, not their content.

**Product data — `src/data/products.ts` + `src/data/products.test.ts`**
- A hand-authored, typed module (`Product`, `ProductCategory`, `SpecialCopy` types) built
  from `docs/design/products.md` §2: the 12 main-catalog products (5 shirts, 4
  sweatshirts, 3 hats), each with id/name/category/price/tags/description, and, for the 8
  that D3 specifies one, a verbatim `specialCopy` block (care label / hangtag text,
  reproduced exactly — field names, spacing, and command syntax unchanged, not
  paraphrased).
- The hidden 13th product (`200 OK Tee`, D3 §3) is exported separately as `hiddenProduct`
  and is **not** part of the `products` array — excluded from every "all products" loop
  by construction, per D3's explicit constraint, not filtered out at render time. Nothing
  imports `hiddenProduct` yet; D5 (easter-egg spec) and E6 (implementation) will wire its
  reveal later.
- Tests cover: exact count (12, never 13), the 5/4/3 category split, only
  shirt/sweatshirt/hat categories used, unique non-empty ids, at least one tag per
  product, the hidden product's exclusion from `products`, a verbatim special-copy spot
  check, and the plain-copy/longer-name edge case (`Works on My Machine Tee` — no
  `specialCopy`, one of the longer names in the set).

**Catalog grid — `src/pages/CatalogPage.tsx` + `src/components/ProductCard.tsx` +
`src/pages/CatalogPage.test.tsx`**
- `CatalogPage` now renders a real `<ul className="catalog-grid">` of all 12 products from
  `src/data/products.ts` (never `hiddenProduct`, which this file doesn't even import).
- New `ProductCard` component: since there's no real product photography, the "image" is
  a CSS-only styled placeholder — D2's grid motif (two `linear-gradient`s from
  `--zjc-grid-line` + `--zjc-grid-size`) on the `--zjc-bg` ground per
  `docs/design/style-guide.md` §3 ("use only on `--zjc-bg`-colored sections directly"),
  with the product's category set large in the monospace accent. It's `aria-hidden` (the
  product name/category are already announced as real text below it, so a redundant
  accessible name on the decorative box would be noise, not a missing one). No `<img>`
  tag anywhere, no external image URL, no stock photo — confirmed by a test asserting
  zero `<img>` elements on the page. `docs/design/lookbook.md` (D4) doesn't exist yet, so
  this placeholder treatment is my own reasonable call consistent with D2's tokens, not a
  D4 spec — flagging in case the Creative Director wants to formalize a placeholder
  convention in D4 later.
- Each tile links to `/product/:id` (the route already resolves via E1's router/`matchRoute`,
  though the detail page itself is still E3's placeholder).
- Grid is mobile-first at E1's existing breakpoints: 2 columns base, 3 at 640px, 4 at
  960px (`repeat(2/3/4, 1fr)`), verified in the production build output
  (`dist/assets/*.css` contains all three rules).
- Tests: exactly 12 `<li>` product tiles render (never 13), the hidden product's name
  never appears, each product's name/price/category render as visible text, one tile's
  `href` resolves to its `/product/:id` route, zero `<img>` elements exist, and the
  longer plain-copy product (`Works on My Machine Tee`) renders cleanly with its price
  intact — the edge case the board task calls out explicitly.

## New dependencies

None. No new packages added; `package-lock.json` is unchanged (a stray `peer` flag
diff from `npm install` was reverted before committing since nothing here changes
resolved dependencies).

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

Manual: `npm run dev -w @site/web`, then visit `/catalog` (or `/`, which links to it) —
12 product tiles render with a styled placeholder, name, price, and category each; resize
the viewport across ~375px / 640px / 960px+ to see the 2 → 3 → 4 column grid step; tab
through the page to confirm the shared focus ring appears on every link/button; toggle
`prefers-reduced-motion` in devtools to confirm the nav collapse and card hover-lift both
degrade to an instant state change.

## Real command output

Run in `.claude/worktrees/agent-a033178875c80445a`, Node v22.12.0.

```
$ npm install
npm warn EBADENGINE Unsupported engine { package: 'eslint-visitor-keys@5.0.1', required: { node: '^20.19.0 || ^22.13.0 || >=24' }, current: { node: 'v22.12.0', npm: '11.6.1' } }
npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
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
Not implemented: navigation to another Document   (jsdom noise from Router.test.tsx's
                                                     native-navigation-not-intercepted
                                                     cases; pre-existing, not new)

 Test Files  7 passed (7)
      Tests  46 passed (46)
   Start at  19:07:16
   Duration  1.31s

TAP version 13
... (tools/scan-secrets.test.mjs)
1..9
# tests 9
# pass 9
# fail 0

$ npm run build
> zerojance-site@0.0.0 build
> npm run build --workspaces --if-present
> @site/web@0.0.0 build
> vite build

vite v7.3.6 building client environment for production...
transforming...
✓ 41 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-DluCaYE1.css    8.34 kB │ gzip:  2.41 kB
dist/assets/index-DWEQdIHB.js   232.04 kB │ gzip: 72.74 kB
✓ built in 438ms

$ npm run scan-secrets
> zerojance-site@0.0.0 scan-secrets
> node tools/scan-secrets.mjs
scan-secrets [working-tree]: 113 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
> zerojance-site@0.0.0 audit:ci
> npm audit --audit-level=high
found 0 vulnerabilities
```

7 test files: `App.test.tsx`, `config.test.ts`, `index-html.test.ts`,
`router/Router.test.tsx`, `router/matchRoute.test.ts`, `data/products.test.ts` (new),
`pages/CatalogPage.test.tsx` (new). 46 tests total, all passing.

## Notes for the Architect / next tasks

- E3 (product detail page + cart core) can now import `products` from
  `src/data/products.ts` for the real detail-page content; the route already resolves,
  it's currently still `ProductPage`'s E1 placeholder rendering the raw slug.
- The dark-panel component (`--zjc-panel-*` tokens) is intentionally unused so far — D2
  reserves it for structural special-copy blocks (care labels, hangtags), which belongs
  on the product detail page (E3), not the grid tile.
- Flagging for the Creative Director: no `docs/design/lookbook.md` (D4) exists yet, so the
  catalog placeholder-tile treatment is my own reasonable interpretation of D2's tokens,
  not a D4-specified convention. Happy to adjust once D4 lands if it wants something
  different for product imagery placeholders specifically.

## Status
Ready for Architect review. Board status for E2: `review`.

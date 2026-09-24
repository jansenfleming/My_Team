# feat/web-product-cart: real product detail page + mock cart core (E3)

Author: engineer. Branch: `feat/web-product-cart`. Base: `main` (de7e106, after PR #49,
`docs/board-d4-done`).

## What changed

Board task E3 (`docs/architecture/board.md`): the real `ProductPage` (replacing E1's
placeholder), a mock size/variant picker, an "Add to Cart" action, and cart state (React
context + `localStorage` persistence) with a visible count in the header. No cart
drawer, quantity edit/remove, or checkout screen yet — that's E4, scoped separately on
the board. No easter eggs implemented — the Konami-code gate on the hidden product is
E6's job; this branch only makes sure `ProductPage`'s lookup is shaped so E6 doesn't
have to revisit it (see below).

**Shared formatting — `src/utils/format.ts` + `src/components/ProductCard.tsx`**
- Pulled `CATEGORY_LABEL` and `CURRENCY` out of `ProductCard` into a new shared module so
  the product detail page reuses the exact same price/category formatting instead of a
  second copy of the same two small maps. `ProductCard`'s rendered output is unchanged.

**Cart core — `src/cart/CartContext.tsx` + `src/cart/CartContext.test.tsx`**
- `CartProvider`/`useCart`: a React context holding cart line items
  (`{ productId, name, price, category, variant, quantity }`). `addItem(product, variant,
  quantity?)` increments quantity in place when the same `productId` + `variant` is added
  again, rather than creating a duplicate line (the board's "your call, be consistent and
  test it" — decision: duplicate = increment).
- State is written to `localStorage` (key `zj_cart`) on every change and read back on
  mount. Both the read and the write are wrapped in `try/catch`: a blocked, full, or
  disabled `localStorage` (private browsing, quota exceeded) falls back to in-memory-only
  state for that render pass instead of crashing the app. Malformed or unexpected stored
  JSON (not an array, wrong shape) is also handled — falls back to an empty cart, not a
  thrown error.
- **No network call anywhere in this file or anywhere cart state is touched** — frontend
  only, per ADR 0003.
- Tests: starts empty; same product+variant added twice increments quantity (not a
  duplicate line); same product with a different variant creates a separate line; total
  quantity sums across different products; a simulated reload (unmount the whole provider
  tree, mount a fresh one) reads the same cart back from `localStorage`; malformed JSON
  and a well-formed-but-wrong-shape stored value both fall back to an empty cart without
  throwing; `localStorage.setItem` throwing (quota/blocked) doesn't crash the app and the
  cart keeps working in-memory; `useCart` throws a clear error outside a `CartProvider`.

**Mock size/variant options — `src/data/variants.ts`**
- Neither D2 nor D3 specifies exact size runs, so this is my own plausible, simple call:
  shirts/sweatshirts get a standard `S/M/L/XL` run; hats are one-size (matches how most
  adjustable-strap streetwear caps are actually sold — there's no separate fitted-cap
  product in the catalog to justify more than one option). Kept in its own module so it's
  the one place to change if the Creative Director wants different sizing later.

**Product detail page — `src/pages/ProductPage.tsx` + `src/pages/ProductPage.test.tsx`**
- `ProductPage` looks up the requested slug in the 12-item main catalog
  (`src/data/products.ts`'s `products` array — never `hiddenProduct`) and renders
  category, name, price, description, tags, and — for the 8 products that have one — the
  special-copy block (care label / hangtag) in D2's dark-panel treatment (`--zjc-panel-*`
  tokens, reserved for exactly this per `style-guide.md` §3), content reproduced
  verbatim.
- An unknown slug renders the existing `NotFoundPage` (imported, not duplicated).
- Mock size/variant picker: a native `<fieldset>`/`<legend>`/radio-group (real keyboard
  accessibility, no custom widget), defaulting to the first size. Selecting a size clears
  any prior "added to cart" confirmation.
- "Add to Cart" calls `useCart().addItem` and shows a flat, non-exclamatory confirmation
  in an `aria-live="polite"` `role="status"` region (`"Added 1 × <name> (<variant>) to
  cart."`) — matching the site's established deadpan tone, not a celebratory toast.
- **Mock cart discipline**: a comment sits at the exact point in the Add to Cart handler
  where a real payment/order API call would go, stating plainly it's intentionally not
  implemented (ADR 0003, project brief). Nothing on this page makes, or will ever make, a
  network call — verified by a test that spies on `globalThis.fetch` and asserts it's
  never called after clicking Add to Cart.
- **Easter-egg lookup note (for E6):** `findProduct` is a plain search over `products`
  only; it does not import or reference `hiddenProduct` at all. Per this task's
  instructions, wiring the Konami-code gate (`docs/design/easter-eggs.md` §3) is board
  task E6's job, not E3's. The function carries a comment describing exactly the branch
  E6 will add (checking `localStorage.getItem("zj_unlocked_200ok") === "1"` and returning
  the hidden product for its slug) so E6 can extend this function without restructuring
  it. Today, visiting `/product/200-ok` or `/product/200-ok-tee` both correctly fall
  through to `NotFoundPage` — the specified pre-unlock behavior.
- **Flagging a data/spec mismatch for the Architect/Creative Director:** D5
  (`docs/design/easter-eggs.md` §3) fixes the hidden product's slug as `200-ok`
  (`/product/200-ok`), written to resolve the "exact slug" D3 deliberately left open. But
  `src/data/products.ts`'s `hiddenProduct.id` (built for board task E2, merged before D5
  landed) is `"200-ok-tee"`, not `"200-ok"`. I did not change `products.ts` myself — that
  file's `hiddenProduct` content is D3/E2 territory and reconciling it is naturally part
  of E6's Konami-gate wiring, not this branch's scope — but flagging now so whoever picks
  up E6 knows to either update the `id` to `200-ok` or use `"200-ok-tee"` as the real
  fixed slug (and tell the Creative Director if the route in D5 needs a matching update).
- Tests: known product renders name/category/price/description/tags; special-copy block
  renders distinctly with its exact content (verbatim spot-check) and is absent for a
  product with none; shirt shows a 4-size picker defaulting to S, hat shows a one-size
  picker; picking a different size updates the checked radio; an unknown id renders
  `NotFoundPage`'s real content (not a duplicate); `200-ok-tee` (today's unmatched hidden
  slug) also renders `NotFoundPage`; Add to Cart shows the exact confirmation copy and
  increments the cart's total quantity; two clicks increment quantity rather than adding
  a duplicate line; Add to Cart never calls `fetch`.

**Header cart count — `src/layout/Layout.tsx`**
- `Layout` reads `totalQuantity` from the cart context and shows `Cart (N)` next to the
  brand link inside a small `aria-live="polite"` region, so screen readers hear it
  update. Deliberately plain text, not a link/button — there's no cart drawer or page to
  open until board task E4 builds one. Small, additive change to this file only (one new
  wrapping `<div className="site-header__actions">` around the existing nav-toggle
  button), since another Engineer instance is building `LookbookPage`/`AboutPage` on a
  separate branch and I was asked to keep shared-file changes minimal for an easy merge.

**App wiring — `src/App.tsx`**
- Wraps the existing tree in `CartProvider` (`CartProvider > RouterProvider > Layout >
  Pages`). One added import, one added wrapping component — no reformatting of the rest
  of the file, same reasoning as above.

**Styling — `src/index.css`**
- New rules only, following the existing file's conventions: `.site-header__actions` /
  `.cart-indicator` (header), `.product-detail__*` (category, price, description, tags,
  special-copy dark panel, variant picker), `.tag` (chip, per style-guide.md §3's
  tags/chips rule), `.button` / `.button--primary` (per style-guide.md §3's button rule:
  `--zjc-signal` fill, `--zjc-fg-on-signal` label, `--zjc-radius-md`,
  `--zjc-border-width-thick`, `--zjc-weight-bold`, `--zjc-tap-min` minimum height).
  Every value is a `--zjc-*` token — no raw hex, no unscaled px, no ad hoc easing/
  duration. Extended the shared focus-ring selector to include `input:focus-visible` (the
  size-picker radios) alongside the existing `a`/`button`/`[tabindex]` selectors.

**Test infra — `src/test/setup.ts`**
- `afterEach` now also clears `localStorage` (guarded for `config.test.ts`'s
  `@vitest-environment node`, which has no `window`), so one test's cart state can't leak
  into the next via the real jsdom `localStorage` that persists across `it()` blocks in
  the same file.

**Test updates — `src/App.test.tsx`**
- The old E1 smoke test asserted the placeholder's `"Product detail"` heading and a raw
  slug echo for `/product/circuit-hoodie`; that placeholder is gone. Replaced with: a
  known product slug (`/product/exit-code-0-tee`) renders its real heading and the
  correct document title, and an unknown slug (`/product/circuit-hoodie`, kept as the
  same example path) renders the existing 404 heading. Added a small cart-integration
  `describe` block: the header count starts at `Cart (0)`, updates to `Cart (1)` after
  clicking Add to Cart on a product page, and survives a client-side navigation away and
  back (catalog → still `Cart (1)`).

## New dependencies

None. `package-lock.json` is unchanged (the same stray `peer`-flag diff from `npm
install` that the E2 PR noted was reverted before committing — nothing here changes
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

Manual: `npm run dev -w @site/web`, then visit `/product/exit-code-0-tee` (or click any
catalog tile) — the detail page renders category/name/price/description/tags and a
dark-panel care-label block; pick a size, click "Add to Cart", see the flat confirmation
line and the header's `Cart (N)` count increment; reload the page (or the whole dev
server) and confirm the count survives; try a hat (`/product/sudo-cap`) to see the
one-size picker; try `/product/does-not-exist` (or `/product/200-ok`) to confirm the
existing 404 page renders. Toggle `prefers-reduced-motion` and tab through the picker/
button to confirm the shared focus ring appears on the radios.

## Real command output

Run in `.claude/worktrees/agent-a3cd47900ac439060`, Node v22.12.0.

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

 Test Files  9 passed (9)
      Tests  70 passed (70)
   Start at  19:27:07
   Duration  1.5s

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
✓ 44 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-C8qL4b09.css   11.55 kB │ gzip:  2.81 kB
dist/assets/index-C40CuGNA.js   234.79 kB │ gzip: 73.59 kB
✓ built in 441ms

$ npm run scan-secrets
> zerojance-site@0.0.0 scan-secrets
> node tools/scan-secrets.mjs
scan-secrets [working-tree]: 125 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
> zerojance-site@0.0.0 audit:ci
> npm audit --audit-level=high
found 0 vulnerabilities
```

9 test files, 70 tests total, all passing: `App.test.tsx`, `config.test.ts`,
`index-html.test.ts`, `router/Router.test.tsx`, `router/matchRoute.test.ts`,
`data/products.test.ts`, `pages/CatalogPage.test.tsx`, `cart/CartContext.test.tsx`
(new), `pages/ProductPage.test.tsx` (new).

## Mock cart / no-network confirmation

Per the hard constraint on this task: this is a MOCK cart. No file in this branch makes,
or is reachable into making, a network call for cart or checkout. The one point where a
real implementation would call a payment/order API is explicitly commented in
`src/pages/ProductPage.tsx`'s `handleAddToCart`, and a test
(`"never makes a network call when adding to cart"`) spies on `globalThis.fetch` to
confirm it's never invoked.

## Notes for the Architect / next tasks

- E4 (cart drawer + mock checkout screen) can now build on `useCart()` — `items` and
  `totalQuantity` are already there; E4 will likely add `removeItem`/`updateQuantity` (or
  similar) to `CartContext.tsx`, which this branch deliberately didn't add to stay
  scoped to E3's "Add to Cart" + persistence ask.
- E6 (easter eggs) can wire the Konami-code gate into `ProductPage.tsx`'s `findProduct`
  per the comment left there — see the flagged slug mismatch above
  (`hiddenProduct.id` is `"200-ok-tee"` in `products.ts`, but D5 fixed the slug as
  `"200-ok"`) before doing so.
- The dark-panel component (`--zjc-panel-*` tokens) is now in real use for the first
  time, exactly where D2 reserved it (structural special-copy blocks), and only once per
  page as the style guide asks.

## Status

Ready for Architect review. Board status for E3: `review`.

# feat/web-checkout: cart drawer + mock checkout screen (E4)

Author: engineer. Branch: `feat/web-checkout`. Base: `main` (ab6a062, after PR #55,
`docs/board-e5-done`).

## What changed

Board task E4 (`docs/architecture/board.md`): the cart drawer and mock checkout screen
that build on E3's `CartContext`. A visitor can now open a drawer from the header, edit
quantities, remove lines, see a live subtotal, move into a read-only checkout summary
with a mock shipping/tax estimate, and click "Place Order" — which never contacts a
server, clears the (mock) cart, and shows an explicit, honest disclosure that nothing was
actually sent anywhere.

**Cart core additions — `src/cart/CartContext.tsx` + `src/cart/CartContext.test.tsx`**
- Four additions to `CartContextValue`, none of which touch `addItem` or the existing
  persistence behavior:
  - `subtotal`: memoized sum of `price × quantity` across every line.
  - `updateQuantity(productId, variant, quantity)`: sets a line's quantity outright
    (not a delta), clamped to a minimum of 1. A no-op if no line matches. Deliberately
    separate from `removeItem` — the board asks for "a way to edit quantity" and "a way
    to remove an item" as two distinct affordances, so going to zero via the stepper
    isn't how a line disappears; the Remove button is.
  - `removeItem(productId, variant)`: removes the one matching line.
  - `clearCart()`: empties the cart. Used by the mock checkout's "Place Order" step (see
    below) — nothing else in this branch calls it.
- Tests added (13 new, alongside E3's original 8): subtotal sums correctly across
  products; `updateQuantity` changes quantity and recomputes subtotal/total quantity,
  including a two-step increment/decrement round trip; `updateQuantity` clamps to a
  minimum of 1 rather than allowing zero/negative; `updateQuantity` is a no-op for an
  unknown line; `removeItem` removes only the matching line and recomputes
  subtotal/total quantity, leaving the other line intact; `clearCart` zeroes everything.

**Cart drawer + mock checkout — `src/cart/CartDrawer.tsx` (new) + `src/cart/CartDrawer.test.tsx` (new)**
- One overlay component with three internal steps, rather than a separate drawer +
  modal-dialog pair. `tokens.css` reserves `--zjc-z-drawer` for the cart drawer and
  `--zjc-z-modal` for "checkout-mock dialog, any confirmation modal" as two different
  tokens, but the whole flow here is linear (cart → checkout → placed), so one
  `role="dialog"` element with one focus-management story is simpler than juggling two
  stacked overlays for what a visitor experiences as a single, continuous interaction.
  `--zjc-z-modal` ships unused, which `style-guide.md` §6 explicitly allows for a token
  without a component yet — noted here so it isn't mistaken for an oversight.
  - **Step "cart"**: each line item (name, variant, quantity, price), a quantity
    stepper (−/+ buttons, decrement disabled and clamped at quantity 1), a `Remove`
    button per line, a computed subtotal, and a `Checkout` button (only reachable with
    at least one item — the empty-cart state has no checkout path). Empty state links
    back to `/catalog`.
  - **Step "checkout"**: a read-only order summary (same line items, no controls), a
    mock shipping estimate (flat `$8`, named constant `MOCK_SHIPPING_ESTIMATE`) and a
    mock tax estimate (`8%` of subtotal, named constant `MOCK_TAX_RATE`) — both labeled
    "(est.)" and explicitly commented as illustrative numbers, not computed against any
    real address, carrier, or tax jurisdiction — a running total, D1's exact required
    disclosure line ("This is a mockup checkout — no order is placed and no payment is
    processed.", `docs/design/concept.md` §2's "Cart / checkout copy — hard rule") shown
    *before* the visitor can click anything, and `Place Order` / `Back to bag` buttons.
  - **Step "placed"**: reached only after `Place Order`. `clearCart()` runs first, then
    an honest, explicit disclosure renders in a `role="status"` region ("This is a demo
    — no real order was placed, no payment was processed, and nothing was sent
    anywhere..."), and a `Continue Shopping` button closes the drawer.
  - **Mock checkout discipline**: the exact point a real implementation would call a
    payment/order API sits in the `Place Order` handler (`handlePlaceOrder` in
    `CartDrawer.tsx`), commented in the same style as `ProductPage.tsx`'s existing
    "Add to Cart" comment (board task E3) — explicitly stating what a real call would
    look like (`POST /api/orders` or a third-party checkout SDK) and that it is
    intentionally not implemented. Nothing in this file, or anywhere it calls into
    (`CartContext.clearCart`), makes or will ever make a network call.
  - **Mounting/transition**: the backdrop and drawer panel are always in the DOM (so
    the CSS slide/fade — `--zjc-dur-moderate` / `--zjc-ease-in-out`, matching
    `style-guide.md` §5's "state swaps use ease-in-out" rule, same pairing E1 already
    used for the nav's collapse) has something to animate, but the interactive content
    inside only renders while `open` is true. That keeps a closed drawer from being
    tab-reachable without needing an `inert` polyfill, while still getting a real
    transition on open — no drawer/backdrop content is ever the *only* way to learn
    open/closed state (`data-open` attribute + conditional content both agree).
    Reduced-motion users get both the token-level 0ms collapse from `tokens.css` and an
    explicit `transition: none` override on the drawer/backdrop, the same belt-and-
    suspenders pattern the existing `.site-nav` rule uses.
  - **Accessibility**: `role="dialog"` / `aria-modal="true"` / `aria-labelledby` are
    only present on the panel while `open` is true (verified by a test: the dialog role
    isn't queryable at all when closed). Escape closes the drawer (document-level
    keydown listener, only attached while open). Clicking the backdrop closes it. Focus
    moves onto the panel on open; returning focus to the trigger button on close is the
    caller's job (`Layout.tsx` owns the button and its ref). Background scroll is
    locked while open, restored on close. **Not done here, deferred to E7** (the board's
    dedicated a11y pass, after E2-E6): a full cyclic focus trap (Tab/Shift+Tab wrapping
    inside the dialog) — today, tabbing past the last focusable element in the drawer
    moves focus back into the page behind it rather than wrapping. Escape + backdrop
    click + a single content-mount/unmount gate cover the essential "can't accidentally
    interact with stuff visually hidden behind the drawer" requirement in the meantime.
  - Tests (24 new): empty state; renders nothing dialog-queryable when closed; lists
    name/variant/quantity/price per line; quantity stepper increments/decrements and
    recomputes the subtotal at each step; decrement disabled at quantity 1; removing an
    item updates both subtotal and the visible list (and removing the only item falls
    back to the empty state); Checkout renders a read-only summary with subtotal,
    shipping (est.), tax (est.), and total, with no quantity/remove controls present;
    the mock disclosure line renders on the checkout screen; placing an order renders
    the honest post-checkout disclosure, clears the cart, and **never calls `fetch` or
    constructs an `XMLHttpRequest`** (both spied across the full flow); reopening the
    drawer after a placed order resets to the (now-empty) cart view rather than showing
    a stale "placed" screen; backdrop click, Escape, and the close button all call
    `onClose`.

**Header wiring — `src/layout/Layout.tsx`**
- One new `<button className="cart-toggle">Open cart</button>` next to the existing
  `Cart (N)` text (unchanged), and one `<CartDrawer open={cartOpen} onClose={closeCart} />`
  render at the end of the shell. `closeCart` clears `cartOpen` and refocuses the toggle
  button via a ref. This is a deliberately small, additive diff to a file another
  Engineer instance may be touching in parallel (`feat/web-easter-eggs`, board task E6,
  per the lead's instructions) — no restructuring of the header markup.

**Styling — `src/index.css`**
- New rules only, appended at the end of the file: `.cart-toggle`, `.cart-drawer-backdrop`,
  `.cart-drawer` (+ `[data-open="true"]` states), `.cart-drawer__*` (header, close, empty
  state, item list/grid layout, quantity stepper, subtotal, totals `<dl>`, mock-notice
  box, action row), and `.button--destructive` (the style guide's specified
  `--zjc-alert` fill / `--zjc-fg-on-alert` label for the Remove button — the one
  destructive-button case the codebase didn't need until now). Every value is a
  `--zjc-*` token — no raw hex, no unscaled px, no ad hoc easing/duration, per
  `style-guide.md` §6.

**Test integration — `src/App.test.tsx`**
- New `describe` block wiring the whole thing through the real `Layout` header button
  (not just `CartDrawer` in isolation): opening the drawer from `Open cart` after an
  `Add to Cart` shows the real item; the full cart → checkout → Place Order path ends
  at the honest disclosure and the header count drops back to `Cart (0)`; closing the
  drawer with Escape returns focus to the `Open cart` button.

## New dependencies

None. No `package.json` or `package-lock.json` changes.

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

Manual: `npm run dev -w @site/web`, add an item from any product detail page, click
"Open cart" in the header — the drawer slides in from the right with the line item,
price, a quantity stepper, and a subtotal. Bump the quantity up/down and watch the
subtotal update; click "Remove" and watch the line and subtotal both update (removing
the last item shows the empty-bag message with a link back to `/catalog`). Add an item
again, click "Checkout" — a read-only summary appears with a shipping/tax estimate, a
total, and the mock-checkout disclosure line. Click "Place Order" — the drawer shows the
"Nothing Sent" honest disclosure and the header's `Cart (N)` count drops to 0. Press
Escape or click the backdrop at any point to close the drawer; confirm keyboard focus
returns to the header's "Open cart" button. Toggle `prefers-reduced-motion` to confirm
the drawer/backdrop appear and disappear instantly with no slide.

## Real command output

Run in `.claude/worktrees/agent-ab86e97ac3b881d01`, Node v22.12.0.

```
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

 Test Files  12 passed (12)
      Tests  117 passed (117)
   Start at  15:43:31
   Duration  2.33s

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
✓ 46 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.48 kB │ gzip:  0.30 kB
dist/assets/index-D47AC_yn.css   22.28 kB │ gzip:  4.05 kB
dist/assets/index-DkcHWALP.js   247.80 kB │ gzip: 77.01 kB
✓ built in 446ms

$ npm run scan-secrets
> zerojance-site@0.0.0 scan-secrets
> node tools/scan-secrets.mjs
scan-secrets [working-tree]: 134 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
> zerojance-site@0.0.0 audit:ci
> npm audit --audit-level=high
found 0 vulnerabilities
```

12 test files, 117 tests total, all passing (up from 9 files / 70 tests before this
branch): `App.test.tsx`, `config.test.ts`, `index-html.test.ts`, `router/Router.test.tsx`,
`router/matchRoute.test.ts`, `data/products.test.ts`, `pages/CatalogPage.test.tsx`,
`pages/AboutPage.test.tsx`, `pages/LookbookPage.test.tsx`, `cart/CartContext.test.tsx`
(13 new tests), `pages/ProductPage.test.tsx`, `cart/CartDrawer.test.tsx` (new file, 16
tests).

## Mock cart / no-network confirmation

Per the hard constraint on this task: this is a MOCK checkout. No file in this branch
makes, or is reachable into making, a real network call. The exact point a real
implementation would call a payment/order API is commented in `CartDrawer.tsx`'s
`handlePlaceOrder`, matching `ProductPage.tsx`'s existing precedent comment for "Add to
Cart" (board task E3). Two tests confirm this at both the unit level
(`CartDrawer.test.tsx`, spying on `fetch` and the `XMLHttpRequest` constructor across the
full cart → checkout → place-order path) and the integration level
(`App.test.tsx`, exercising the same path through the real header button). The UI never
claims a payment was processed or an order was sent anywhere — the checkout screen shows
D1's exact required disclosure line before "Place Order" is even clickable, and the
post-order screen restates it more explicitly ("no real order was placed, no payment was
processed, and nothing was sent anywhere").

## Notes for the Architect / next tasks

- E6 (easter eggs, in progress in parallel on `feat/web-easter-eggs`) touches
  `Layout.tsx` and possibly `App.tsx` per the lead's heads-up. This branch's changes to
  `Layout.tsx` are additive only (one new button, one new ref, one new component render)
  — no lines were restructured, so a merge either direction should be low-conflict. I
  did not touch `App.tsx` at all.
- E7 (responsiveness/a11y pass) should pick up the cyclic focus-trap gap noted above —
  today the drawer's Tab order doesn't wrap, which is a real (if minor, given Escape +
  backdrop-click + click-outside-content-gate already cover the "can't reach hidden
  content" requirement) a11y gap worth closing in that dedicated pass.
- The mock shipping ($8 flat) and tax (8%) estimates are my own plausible placeholder
  numbers — neither D3 nor D4 specifies real shipping/tax policy (there isn't one; this
  is a mockup), so these exist purely to make the checkout summary look like a real one.
  If the Creative Director wants different numbers or wants them removed entirely
  (the board task explicitly said "maybe a mock shipping/tax line if you want"), that's
  a copy-only change contained to `CheckoutStep` in `CartDrawer.tsx`.

## Status

Ready for Architect review. Board status for E4: `review`.

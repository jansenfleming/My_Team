# Review: `feat/web-checkout` (E4 — cart drawer and mock checkout screen)

Reviewer: Architect. Date: 2026-09-25. Branch base: `main` at `ab6a062`. PR file:
`docs/prs/feat-web-checkout.md`. Commits reviewed: `7819207`, `7202b44`, `f46364c`,
`7ed8da9`.

**Verdict: approved.** No required changes. One note added to E7's board entry (see
"Flagged gap" below) — deferral confirmed, framing corrected slightly.

## 1. Cart drawer functionality

Confirmed by reading `apps/web/src/cart/CartDrawer.tsx` and both test files (not just
skimmed):
- Each line item renders name, category+variant (`Shirt · M`), a quantity stepper
  (−/+, decrement disabled at qty 1), unit×qty price, and a Remove button.
- `CartDrawer.test.tsx` → "editing quantity with the stepper recomputes the subtotal
  correctly" asserts actual dollar values at each step (`$36` → `$72` → `$36`), not just
  "didn't crash." "removing an item updates both the subtotal and the item list" asserts
  `$66` → `$30` after removing one of two lines, and that the removed line's name
  disappears while the other's stays. These are real recompute assertions.
- `CartContext.test.tsx`'s new E4 block asserts subtotal arithmetic directly:
  `36+30=66`, `36×5=180` (via `updateQuantity` to 5), `36+36+30=102` → `66` after
  removing one `$36` line. All arithmetic checked by hand — correct.
- `clearCart` test confirms subtotal/quantity both zero out.

## 2. Checkout screen realism + honesty

- **Disclosure text verified character-for-character.** `docs/design/concept.md` §2:
  `"This is a mockup checkout — no order is placed and no payment is processed."`
  `CartDrawer.tsx` `CheckoutStep` (line ~301): identical string, including the em dash
  (U+2014) and punctuation. Confirmed with a Python string-equality check plus a raw
  `sed` extraction of both, not eyeballed.
- The line renders before "Place Order" is clickable (it's static content on the
  checkout step, not gated behind an interaction).
- Post-order (`PlacedStep`) discloses further and more explicitly: *"This is a demo — no
  real order was placed, no payment was processed, and nothing was sent anywhere. Your
  bag has been cleared, same as a real checkout would, but that's the only thing that
  happened here."* — rendered in a `role="status"` region. Satisfies D1's "last line
  states plainly nothing was sent/charged" rule for both screens.
- Checkout screen looks real: read-only order summary, shipping/tax line items labeled
  "(est.)", running total, standard retail button labels ("Back to bag", "Place Order").

## 3. Mock discipline (hard rule)

- `git diff main..feat/web-checkout | grep -inE 'fetch\(|XMLHttpRequest|axios|WebSocket|https?://'`
  → the only hits are inside the fetch/XHR-**spy test** itself and in code comments
  describing what a real call would look like. Zero real network calls, zero URLs of any
  kind, anywhere in the diff (a second, broader URL grep for bare domains/`www.`/`.com`
  etc. also came back empty).
- Read `CartDrawer.test.tsx`'s `"placing the order shows the honest post-checkout
  disclosure ... without ever calling fetch or XMLHttpRequest"` test directly: it spies
  `globalThis.fetch` and subclasses `XMLHttpRequest` to spy its constructor, seeds a
  cart item, walks Checkout → Place Order, and asserts both spies were never invoked, all
  restored afterward. This is a real, correct test of the exact path claimed, not a stub.
  `App.test.tsx` has a second, integration-level version of the same walk through the
  real `Layout` header button.
- `handlePlaceOrder` in `CartDrawer.tsx` has the required comment at the exact point a
  real payment/order call would go (`await fetch("/api/orders", ...)` or a third-party
  SDK), matching `ProductPage.tsx`'s E3 precedent comment style and location (immediately
  above the mock action, explaining what's intentionally not implemented).

## 4. Ownership

- Diffstat confirms only `apps/web/**` and `docs/prs/feat-web-checkout.md` touched — no
  `package.json`/lockfile changes (PR's "no new dependencies" claim holds).
- `Layout.tsx`: diff is exactly what the PR claims — one new import, one new ref, one new
  button, one new `<CartDrawer>` render, plus updated comments. No markup restructured.
  Low collision risk with `feat/web-easter-eggs` (E6), which is also touching this file
  in a separate worktree.
- `App.tsx`: confirmed untouched — `git diff main..feat/web-checkout -- apps/web/src/App.tsx`
  produces no output. Only `App.test.tsx` changed (new `describe` block). Restraint held
  as claimed.

## 5. Flagged gap — focus trap

The PR accurately describes the *mechanism*: there's no cyclic Tab/Shift+Tab trap, so
tabbing past the drawer's last focusable element (or Shift+Tab from its first) moves
focus into the page behind it rather than wrapping. Verified in code: the only keydown
handling in `CartDrawer.tsx` is an Escape listener; there's no Tab interception, and
`Layout.tsx` doesn't mark `<header>`/`<main>`/`<footer>` `aria-hidden`/`inert` while the
drawer is open.

One refinement to the PR's framing, worth recording precisely rather than taking at face
value: the backdrop (`.cart-drawer-backdrop`, `pointer-events: auto` + full-viewport
`inset: 0` when open) does block **mouse/pointer** clicks from reaching background
content — that part of "can't accidentally interact with stuff visually hidden behind
the drawer" is correct for pointer users. But `pointer-events` has no effect on keyboard
Tab order: a **keyboard-only** user tabbing past the drawer's last element *can* land on,
and activate, a nav link or other control in the dimmed background while the drawer is
still visually open. So the gap is slightly more than "Tab doesn't wrap nicely" — for
keyboard users specifically, it is exactly the "reach hidden content behind it" case the
mitigation paragraph says is covered, and it isn't, for that one input mode.

**Decision: defer to E7, not a blocker for this merge.** Reasoning:
- No data-safety, mock-commerce-discipline, or content-correctness impact — worst case is
  a confused keyboard user landing on a dimmed nav link, recoverable with Escape or by
  continuing to tab.
- A correct, tested cyclic focus trap is a self-contained unit of work that belongs in
  E7 (the board's dedicated a11y pass across all of E2-E6) rather than bolted onto E4
  under review pressure.
- E4's own definition of done (cart math, disclosure text, mock discipline, ownership)
  is fully met independent of this gap.

Added a corrected note to E7's board entry (see board.md diff) so E7 inherits the precise
keyboard-focus framing above, not just "Tab doesn't wrap."

## 6. Checks run (this review, `.claude/worktrees/agent-ab86e97ac3b881d01`, Node v22.12.0)

```
$ npm install
added 307 packages, audited 309 packages — 0 vulnerabilities

$ npm run typecheck
tsc --noEmit -p tsconfig.json   (clean, no output)

$ npm run lint
eslint .   (clean, no output)

$ npm test
 Test Files  12 passed (12)
      Tests  117 passed (117)
tools/scan-secrets.test.mjs: 9/9 pass

$ npm run build
✓ 46 modules transformed, built in 453ms

$ npm run scan-secrets
scan-secrets [working-tree]: 135 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
found 0 vulnerabilities
```

117/117 matches the PR's claimed output (my file count for scan-secrets is 135 vs. the
PR's 134 — expected, since my run scanned an extra `dist/` build artifact from running
`build` before `scan-secrets`; 0 warnings/errors either way, not a concern).

**Note on shipping/tax math:** `CheckoutStep`'s shipping ($8 flat when the cart is
non-empty) and tax (8% of subtotal) are simple, named constants
(`MOCK_SHIPPING_ESTIMATE`, `MOCK_TAX_RATE`) computed inline and displayed via the shared
`CURRENCY` formatter. No test asserts the exact rendered dollar amounts for shipping/tax/
total — only that the labels ("Shipping (est.)", "Tax (est.)", "Total") are present.
I hand-verified the formula against the seeded fixture (`Exit Code 0 Tee`, $36 × 1):
subtotal $36, shipping $8, tax $36 × 0.08 = $2.88, total $46.88 — arithmetic is correct
and matches what the component would render. This is a minor test-coverage gap (not a
correctness bug), not blocking given these are illustrative mock numbers with no
real-world stakes; worth a follow-up numeric assertion test whenever this file is next
touched (e.g. E7), but not required for this merge.

## Summary

E4 meets the definition of done: cart line items are complete and editable with correct
recomputation (verified in both context-level and drawer-level tests with real numeric
assertions), the checkout and post-order screens are honestly and clearly mocked (exact
disclosure string verified character-for-character against D1's spec), there are zero
real network calls anywhere in the diff (confirmed by grep and by reading the fetch/XHR
spy test directly), ownership boundaries held (including the claimed `Layout.tsx`
restraint and zero `App.tsx` touches), and all seven requested checks
(`npm install`, `typecheck`, `lint`, `test` at 117/117, `build`, `scan-secrets`,
`audit:ci`) pass with real output matching the PR's claims. The focus-trap gap is real,
accurately described in mechanism (slightly softened in its safety conclusion for
keyboard users, corrected above), and reasonable to defer to E7.

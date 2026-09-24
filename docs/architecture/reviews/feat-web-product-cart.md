# Architect review — `feat/web-product-cart` (E3)

Reviewer: architect. Date: 2026-09-24. Base: `main` at `de7e106`. Branch tip reviewed:
`fcc14e3` (7 commits, includes the slug-fix follow-up requested directly by the lead).
PR file: `docs/prs/feat-web-product-cart.md`.

**Verdict: approved. No required changes.**

## What I checked and how

Read `docs/project-brief.md`, `docs/design/products.md` (D3), `docs/design/easter-eggs.md`
(D5), `docs/design/tokens.css`/`style-guide.md` (D2), the board's E3 row, the ownership
map, ADR 0003, and the branch's own PR file. Reviewed the full diff (`git diff
main..feat/web-product-cart`, 15 files, +1094/-44) directly, not just the PR's summary of
it. Ran the owner's checks myself in a clean, isolated worktree checked out at the
branch's tip commit (`fcc14e3`) — not taken on the PR file's word:

```
npm install        -> added 307 packages, 0 vulnerabilities (same pre-existing EBADENGINE/
                       eslint-deprecation warnings noted in the PR, unrelated to this branch)
npm run typecheck   -> clean, no output
npm run lint        -> clean, no output
npm test            -> 9 test files passed (9), 70 tests passed (70)
npm run build       -> vite build succeeded, 44 modules transformed
npm run scan-secrets -> 126 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS
npm run audit:ci    -> found 0 vulnerabilities
```

All match the PR file's claimed output exactly.

## Findings against the definition of done

**1. ProductPage rendering + NotFoundPage reuse — pass.** `ProductPage.tsx` looks up the
slug against `products` (from `apps/web/src/data/products.ts`) via a plain `find`,
renders category/name/price/description/tags and, for products with a `specialCopy`
block, the care-label/hangtag content verbatim inside `.product-detail__special-copy`,
styled with `--zjc-panel-bg`/`--zjc-panel-fg`/`--zjc-panel-fg-muted` — the dark-panel
tokens D2 reserved for exactly this. Confirmed by reading `ProductPage.test.tsx`: it
spot-checks the exact special-copy content (`exit_code: 0`, `wash: cold`) and confirms
the block is absent for a plain-copy product (`localhost-tee`). An unknown slug
(`this-product-does-not-exist`) renders the real `NotFoundPage` import — not a
duplicate — confirmed both by reading the import in `ProductPage.tsx` and by the test
asserting the actual "404" heading and "Back to home" link.

**2. Size/variant picker + Add to Cart — pass.** A native `<fieldset>`/`<legend>`/radio
group (`VARIANTS[product.category]` from the new `data/variants.ts`: 4-size run for
shirts/sweatshirts, one-size for hats — a reasonable, clearly-flagged engineering call
since neither D2 nor D3 specifies sizing). Selecting a size updates the checked radio and
clears any prior confirmation. "Add to Cart" calls `useCart().addItem`, shows a flat
`aria-live="polite"` confirmation matching the site's deadpan tone, and updates cart
state — confirmed by `ProductPage.test.tsx`'s cart-probe tests and `App.test.tsx`'s
header-count integration tests.

**3. Cart persistence — pass, and verified as real, not asserted.**
`CartContext.test.tsx`'s persistence test actually unmounts the whole `CartProvider`
tree and mounts a fresh one, reading state back only from `localStorage` (jsdom's real
`localStorage`, not a mock) — this is a genuine simulated-reload test, not an in-memory
assertion dressed up as one. `readStoredCart()` (read) and the `useEffect` write are both
wrapped in `try/catch`, with dedicated tests for: malformed JSON, well-formed-but-wrong-
shape JSON, and `localStorage.setItem` throwing (via a spy on the prototype) — all fall
back cleanly without crashing, confirmed by reading the test file directly. Duplicate
add-to-cart (same `productId` + `variant`) increments the existing line's quantity rather
than creating a second line; a different variant of the same product correctly creates a
separate line. Both behaviors are tested in `CartContext.test.tsx` and exercised again
end-to-end in `ProductPage.test.tsx` ("clicking Add to Cart twice ... increments
quantity, not a duplicate line"). Consistent and tested, as required.

**4. Mock discipline — pass.** `git diff main..feat/web-product-cart | grep -niE
'fetch\(|XMLHttpRequest|axios|WebSocket|http://|https://'` returns nothing but one
unrelated npm-warning line in the PR file's pasted command output (an `eslint.org` docs
URL inside a deprecation warning, not code). No real network call anywhere in cart code.
`ProductPage.tsx`'s `handleAddToCart` has a clear comment at the exact point a real
payment/order API call would go, naming a concrete example (`POST /api/orders`) and
stating plainly it's intentionally not implemented, citing ADR 0003 and the brief. The
PR's claim that a test spies on `fetch` to prove Add to Cart never calls it is real and
correct: `ProductPage.test.tsx`'s `"never makes a network call when adding to cart"` test
installs a `vi.fn()` on `globalThis.fetch`, clicks Add to Cart, and asserts the spy was
never called, restoring the original afterward.

**5. Slug fix verification — pass, checked carefully.** Repo-wide grep (both branch tip
and `main`, not just this branch's diff) for `200-ok-tee`:
- On the branch, the only remaining occurrences are in comments/docs explaining the
  history (`data/products.ts`'s doc comment, `data/products.test.ts`'s inline comment,
  and the PR file itself) — none in live code or assertions.
- `hiddenProduct.id` is `"200-ok"` in `data/products.ts`; both test assertions in
  `data/products.test.ts` that used to check `"200-ok-tee"` now check `"200-ok"`.
- `docs/architecture/reviews/feat-web-catalog-grid.md` (an already-merged, historical
  review record) still says `"200-ok-tee"` — correctly left alone, since it's an accurate
  record of what was true when that PR was reviewed, and the ownership map/working
  agreements treat past review files as history, not living docs to retcon.
- `ProductPage.tsx`'s `findProduct` searches only the `products` array, imports only
  `type Product` from `data/products.ts`, and never imports or references
  `hiddenProduct`. Confirmed by reading the full import list and the function body, not
  just the PR's description of it. `ProductPage.test.tsx` directly exercises this: a
  test navigates to `/product/200-ok` (the fixed slug from D5, with no unlock flag set —
  this branch doesn't implement the Konami gate, that's E6) and asserts it renders
  `NotFoundPage`'s "404" heading, confirming the hidden product stays unreachable by
  direct URL today, as D3/D5 require. This is a hard requirement and I checked it
  directly against the source, not the PR's summary.

**6. Ownership check — pass.** `git diff main..feat/web-product-cart --stat` touches only
`apps/web/**` (14 files) and `docs/prs/feat-web-product-cart.md`. `Layout.tsx`'s change
is one new import, one new `useCart()` call, and one new wrapping `<div
className="site-header__actions">` around the existing nav-toggle button — genuinely
minimal, not a refactor, and the PR explicitly notes this restraint was deliberate
because another Engineer instance is concurrently working on `feat/web-lookbook-about` in
`Layout`'s vicinity. `App.tsx`'s change is one new import and one new wrapping
`<CartProvider>` around the existing tree — same minimal shape. No file collides with the
ownership map (`docs/architecture/ownership-map.md`): product data stays Engineer-owned,
`docs/design/**` untouched, no `docs/architecture/**` file edited by this branch.

**7. Real checks — pass.** See command output above; all six match the PR file's claims
exactly, run independently in a fresh worktree checked out at the branch tip.

## Secondary hygiene (Architect's own pass)

- **Accessibility spot-check:** size picker is a real `<fieldset>`/`<legend>`/radio
  group (keyboard-operable, no custom widget); Add to Cart confirmation and the header
  cart count both use `aria-live="polite"` regions; the shared focus-ring selector was
  extended to include `input:focus-visible` so the new radios get the same visible focus
  ring as links/buttons; tags use a real `<ul aria-label="Tags">` list, not divs.
- **Token discipline:** read the full `index.css` diff — every new rule uses `--zjc-*`
  custom properties (color, spacing, radius, type scale, tap-target minimum); no raw hex,
  unscaled px, or ad hoc timing values found.
- **No broken links introduced:** the only new interactive elements are the existing
  `NotFoundPage`'s links (unchanged) and the Add to Cart button (not a link). No new
  routes or anchors added by this branch.
- **Secrets/deps:** `scan-secrets` and `npm audit --audit-level=high` both clean, as
  above.

## Board update

E3 row in `docs/architecture/board.md` set from `todo` to `approved`, with a note
pointing at this review, mirroring the pattern used for E2/D3/D4/D5. Waiting on the lead
to push/merge the real PR; once confirmed, the Architect will flip it to `done` and note
that E4/E6 can proceed per the board's dependency notes.

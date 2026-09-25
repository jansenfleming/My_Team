# Architect review: `feat/web-easter-eggs` (E6)

Reviewer: Architect. Date: 2026-09-25. Base: `main` at `ab6a062` (branch forked cleanly
from this exact commit — confirmed via `git merge-base`). Branch head: `8e34363`.
PR file: `docs/prs/feat-web-easter-eggs.md`. Spec reviewed against:
`docs/design/easter-eggs.md` (D5).

**Verdict: approved. No required changes.**

This review was done in isolation, as instructed — merge ordering against
`feat/web-checkout` (E4, reviewed separately) is the lead's call, not assessed here.

## 1. Dev-console / view-source message

- `apps/web/index.html`'s HTML comment matches D5 §1a verbatim, placed exactly where
  specified (directly after `<title>`, before `</head>`).
- Confirmed the comment survives `vite build` unchanged: built `npm run build` myself in
  an isolated detached worktree and inspected the actual `dist/index.html` output byte
  for byte — the comment is present, untouched, ahead of the injected `<script>`/`<link>`
  tags Vite adds.
- `logDevConsoleMessage()` (`apps/web/src/eggs/devConsole.ts`) fires all three
  `console.log` calls with D5's exact strings, in the exact order, from a
  `useEffect(() => {...}, [])` in `App` — `App` itself only mounts once per full page
  load (only the inner `Pages` component re-renders on client-side navigation), so this
  is genuinely once-per-load, not once-per-route. `App.test.tsx`'s new test asserts the
  spy count stays at 3 after a simulated route click — this is the right test for the
  right claim, not just an initial-render count.

## 2. Joke 404 page

- `NotFoundPage.tsx` matches D5 §2 exactly: heading `404`; status line
  `GET {pathname} → 404 Not Found` built from the real `useRouter()` pathname (a
  dedicated test confirms it's not a hardcoded sample); body copy
  `Not in the catalog. Try the catalog instead.`; both links present and pointed
  correctly (`Back to catalog` → `/catalog`, `Back home` → `/`).
- Truncation rule implemented correctly: >60 chars (excluding leading `/`) truncates to
  57 chars + `…`; a boundary test at exactly 60 chars confirms no truncation there.
  `overflow-wrap: anywhere` is present in CSS as the second line of defense. `pathname`
  renders as plain JSX text (never `dangerouslySetInnerHTML`); a test with a
  URL-encoded `<script>` segment confirms no script tag lands in the DOM.
- Styling in `index.css` uses the exact tokens D5 names (`--zjc-alert` heading,
  `--zjc-font-mono`/`--zjc-fg-muted` status line, grid-motif background) — no new
  contrast pairs invented, matching the style guide's existing table.
- **Confirmed the `"Back to home"` → `"Back home"` test-text change is legitimate, not a
  regression**: it's the one pre-existing assertion in `ProductPage.test.tsx` that
  depended on E3's original placeholder link text; D5 §2 fixes the real copy as
  `Back home`, and the underlying behavior that test guards (unknown slug → `NotFoundPage`)
  is unchanged and still asserted by the same test. This is a copy correction, not a
  content or behavior regression.

## 3. Hidden 13th product via Konami code

**Sequence-matching algorithm** (`apps/web/src/eggs/konami.ts`), traced directly rather
than taken on the PR description's word:
- `KONAMI_SEQUENCE` is the unmodified classic 10-key sequence D5 specifies.
- `nextKonamiProgress(progress, key)`: on a match at the current index, returns
  `progress + 1`; the caller (`KonamiEasterEgg.tsx`) is responsible for treating
  `progress === SEQUENCE.length` as complete and resetting to 0 — verified the caller
  does exactly that. On a mismatch, the function falls through to re-checking the pressed
  key against `SEQUENCE[0]`, returning `1` if it matches and `0` otherwise — this is
  precisely D5's "fumbled retry" rule (reset-then-recheck-against-first), not an
  approximation of it. `konami.test.ts` has a dedicated test for the
  ArrowUp-ArrowUp-**ArrowUp** fumble case (expects progress `1`, not `0`) and a follow-on
  test that completes the sequence from that restart point — both assert the actual
  behavior the spec calls out by name, not just a generic "resets on wrong key" case.
- Editable-element guard: `isEditableTarget()` checks `tagName` for
  `INPUT`/`TEXTAREA`/`SELECT` and `isContentEditable`, and the listener
  (`KonamiEasterEgg.tsx`) calls this against `document.activeElement` and returns early —
  no advance, no reset — before touching `nextKonamiProgress` at all. A test renders a
  real focused `<input>` and confirms typing the full sequence neither unlocks nor shows
  the banner. `preventDefault()` is never called (verified in code and by a test that
  checks every `fireEvent.keyDown` dispatch returns `true`, meaning nothing canceled it).

**localStorage unlock flag**: `setKonamiUnlocked()`/`isKonamiUnlocked()` wrap both the
write and the read in `try/catch`, falling back to a module-level `memoryUnlocked`
boolean — this is the same shape as `CartContext.tsx`'s `readStoredCart()`/write-effect
pattern (try/catch around both the read and the write, empty/falsy fallback on failure,
never throws up to the caller). A test mocks both `setItem` and `getItem` to throw and
confirms `setKonamiUnlocked()` doesn't throw and `isKonamiUnlocked()` still returns `true`
afterward via the in-memory path.

**Critical gating check** — read `ProductPage.tsx`'s `findProduct` directly:
```ts
function findProduct(slug: string): Product | undefined {
  if (slug === hiddenProduct.id) {
    return isKonamiUnlocked() ? hiddenProduct : undefined;
  }
  return products.find((product) => product.id === slug);
}
```
`isKonamiUnlocked()` is called fresh inside `findProduct`, which itself runs on every
`ProductPage` render/mount (it's a plain function call at the top of the component body,
not a module-level constant or a value computed once and memoized) — there is no caching
that could go stale. Confirmed by reading the surrounding component: no `useMemo`,
`useState` initializer, or module-scope variable holds this result.

Direct/guessed navigation to `/product/200-ok` without the flag set still falls through
to the same `NotFoundPage` any other unmatched slug gets — no special route registration,
matching D5's explicit requirement. Traced and ran the tests that claim to prove this:
- Pre-unlock: `ProductPage.test.tsx`'s pre-existing "does not reveal the hidden 13th
  product by its fixed slug via ordinary navigation" test, plus a new
  `App.test.tsx` test navigating straight to `/product/200-ok` with no keys pressed.
  Both genuinely start from a clean flag — confirmed `apps/web/src/test/setup.ts` has a
  global `afterEach` that calls `window.localStorage.clear()` after every test (the same
  mechanism E3's cart-persistence tests already rely on), so these aren't just passing by
  accident of test order.
- Post-unlock: a new describe block sets `KONAMI_STORAGE_KEY` directly and asserts the
  real product detail renders (name, price, description, special-copy block, size picker,
  Add to Cart) — same full treatment as any of the other 12, as D5 requires. A second test
  sets an unrelated flag (`some-other-flag`) and confirms it does *not* unlock — a good
  check against a too-loose gate.
- Persistence-across-reload: unmounts and re-renders a fresh component tree with the flag
  still in `localStorage` (the same pattern `CartContext`'s own persistence test uses) —
  this genuinely tests that the gate re-reads storage on a fresh mount rather than relying
  on any component state carried across the unmount, which is exactly the "not cached at
  module load" property that mattered most here.
- I additionally ran the full Konami key sequence end-to-end through `App` in
  `App.test.tsx` (not just the isolated `KonamiEasterEgg` component) and confirmed
  clicking the banner's link actually lands on the real product page and updates
  `window.location.pathname` — this exercises the full integration path, not just the
  unit-level pieces in isolation.

**Confirmation banner**: copy is exact (`Item unlocked.`, no exclamation, no
congratulatory language, per D5's flat tone note), the link and `×`
(`aria-label="Dismiss"`) are both present and functional, the whole region is
`aria-live="polite"`, there's no auto-dismiss timer, and clicking `×`/the link/a route
change (via a `pathname`-keyed effect) are the only ways it goes away — matches D5's
"persistent, not a timed toast" requirement precisely. Confirmed no `preventDefault()`
anywhere in the keydown path (see above), so scroll/typing behavior is unaffected whether
or not a sequence is in progress.

**Judgment call — banner placement**: D5 left the banner's exact screen position open;
the Engineer chose a fixed, centered, bottom-of-viewport "toast" position keyed to
`--zjc-z-toast`. **This is a reasonable interpretation and doesn't need Creative Director
input before merging.** Reasoning: it reuses an existing, already-named token
(`--zjc-z-toast`) for exactly the semantic category D5 itself invokes ("the same layer
already named for the 'added to bag' toast... this is the same category of ephemeral
confirmation UI"), it's the conventional position for this UI pattern, it's
non-blocking (`pointer-events: none` on the outer region, `auto` only on the banner
itself, so it never eats clicks elsewhere on the page while present), and D5's own
"Notes for the Engineer" section explicitly anticipates this exact call being made by the
Engineer and only asks that it be flagged if the Creative Director later wants something
different — which the PR file does. No open spec ambiguity remains that would block
merge; flagging to Creative Director is optional/FYI, not a blocking dependency.

## 4. Ownership check

`git diff main..feat/web-easter-eggs --stat` touches only:
`apps/web/index.html`, `apps/web/src/{App.tsx,App.test.tsx}`,
`apps/web/src/eggs/**` (new), `apps/web/src/index.css`, `apps/web/src/index-html.test.ts`
(new), `apps/web/src/layout/Layout.tsx`, `apps/web/src/pages/{NotFoundPage.tsx,
NotFoundPage.test.tsx,ProductPage.tsx,ProductPage.test.tsx}`, and
`docs/prs/feat-web-easter-eggs.md`. All within `apps/web/**` (Engineer-owned) and
`docs/prs/**` (author-owned for its own branch). No `docs/design/**`,
`docs/architecture/**`, or root config touched.

`Layout.tsx`'s change is one import + one JSX line (`<KonamiEasterEgg />`), placed after
the closing `</footer>` — structurally and visually separate from the
`site-header__actions` block (cart indicator/nav toggle) that E4's cart-drawer branch is
likely to touch. `App.tsx`'s change is one import + an 8-line `useEffect` block, additive
only (no existing code path modified). Read both diffs directly; both are exactly as
small as the PR file claims.

## 5. Checks run myself (isolated detached worktree at `8e34363`, Node v22.12.0)

Ran independently, not copied from the PR file:

```
$ npm install        # clean, 0 vulnerabilities
$ npm run typecheck   # clean, no output
$ npm run lint        # clean, no output
$ npm test
 Test Files  15 passed (15)
      Tests  128 passed (128)
(tools/scan-secrets.test.mjs: 9/9 passed, via node --test)
$ npm run build       # ✓ built in 451ms; dist/index.html inspected directly, comment present verbatim
$ npm run scan-secrets
scan-secrets [working-tree]: 140 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS
$ npm run audit:ci
found 0 vulnerabilities
```

All match the PR file's claimed output (128/128 tests, clean typecheck/lint/build,
0 vulnerabilities, secrets scan pass) — no discrepancy between claimed and actual.

## Accessibility spot-check (basic hygiene pass)

- Dismiss button (`.konami-banner__dismiss`) has no component-local focus style, but
  `index.css`'s global `button:focus-visible` rule covers it — verified this rule exists
  and applies (no `outline: none` override anywhere in the new CSS).
- Dismiss button meets the `--zjc-tap-min` minimum tap-target size token.
- 404 page and Konami banner both use only tokens already present in the D2 contrast
  table (no new, unverified color pairing introduced).
- Confirmation banner and console/view-source surfaces require no motion; the one
  optional entrance transition D5 allowed was deliberately skipped (static
  appear/disappear), so there's nothing new to gate behind `prefers-reduced-motion` here.

## Broken-link / secrets / dependency check

- No new dependencies added (PR file confirms; `package-lock.json` untouched by this
  branch — confirmed via the diffstat above).
- `scan-secrets` and `audit:ci` both clean (see §5).
- Both 404 links (`/catalog`, `/`) and the Konami banner's link (`/product/200-ok`)
  resolve to real, already-existing routes.

## Board update

E6 marked `approved` in `docs/architecture/board.md`, waiting on the lead to push/merge
the real PR.

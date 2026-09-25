# feat/web-polish: responsiveness, a11y, and test/build cleanup (E7)

Author: engineer. Branch: `feat/web-polish`. Base: `main` (282b8dd, after PR #61,
`docs/board-e6-done`).

## What changed

Board task E7 (`docs/architecture/board.md`): the wrap-up polish pass across the whole
`apps/web` app before the Architect's MVP readiness report — responsiveness, an
accessibility pass, and test/build cleanup. No new features, no new pages, no network
calls, no external assets. Every page (home, catalog, product detail, lookbook, about,
404) and the cart drawer were reviewed.

Most of the app was already solid — E1-E6 built carefully to the design tokens/style
guide, and this pass mostly confirmed that (single `<main>` per page, correct heading
hierarchy with no skipped levels, `aria-hidden` on decorative placeholder tiles, no raw
hex colors anywhere outside `tokens.css`, `prefers-reduced-motion` already handled
consistently everywhere motion exists). Four real, concrete things needed fixing:

### 1. Required fix — `CartDrawer.tsx` cyclic focus trap (carried over from E4's review)

`docs/architecture/reviews/feat-web-checkout.md` §5 flagged that `CartDrawer.tsx` had no
Tab/Shift+Tab focus trap: tabbing past the drawer's last focusable element (or
Shift+Tab from its first) moved focus into the dimmed background page behind it — a real
keyboard-accessibility bug (a keyboard-only user could reach and activate a background
control, e.g. a header nav link, while the drawer was still visually open), not just a
"doesn't wrap nicely" cosmetic issue.

Fixed in `apps/web/src/cart/CartDrawer.tsx`: the existing Escape-key `keydown` listener
(added in E4) now also intercepts `Tab`. On every Tab/Shift+Tab keypress it queries the
live set of focusable elements inside the dialog panel (recomputed each time, not
memoized, since the set changes as the drawer's internal `step` changes between
cart/checkout/placed), and:
- Tab from the last focusable element (or from the panel itself, the initial-focus
  target right after open) wraps to the first.
- Shift+Tab from the first focusable element (or from the panel itself) wraps to the
  last.
- Tab/Shift+Tab from any element in the middle is left to the browser's native
  behavior (no `preventDefault()`), since the next/previous focusable element in
  document order is already the correct next item inside the panel.

Focus already moved into the drawer on open and returned to the trigger button on
close (both pre-existing, from E3/E4) — only the missing trap itself was added.

**Tests added:**
- `CartDrawer.test.tsx`: a new test that seeds two cart items, opens the drawer, walks
  Tab forward through every real focusable element in the dialog (computed from the
  live DOM, same selector the component itself uses) confirming each one gets focus in
  order, then asserts one more Tab wraps to the first element and Shift+Tab from the
  first wraps to the last.
- `App.test.tsx`: an integration-level regression test using the real header — opens
  the drawer via the real "Open cart" button, then Tabs 15 times (far more than the
  dialog has focusable elements) and asserts on every single tab that the header's
  "Catalog" nav link (a concrete background control) never gets focus and that
  `document.activeElement` stays contained within the dialog the whole time.

### 2. `apps/web/index.html`: leftover `color-scheme: dark` meta tag

Found while checking contrast/theming: `<meta name="color-scheme" content="dark">` was
still present in `index.html`, a leftover from the old, now-superseded dark-only
terminal project. It directly contradicted `docs/design/tokens.css`'s `:root {
color-scheme: light; }` (D2, explicit: "light is the default and only full-site theme
for v1") — telling the browser to render native UI (scrollbars, form controls, etc.) in
dark mode against this site's light page. Changed to `content="light"`.

Added a regression test in `index-html.test.ts` asserting the meta tag's value matches
`tokens.css`'s declared color-scheme.

### 3. `apps/web/src/index.css`: site header overflows at real narrow-phone widths

Found by running the actual app in a headless browser at mobile widths (not just
reading the CSS): at 320px and 375px viewports — 320px is the iPhone SE width, 375px is
the standard iPhone width — the site header's brand wordmark, "Cart (N)" indicator,
"Open cart" button, and hamburger nav toggle together didn't fit on one row. The
hamburger button (the only way to open the mobile nav below the 640px breakpoint) was
pushed off-screen entirely, unreachable by touch or by scrolling into view — every page
was affected, since `Layout.tsx`'s header is shared.

Fixed with a fluid change, not a new breakpoint: `.site-header__bar` now has
`flex-wrap: wrap` so the actions cluster (cart indicator + cart toggle + nav toggle)
drops to its own row under the brand only when it genuinely doesn't fit; `.site-header__actions`
grows to fill the remaining width (`flex: 1 0 auto`) and right-aligns its own content
(`justify-content: flex-end`) so the wrapped row still lines up flush right, matching
the unwrapped desktop layout. No visual change at any width where the row already fit
(verified — screenshots at 640/700/960/1280px are pixel-identical in layout to before).

### 4. `apps/web/src/index.css`: CSS Grid "blowout" on the catalog and lookbook grids

Same headless-browser check found a second, related bug: at 320px, the catalog grid's
2-column layout overflowed the viewport by ~49px, clipping the second column's product
card. Root cause: `grid-template-columns: repeat(2, 1fr)` — a bare `1fr` track's
default `min-width` is `auto`, which floors the track at its content's min-content size
(here, the product name/category/price row) rather than letting it shrink to fit,
letting the grid grow past its container instead of the text wrapping. This is a
well-known CSS Grid gotcha, not specific to this codebase's markup.

Fixed by changing every multi-column `repeat(N, 1fr)` to `repeat(N, minmax(0, 1fr))`
in `.catalog-grid` (2/3/4-column rules) and `.lookbook-cards` (2/3-column rules) — five
call sites total. `minmax(0, 1fr)` lets a track shrink below its content's natural
size, so text wraps instead of the grid overflowing.

Added `apps/web/src/index-css.test.ts` (new file) as a permanent, cheap regression
guard for both CSS fixes (#3 and #4) — jsdom doesn't compute real layout, so it can't
assert actual overflow the way the headless-browser check did; instead it asserts the
literal fixed rules are present (`.site-header__bar` has `flex-wrap: wrap`; no bare
`repeat(N, 1fr)` remains anywhere, and the 5 known `repeat(N, minmax(0, 1fr))` call
sites are all still there). Reads the file directly via `node:fs` rather than
`import ... from "./index.css?raw"`, since Vite's built-in CSS plugin intercepts `.css`
imports before the generic `?raw` convention applies (confirmed by hand: that import
resolves to an empty string in this test setup, unlike `.html?raw`, which
`index-html.test.ts` already uses successfully for the same raw-content-assertion
pattern).

### Verification method

The responsiveness claims above aren't just read off the CSS — I installed Playwright
(temporarily, in `/tmp`, not committed to the repo or added as a project dependency),
ran the actual dev server, and drove a headless Chromium across all 6 pages at 320,
375, 700, 960, and 1280px widths (32 checks total: 6 pages × 5 widths, plus the cart
drawer opened at 320px and 375px), asserting `document.documentElement.scrollWidth`
never exceeds the viewport width and inspecting screenshots. Before the fixes: 14 of 32
checks overflowed (the header bug hit every page at 320/375px) plus 1 more (the grid
blowout, catalog only, 320px). After: 0 of 32 overflow, confirmed with fresh
screenshots at every width including desktop (to confirm no visual regression there).

## New dependencies

None shipped in `apps/web/package.json` or the repo root. Playwright was installed
temporarily outside the repo (`/tmp/pw-check`, a scratch npm project, not touching
`package.json`/`package-lock.json`) purely as a one-time manual verification tool for
this PR, then removed. It is not a project dependency and nothing in the committed code
references it.

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

Manual: `npm run dev -w @site/web`, resize the browser (or use dev tools' device
toolbar) from ~320px through desktop widths on every page — the header now wraps
cleanly instead of clipping the hamburger button, and the catalog/lookbook grids no
longer overflow. Open the cart drawer, then Tab repeatedly — focus now cycles within
the dialog indefinitely instead of escaping to the page behind it; Shift+Tab from the
first control wraps to the last.

## Real command output

Run in `.claude/worktrees/agent-a39a7014a2e2636b7`, Node v22.12.0.

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
Not implemented: navigation to another Document   (jsdom noise, pre-existing —
                                                     confirmed identical count (5)
                                                     before and after this branch's
                                                     changes; not a regression)

 Test Files  17 passed (17)
      Tests  157 passed (157)
   Start at  17:35:00
   Duration  2.6s

TAP version 13
# Subtest: clean tree passes (exit 0)
ok 1 - clean tree passes (exit 0)
# Subtest: planted fake secrets are caught (exit 1) and never printed
ok 2 - planted fake secrets are caught (exit 1) and never printed
# Subtest: generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
ok 3 - generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
# Subtest: token-format secrets in test paths still fail
ok 4 - token-format secrets in test paths still fail
# Subtest: inline allow marker and allowlist file (with reason) suppress findings
ok 5 - inline allow marker and allowlist file (with reason) suppress findings
# Subtest: allowlist entry without a reason is rejected (exit 2)
ok 6 - allowlist entry without a reason is rejected (exit 2)
# Subtest: --path scans a directory (for build output)
ok 7 - --path scans a directory (for build output)
# Subtest: --history finds a secret that was committed then deleted
ok 8 - --history finds a secret that was committed then deleted
# Subtest: usage errors exit 2
ok 9 - usage errors exit 2
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
✓ 49 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.59 kB │ gzip:  0.36 kB
dist/assets/index-TqR6siyd.css   24.06 kB │ gzip:  4.30 kB
dist/assets/index-DfB4jRoc.js   250.68 kB │ gzip: 78.00 kB
✓ built in 457ms

$ npm run scan-secrets
> zerojance-site@0.0.0 scan-secrets
> node tools/scan-secrets.mjs
scan-secrets [working-tree]: 146 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
> zerojance-site@0.0.0 audit:ci
> npm audit --audit-level=high
found 0 vulnerabilities
```

17 test files, 157 tests total, all passing (up from 16 files / 152 tests on `main`).
New/extended test files: `cart/CartDrawer.test.tsx` (extended: the cyclic focus-trap
test), `App.test.tsx` (extended: the background-unreachable-by-Tab integration test),
`index-html.test.ts` (extended: the color-scheme regression test), `index-css.test.ts`
(new: the two CSS-regression tests for the header-wrap and grid-blowout fixes). No
tests were removed; nothing was found flaky.

## Cross-cutting constraints confirmed

- **No new features, no new pages.** Every change is either an accessibility fix
  (focus trap), a correctness fix to existing markup/styling (color-scheme meta,
  header overflow, grid blowout), or a test addition proving one of those fixes.
- **No network calls, no external assets.** Nothing in this branch adds a fetch, a
  third-party font, or an external asset reference. The temporary Playwright install
  used to verify responsiveness lives outside the repo and isn't part of the shipped
  code or `package.json`.
- **Mock cart discipline unaffected.** `CartDrawer.tsx`'s only change is the focus-trap
  keydown handling; `handlePlaceOrder`'s mock-checkout comment and behavior are
  untouched.
- **No fabricated facts.** No copy changed in this branch at all — every fix is
  structural (CSS/JS), not content.
- **Dependencies.** None added to any `package.json` or lockfile.

## Notes for the Architect

- The header/grid overflow bugs (items 3-4) weren't in the original E7 task
  description verbatim — they were found by actually running the app at mobile
  widths, per E7's explicit instruction to "review every page... at mobile through
  desktop widths" and "fix anything that overflows, misaligns, or breaks." Flagging
  both clearly here since they're real, user-facing bugs that shipped in earlier
  merged PRs (E1's header shell, E2's catalog grid, E5's lookbook grid) and went
  unnoticed until an actual browser-width check, not because the CSS looked wrong on
  read-through.
- No new breakpoints were introduced anywhere — the header fix is a fluid `flex-wrap`
  (no media query at all) and the grid fix only changes the value inside existing
  `repeat()` calls at the existing 640/960px breakpoints.
- I did not touch `Layout.tsx`'s markup structure at all (no `inert`/`aria-hidden` on
  background landmarks) — the cyclic focus trap alone fully closes the keyboard-escape
  gap the E4 review flagged, per that review's own framing of what "closes the gap"
  requires, and is a smaller, more self-contained change than restructuring the
  background landmarks would have been.
- Full manual walk-throughs done during this pass (not just the automated checks
  above): tabbed through every page's nav, catalog → product → add to cart → cart
  drawer → checkout → place order, the Konami code entry and its banner's dismiss/link,
  and the nav toggle — nothing else was found to be a keyboard trap or unreachable.
  Landmarks (one `<main>` per page, correct `<nav>`/`<header>`/`<footer>`), heading
  hierarchy (no skipped levels on any page), and the D2 contrast table were all
  spot-checked against the current markup/CSS with no new violations found — no raw
  hex color or ad hoc spacing/duration value exists anywhere outside `tokens.css`.

## Status

Ready for Architect review. Board status for E7: `review`.

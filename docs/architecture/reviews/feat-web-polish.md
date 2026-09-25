# Review: `feat/web-polish` (E7 — responsiveness, a11y pass, test cleanup)

Reviewer: Architect. Date: 2026-09-25. Branch base: `main` at `282b8dd`. PR file:
`docs/prs/feat-web-polish.md`. One commit reviewed: `f4492ad`.

**Verdict: approved.** No required changes. This is the last engineering gate before
the MVP readiness report (A3); reviewed accordingly — full diff read directly, both new
tests read line-by-line, and all seven checks re-run myself rather than trusted from the
PR file.

## 1. Focus trap (the hard-required fix, carried over from E4's review)

Read `CartDrawer.tsx`'s new Tab/Shift+Tab handling directly, not just the PR's
description of it.

- **Live, not stale.** `getFocusable()` is a plain function defined inside the `useEffect`
  body and called fresh on every `keydown`, querying `panelRef.current.querySelectorAll(...)`
  each time — not a snapshot captured once at open-time. The PR's own comment is correct
  that this matters here specifically: the panel's content changes shape as `step` moves
  cart → checkout → placed, each rendering a different button/link set, so a memoized
  open-time snapshot would trap focus against a stale set as soon as the step changed
  (e.g. after clicking "Checkout", the drawer's cart-step remove/qty buttons disappear
  and checkout-step buttons appear — a snapshot taken at open would still contain the
  removed cart-step buttons and miss the new checkout-step ones). Confirmed there is no
  `useMemo`/`useRef`-cached focusable list anywhere in this file.
- **Selector correctness.** `'a[href], button:not([disabled]), input:not([disabled]),
  select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'`
  correctly excludes disabled controls (relevant here: a freshly-seeded cart item's
  decrease-quantity button is disabled at qty 1) and matches the panel's actual DOM/tab
  order, since nothing in this panel sets a custom `tabindex`.
- **Wrap logic, traced by hand for all four boundary cases:**
  - Tab from the last element (`activeIndex === focusable.length - 1`) → `preventDefault`
    + focus first. Correct.
  - Tab from an untracked/lost focus state (`activeIndex === -1`, e.g. the panel itself
    right after open, before any Tab) → also wraps to first. Correct forward behavior
    from the initial-focus target.
  - Shift+Tab from the first element (`activeIndex <= 0`, which covers both index `0`
    and the `-1` untracked/panel case) → `preventDefault` + focus last. Correct, and
    correctly symmetric with the forward case for the initial-focus target.
  - Any Tab/Shift+Tab from a middle element: no `preventDefault`, left to native browser
    tab order. Sound, since focusable-list order already matches DOM/visual order here —
    the component doesn't need to hijack every keystroke, only the two wrap boundaries.
  - Empty-focusable-list defensive branch (`focusable.length === 0`) pins focus back to
    the panel rather than leaking out; correctly guarded as a "shouldn't happen but stay
    safe" case, since every step renders at least a close/back button.
- **No trap when closed.** The `useEffect` returns early (`if (!open) return;`) before
  registering the `keydown` listener, and depends on `[open, onClose]` — React runs the
  previous effect's cleanup (which removes the listener) before re-running on `open`
  transitioning to `false`, so there is no listener registered, and therefore no trap,
  while the drawer is closed. Also confirmed the always-mounted-but-closed panel has
  `role`/`aria-modal`/`aria-labelledby` all conditionally `undefined` when closed, and
  `tabIndex={-1}` keeps it out of tab order regardless — consistent with the pre-existing
  E4 mounting strategy, unchanged by this branch.

**Tests.** Read both directly, not skimmed:
- `CartDrawer.test.tsx`'s new test seeds two real cart items, opens the drawer, computes
  the actual live focusable set from the rendered DOM (same selector the component uses,
  independently re-typed in the test rather than imported — good: it wouldn't catch a
  selector typo shared between component and test, but it does prove the two lists agree
  by construction of the DOM, which is what actually matters), asserts the count is 6
  (close, two items × (increase + remove) since decrease is disabled at qty 1, checkout —
  correct arithmetic), tabs through every one confirming order, then asserts one more Tab
  wraps to first and Shift+Tab from first wraps to last. This is a real behavioral test,
  not a "didn't throw" check.
- `App.test.tsx`'s new integration test opens the drawer via the real header "Open cart"
  button (not a direct component render), grabs the real header "Catalog" nav link,
  Tabs 15 times (comfortably more than the dialog's 6 focusable elements, so it must
  wrap at least twice), and on **every** iteration asserts both that the nav link never
  gets focus and that `document.activeElement` stays contained inside the dialog. This is
  exactly the scenario E4's review flagged as the real risk (a keyboard user reaching a
  dimmed background control while the drawer is still open), tested through the real
  rendered app rather than an isolated component.

This is a correct, well-tested cyclic focus trap. The single highest-stakes item in this
branch is resolved.

## 2. Stale dark-theme meta tag

`apps/web/index.html`: `<meta name="color-scheme" content="dark" />` →
`content="light"`, now matching `docs/design/tokens.css`'s `:root { color-scheme: light;
}` (D2). Confirmed via diff (one-line change, nothing else in `index.html` touched) and
via a project-wide grep for `dark` across `apps/web/src` and `index.html`: every
remaining hit is either the intentional, component-scoped `--zjc-panel-*` dark-panel
callout (explicitly not a site-wide theme per D2/style-guide.md §3) or a comment
describing it — nothing else in the app assumes or references a dark theme. New
regression test in `index-html.test.ts` asserts the meta tag matches `tokens.css`'s
declared value. No regression found.

## 3. Mobile header overflow fix

Read the CSS directly. `.site-header__bar` gains `flex-wrap: wrap` (plus `row-gap` using
an existing space token) and `.site-header__actions` gains `flex: 1 0 auto` +
`justify-content: flex-end`. This is a minimal, sound fix for the described problem: no
new breakpoint, no change to any other rule, and the right-alignment on
`.site-header__actions` is exactly what's needed so the wrapped second row still reads
as "actions cluster, right-aligned" rather than snapping to the left edge when it drops
below the brand. I did not re-run a headless browser myself to visually confirm the
320-375px fix — I judged it from reading the CSS and the new `index-css.test.ts`
regression test (which asserts the literal `flex-wrap: wrap` rule is present), consistent
with the task instructions that this should be sufficient. Noting the gap plainly per the
task's own instruction: **not independently visually verified this review**, only
read/reasoned about. The mechanism (flex-wrap causing overflow content to drop to a new
line instead of clipping) is standard and correctly targeted at the described symptom.

## 4. CSS Grid blowout fix

Confirmed all 5 claimed call sites changed from `repeat(N, 1fr)` to
`repeat(N, minmax(0, 1fr))`: `.catalog-grid` base (2-col), 640px (3-col), 960px (4-col);
`.lookbook-cards` 640px (2-col), 960px (3-col). This is the textbook-correct fix — a bare
`1fr` track's implicit `min-width: auto` floors it at the content's min-content size
(here, an unbreakable-ish product name/price row), which is exactly the overflow
mechanism described; `minmax(0, 1fr)` removes that floor so the track can shrink and text
wraps instead. Verified by reading `index.css`'s diff directly (not taking "5 call sites"
on faith) and cross-checked against `index-css.test.ts`, which asserts zero remaining
bare `repeat(N, 1fr)` patterns and exactly 5 `repeat(N, minmax(0, 1fr))` matches — a
correct regression guard against a partial fix or an accidental rule deletion.

## 5. General a11y/responsiveness spot-checks

Rather than taking "already solid" at face value, spot-checked directly:
- **Single `<main>` per page:** confirmed `Layout.tsx` (untouched by this branch — see
  §6) owns the one `<main id="main-content">` landmark; `LookbookPage.tsx` and
  `AboutPage.tsx` both use a top-level `<section>`, with an explicit comment in
  `LookbookPage.tsx` noting it deliberately doesn't render a second `<main>`. Their own
  test files (`AboutPage.test.tsx`, `LookbookPage.test.tsx`) assert this structurally.
- **Heading hierarchy:** read every page component's headings directly. Home (`h1`
  only), Catalog (`h1` only), Product (`h1` only), 404 (`h1` only), About (`h1` then four
  `h2` sections, no skip), Lookbook (`h1`, then one `h2` per look — `h3` for each look's
  product names per its own test comment). No level-skipping found anywhere.
- **`aria-hidden` on decorative tiles:** confirmed in `ProductCard.tsx` (placeholder
  image-area span) and `LookbookCard.tsx` (placeholder image-area div), both with a
  comment explaining the real text label is announced separately below, which is the
  correct pattern (decorative visual duplicate hidden, real content exposed once).

Nothing found in this spot-check contradicts the PR's "already solid" claim.

## 6. Ownership

`git diff main..feat/web-polish --stat` confirms exactly: `apps/web/index.html`,
`apps/web/src/App.test.tsx`, `apps/web/src/cart/CartDrawer.test.tsx`,
`apps/web/src/cart/CartDrawer.tsx`, `apps/web/src/index-css.test.ts` (new),
`apps/web/src/index-html.test.ts`, `apps/web/src/index.css`,
`docs/prs/feat-web-polish.md`. All within `apps/web/**` and `docs/prs/**`, matching the
ownership map. `Layout.tsx` diff is empty (`git diff main..feat/web-polish --
apps/web/src/layout/Layout.tsx` produces no output) — the PR's claim of leaving it
untouched (no `inert`/`aria-hidden` restructuring) holds; the focus trap alone closes the
gap, which is a reasonable scope call I agree with. No `package.json` or lockfile
anywhere in the diff — the "no new dependencies, Playwright installed only to `/tmp`"
claim holds structurally (nothing to add if nothing was touched).

## 7. Checks run myself

Ownership map assigns `feat/web-polish` to the Engineer's worktree
(`.claude/worktrees/agent-a39a7014a2e2636b7`, already checked out there). Since a branch
can only be checked out in one worktree at a time, I added a temporary detached worktree
at the branch's tip commit (`f4492ad`) to run checks independently, then removed it after
(`git worktree remove`).

```
$ npm install
added 307 packages, audited 309 packages — 0 vulnerabilities

$ npm run typecheck
tsc --noEmit -p tsconfig.json   (clean, no output)

$ npm run lint
eslint .   (clean, no output)

$ npm test
 Test Files  17 passed (17)
      Tests  157 passed (157)

$ npm run build
✓ 49 modules transformed, built in 458ms
dist/index.html                   0.59 kB
dist/assets/index-....css        24.06 kB
dist/assets/index-....js        250.68 kB

$ npm run scan-secrets
scan-secrets [working-tree]: 147 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
found 0 vulnerabilities
```

157/157 across 17 files matches the PR's claimed output exactly (up from 152/16 on
`main`, as claimed). My scan-secrets file count (147) is one higher than the PR's (146)
for the same reason noted in the E4 review — I ran `build` before `scan-secrets`, which
adds a scanned `dist/` artifact; 0 warnings/errors either way, not a concern.

Also spot-checked internal links for the hygiene pass: every `<Link to="...">` target in
the diff-adjacent code (`/catalog`, `/`, `/product/200-ok`) resolves to a route this
branch didn't touch and prior reviews (E3/E6) already verified; no new links were added
by this branch, so no new broken-link risk.

## Summary

E7 meets its definition of done. The one hard-required item — a correct, live-computed,
correctly-wrapping, correctly-scoped-to-open cyclic focus trap on `CartDrawer.tsx`,
closing the exact keyboard-accessibility gap E4's review flagged — is implemented
correctly and proven by two tests that test the real claim (a live component-level walk
of the actual focusable set, and an integration-level 15-tab walk through the real header
button confirming a real background nav link is unreachable). The stale dark
`color-scheme` meta tag is fixed and now consistent with D2, with no other place in the
app assuming a dark theme. The header-overflow and grid-blowout fixes are both sound,
minimal, correctly scoped to the described bugs, and covered by a new lightweight
regression test file. Ownership boundaries held (`apps/web/**` and `docs/prs/**` only,
`Layout.tsx` untouched, no dependency changes). All seven requested checks
(`npm install`, `typecheck`, `lint`, `test` at 157/157 across 17 files, `build`,
`scan-secrets`, `audit:ci`) pass with real output matching the PR's claims, re-run
independently in a temporary detached worktree rather than trusted from the PR file.

**Board update:** E7 marked `approved` in `docs/architecture/board.md`. This was the
last item blocking A3 (MVP readiness report) — now unblocked.

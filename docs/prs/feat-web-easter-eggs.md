# feat/web-easter-eggs: the three D5 easter eggs (E6)

Author: engineer. Branch: `feat/web-easter-eggs`. Base: `main` (ab6a062, after PR #55,
`docs/board-e5-done`).

## What changed

Board task E6 (`docs/architecture/board.md`): implements the three easter eggs specced in
`docs/design/easter-eggs.md` (D5), exactly as specified — no more, no less. Nothing else
in scope (E4's cart drawer/checkout is a separate, parallel branch; not touched here).

### Egg 1 — Dev-console / view-source message (D5 §1)

**`apps/web/index.html`** — a static HTML comment inserted directly after `<title>` and
before `</head>`, exact content:
```html
<!--
  view-source: 200 OK.
  Nothing else is hidden in the markup — try the console.
-->
```
Verified to survive `vite build` unchanged (checked the real `dist/index.html` output).

**`apps/web/src/eggs/devConsole.ts`** — `logDevConsoleMessage()`, three `console.log`
calls in the exact order/content D5 specifies (brand name with the inline style, the
"console.log is still the most common debugger" line, and "Not everything here is in the
catalog." — the only discoverability hint anywhere on the site for egg 3). Called from a
`useEffect(() => { ... }, [])` in `App` (`src/App.tsx`) — fires once per full page load,
not once per client-side route change, since `App` itself only mounts once and only
`Pages` re-renders on navigation.

### Egg 2 — Joke 404 page (D5 §2)

**`apps/web/src/pages/NotFoundPage.tsx`** — rewritten per D5's exact copy: heading `404`;
a monospace status line built from the real `pathname` via `useRouter()` (`GET
{pathname} → 404 Not Found`), truncated to 57 chars + `…` past a 60-char pathname
(excluding the leading `/`); body copy `Not in the catalog. Try the catalog instead.`;
two real links (`Back to catalog` → `/catalog`, `Back home` → `/`). `pathname` renders as
plain JSX text, never `dangerouslySetInnerHTML` — React escapes it automatically.

This also covers `/product/200-ok` whenever it isn't unlocked (egg 3, below) — no
special-casing needed in this file, it's just another unmatched-at-render-time lookup
rendering the same page, per D5's explicit note that `matchRoute.ts` needs no changes.

**Styling** (`apps/web/src/index.css`, `.page-not-found*`): the grid-motif background
applied directly to the page section (style-guide.md §3's sanctioned "404 page
background" case), `--zjc-alert` heading color, `--zjc-font-mono`/`--zjc-fg-muted`
status line with `overflow-wrap: anywhere` as the second line of defense against a long
pathname forcing horizontal scroll on mobile.

### Egg 3 — Hidden 13th product via Konami code (D5 §3)

**`apps/web/src/eggs/konami.ts`** — the pure, DOM-independent sequence matcher, kept
separate from the DOM listener per D5's explicit instruction so it's unit-testable
without simulating `keydown` events:
- `KONAMI_SEQUENCE`: the unmodified, classic 30-key-era code (`ArrowUp, ArrowUp,
  ArrowDown, ArrowDown, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, b, a`).
- `nextKonamiProgress(progress, key)`: advances progress on a match; on a mismatch,
  resets to 0, then re-checks the same key against `SEQUENCE[0]` — restarting at 1
  instead of 0 if it matches (the "fumbled retry" fix D5 calls out by name).
- `isEditableTarget`: true for `<input>`/`<textarea>`/`<select>`/`isContentEditable`, so
  a future text field can't have keystrokes silently intercepted.
- `setKonamiUnlocked()` / `isKonamiUnlocked()`: the exact `localStorage` key/value D5
  fixes (`zj_unlocked_200ok` = `"1"`), wrapped in the same try/catch +
  in-memory-fallback pattern E3 established in `CartContext.tsx` — a blocked/unavailable
  `localStorage` degrades to a session-only in-memory flag rather than breaking the
  reveal for that visit.

**`apps/web/src/eggs/KonamiEasterEgg.tsx`** — a single self-contained component: its own
`window`-level `keydown` listener (never calls `preventDefault()`, bails out entirely —
no advance, no reset — while focus is in an editable element) and a persistent,
non-modal, `aria-live="polite"` confirmation banner (`Item unlocked.`, a real link `View
200 OK Tee` → `/product/200-ok`, a `×` dismiss button with `aria-label="Dismiss"`). No
fixed timer — dismissed only by the × button, the link (which navigates), or any route
change. Re-entering the sequence after unlock simply re-shows the banner, no
special-casing. Mounted once in `Layout.tsx` (one import, one JSX line, placed after the
footer) so it's additive and merges cleanly regardless of what E4's cart-drawer branch
does elsewhere in that file.

**`apps/web/src/pages/ProductPage.tsx`** — `findProduct` now gates the hidden product's
fixed slug (`hiddenProduct.id`, `"200-ok"`) behind `isKonamiUnlocked()`, read fresh on
every call. This is a runtime check inside the lookup, not a route that doesn't exist —
`matchRoute.ts` is untouched — so guessing or typing `/product/200-ok` directly, without
ever entering the code, still falls through to `NotFoundPage`. No prop or context passes
from the listener to the page; they're decoupled entirely through `localStorage`, per D5.

**Styling** (`apps/web/src/index.css`, `.konami-banner*`): fixed position at
`--zjc-z-toast` (the same layer style-guide.md already names for the future "added to
bag" toast), a `--zjc-bg-surface` card with a `--zjc-ok` left-border accent, `--zjc-link`
link color, standard focus ring on the dismiss button. No entrance transition — D5
explicitly sanctions a static appear/disappear as an equally acceptable, simpler
baseline, so that's what's implemented (no motion to gate behind
`prefers-reduced-motion` here as a result).

### Incidental fix

`ProductPage.test.tsx`'s one pre-existing assertion that depended on the old placeholder
404 copy (`"Back to home"`) is updated to D5's exact, intentional copy (`"Back home"`) —
the still-404-before-unlock *behavior* that test guards is unchanged and still asserted;
only the link-text literal it checked was retired by D5.

## New dependencies

None.

## How to test

```
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Manual: `npm run dev -w @site/web`. View source on any page to see the comment; open dev
tools to see the three console lines (once, not repeated on navigation). Visit any
unmatched path (e.g. `/nope`) to see the 404 page; try a very long path to see the
truncated status line. On any page, focus the page body (not a form field — there isn't
one) and type the Konami code (`↑ ↑ ↓ ↓ ← → ← → b a`) — a banner appears at the bottom
("Item unlocked.", a link, a × button); click the link to land on the real `200 OK Tee`
detail page; reload and confirm `/product/200-ok` still resolves (persisted via
`localStorage`); in a fresh/incognito session, typing `/product/200-ok` directly still
404s until the code is entered.

## Real command output

Run in `.claude/worktrees/agent-a0cf92573c477b0b8`, Node v22.12.0.

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
                                                     pre-existing modified-click/
                                                     middle-click cases; not new)

 Test Files  15 passed (15)
      Tests  128 passed (128)
   Start at  15:46:12
   Duration  2.39s

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
✓ 48 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.59 kB │ gzip:  0.36 kB
dist/assets/index-E_jr7sng.css   18.82 kB │ gzip:  3.64 kB
dist/assets/index-xPtBzhFK.js   243.26 kB │ gzip: 76.35 kB
✓ built in 443ms

$ npm run scan-secrets
> zerojance-site@0.0.0 scan-secrets
> node tools/scan-secrets.mjs
scan-secrets [working-tree]: 139 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS
```

15 test files, 128 tests total, all passing. New/extended test files: `eggs/devConsole.
test.ts` (new), `eggs/konami.test.ts` (new), `eggs/KonamiEasterEgg.test.tsx` (new),
`pages/NotFoundPage.test.tsx` (new), `index-html.test.ts` (extended: view-source comment
present, positioned between `</title>` and `</head>`), `App.test.tsx` (extended: a new
"App easter eggs" describe block), `pages/ProductPage.test.tsx` (extended: a new "hidden
13th product" describe block covering both unlock directions plus persistence across a
simulated reload, and the one incidental 404-copy fix above).

## Cross-cutting constraints confirmed

- **Client-side only, zero network calls, zero external assets.** Nothing in this branch
  fetches, posts, or loads anything external. Every string is static or derived from
  `window.location`/`localStorage`.
- **Harmless.** The console/view-source surfaces are read-only. The 404 page is a normal
  page with two normal links. The Konami banner is dismissible, non-modal, doesn't trap
  focus, doesn't block navigation, and never calls `preventDefault()` on any of the ten
  keys (tested).
- **`prefers-reduced-motion` respected**: no new motion was added (D5's own sanctioned
  simpler baseline for the banner — a static appear/disappear), so there's nothing to
  gate; `tokens.css`'s existing `--zjc-dur-*` → `0ms` collapse under `reduce` remains the
  backstop everywhere else on the site.
- **No fabricated facts.** The view-source comment's "200 OK" framing and the console's
  "`console.log` is still the most common debugger" line are D5's own pre-approved
  copy — not reworded here.

## Notes for the Architect

- File-overlap risk with E4 (cart drawer, parallel branch) was kept low on purpose:
  `Layout.tsx`'s only change is one import + one JSX line (`<KonamiEasterEgg />`, placed
  after the footer, away from the header/cart area E4 is likely to touch).
  `ProductPage.tsx`'s change is scoped to the `findProduct` function only — nothing in
  the cart/Add-to-Cart code paths changed. If E4 lands first or second, this should merge
  cleanly either way.
- D5 §3's "Discoverability hint" section is explicit that no further hint is needed —
  flagging it here only per that doc's own instruction to flag it to the
  Architect/lead if the owner later wants a more visible one, not because anything here
  is incomplete.
- The one open judgment call: D5 left the banner's exact position/shape ("styling"
  bullets name tokens, not a layout) up to me — I used a fixed, centered, bottom-of-
  viewport banner (the common "toast" position), consistent with `--zjc-z-toast`'s own
  naming. Flag if the Creative Director wants a different placement.

## Status

Ready for Architect review. Board status for E6: `review`.

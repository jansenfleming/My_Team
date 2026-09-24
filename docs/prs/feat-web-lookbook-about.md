# feat/web-lookbook-about: real lookbook + about pages per D4 (E5)

Author: engineer. Branch: `feat/web-lookbook-about`. Base: `main` (de7e106, after PR #49,
`docs/board-d4-done`).

## What changed

Board task E5 (`docs/architecture/board.md`): replaces E1's placeholder `LookbookPage` and
`AboutPage` with the real editorial/copy build from the Creative Director's D4 specs
(`docs/design/lookbook.md`, `docs/design/about.md`), styled with D2's real tokens
(`docs/design/tokens.css`, `docs/design/style-guide.md`). No product data, cart, or
easter-egg work here — that's E2/E3/E6, already merged or in progress on a separate branch
(another Engineer instance owns E3, `ProductPage.tsx`/cart, in parallel; this branch never
touches those files).

**Lookbook page — `src/pages/LookbookPage.tsx` + `src/components/LookbookCard.tsx`**
- Hero: `# lookbook.md` kicker, `<h1>Lookbook</h1>`, and the subhead acknowledging the
  placeholder photography, per D4 §2.
- Four `<section aria-labelledby>` "look" blocks (Local / On-Call / Staging / Shipped),
  each an `<h2>`, a config-key-styled kicker (`environment: local`, `rotation: primary`,
  etc.), a one-to-two sentence intro, and exactly 3 product cards — a `LOOKS` table in the
  page maps each look to its 3 product **names**, then resolves each name against
  `src/data/products.ts`'s real `products` array via a `Map` built at module scope
  (`resolveProduct`), so this file holds zero duplicate product data. Throws a loud error
  at render time if a name in `LOOKS` ever drifts out of sync with the product data
  (defensive; can't happen today — verified the 12 names match exactly).
- Coverage matches D4 §3 exactly: all 12 main-catalog products, each in exactly one look,
  5 shirts / 4 sweatshirts / 3 hats. The hidden 13th product (`hiddenProduct`, `200 OK
  Tee`) is never imported into this file at all, per D4's explicit "not on this page" rule
  for ordinary navigation.
- New `LookbookCard` component (`src/components/LookbookCard.tsx`): the reusable
  placeholder-block from D4 §4 — a 4:5 tile with a CSS-only grid-motif "image area"
  (`aria-hidden`), a category tag pinned top-right, and a monospace nameplate carrying the
  product's real name, plus an editorial caption below (distinct wording per look item,
  not copy-pasted from the product's own catalog description — verified in a test). No
  `<img>` anywhere; markup matches D4's exact spec (a single `<a class="lookbook-card">`
  wrapping the tile and caption).
- Closing section: a single ghost-styled link, "Browse the full catalog", to `/catalog`
  (D4 §7).
- Root element is a `<section className="page page-lookbook">`, not another `<main>` — D4
  §1 says "wrap the page content in `<main>`", but `Layout.tsx` (E1) already supplies the
  page's one `<main id="main-content">` landmark, and every other page in this codebase
  (`CatalogPage`, etc.) follows the same "`<section class='page page-x'>`" convention. A
  second `<main>` would be an invalid duplicate landmark, so this file follows the
  established convention instead of D4's literal wording — flagged here rather than guessed
  silently.
- **Motion (D4 §5):** each look section observes itself via `IntersectionObserver`
  (`threshold: 0.15`), disconnecting after it first fires. A `motionIsEnabled()` check —
  `IntersectionObserver` support + `matchMedia("(prefers-reduced-motion: no-preference)")`
  — runs once per mount via `useState`'s lazy initializer; if it's `false` (reduced motion
  requested, or either API unsupported), the page **never sets a `data-motion` attribute at
  all**, so every section renders at its final, fully visible CSS state immediately (no JS
  ever adds a hidden state). If motion is enabled, each section starts `data-motion=
  "pending"` and flips to `"visible"` on first intersection. The CSS half of this (in
  `index.css`) is wrapped in `@media (prefers-reduced-motion: no-preference)` as the primary
  gate, with `tokens.css`'s existing `--zjc-dur-*` collapse under `prefers-reduced-motion:
  reduce` as the backstop — the "belt and suspenders" D4/style-guide.md §5 asks for.

**About page — `src/pages/AboutPage.tsx`**
- All five sections from `docs/design/about.md`, copy verbatim: hero (two paragraphs),
  "The name", "Where this started", "What we make", "Who this is for". Single column,
  no motion, no interactive component — D4 explicitly scopes this page simpler than the
  lookbook.
- **Every `[PLACEHOLDER: ...]` marker is rendered exactly as written, brackets included**:
  the name-origin placeholder in "The name", and the four in "Where this started" (year,
  founder, location, founding reason). None are filled in, hidden, or paraphrased around —
  verified by a test asserting each placeholder string is present as an exact substring of
  the rendered page text, plus a test that no real-looking 4-digit year appears next to the
  `[PLACEHOLDER: year]` marker.
- Literal commands quoted as code (`git blame`) render in a `<code>` element per D4's
  "inline code-styled terms" rule; "works on my machine"/"works in prod" stay as plain
  quoted text (D4's own copy uses quotation marks, not backticks, for those two — only
  `git blame` is backtick-styled in the source doc, so only that one gets `<code>`).
- Root element is a `<section className="page page-about">`, same landmark reasoning as
  the lookbook page above.

**Styling — `src/index.css`**
- New rules for both pages, entirely from `--zjc-*` tokens (no raw hex, no unscaled `px`,
  no ad hoc easing/duration), per style-guide.md §6.
- Grid-motif background applied directly to the lookbook hero and each look section
  (style-guide.md §3's sanctioned "`--zjc-bg`-colored section" case), the D4 §4
  placeholder-card component with its hover lift (wrapped in
  `prefers-reduced-motion: no-preference`), and the scroll-reveal transition rules keyed
  off the `data-motion` attribute, with per-card stagger expressed as
  `calc(var(--zjc-dur-fast) * n)` rather than a hardcoded millisecond value.
- Responsive grid reuses E1's existing 640px/960px breakpoints rather than D4's suggested
  768px/1024px — D4 §6 explicitly permits this ("reuse E1's existing breakpoints instead
  if they exist"). Mobile: 1-column cards, `--zjc-space-4` gap, looks separated by
  `--zjc-space-7`. 640px+: 2-up cards, `--zjc-space-5` gap (3rd card naturally wraps to its
  own row in a 2-column grid — no extra CSS needed for that). 960px+: 3-up cards,
  `--zjc-space-6` gap, looks separated by `--zjc-space-9`.
- New minimal `.button`/`.button--ghost` pair for the lookbook's closing link
  (style-guide.md §3's secondary/ghost button rule) — nothing else on the site had a
  generic button class yet.
- **Fixed a latent specificity bug while wiring this in:** the existing generic
  `.page h1 { font-size: var(--zjc-text-2xl); ... }` rule (added in E2) has higher CSS
  specificity than a single custom class like `.lookbook-hero__title`, because it combines
  a class selector with a type selector. Without a fix, it would have silently overridden
  D4's mobile/desktop `<h1>` sizing on both new pages. Fixed by selecting
  `h1.lookbook-hero__title` / `h1.about-hero__title` (same specificity, later in source
  order, so mine wins) instead of relying on the class alone.

## New dependencies

None.

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

Manual: `npm run dev -w @site/web`, then visit `/lookbook` — hero, four look sections (12
cards total, 3 per look), and the closing catalog link render; resize across ~375px / 640px
/ 960px+ to see the 1 → 2 → 3 column card grid step; scroll slowly to see each look fade/
slide in once, staggered by card; toggle `prefers-reduced-motion` in devtools (or refresh
with it already on) to confirm every section is simply visible immediately, no animation.
Visit `/about` — five sections render, with every `[PLACEHOLDER: ...]` marker visibly
intact, brackets and all. Tab through both pages to confirm the shared focus ring appears
on every card/link.

## Real command output

Run in `.claude/worktrees/agent-a720c00c568f8fd85`, Node v22.12.0.

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
      Tests  69 passed (69)
   Start at  19:30:09
   Duration  1.63s

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
✓ 42 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-BEPX4616.css   13.96 kB │ gzip:  3.02 kB
dist/assets/index-B6eBmhGS.js   238.16 kB │ gzip: 74.75 kB
✓ built in 442ms

$ npm run scan-secrets
> zerojance-site@0.0.0 scan-secrets
> node tools/scan-secrets.mjs
scan-secrets [working-tree]: 123 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
> zerojance-site@0.0.0 audit:ci
> npm audit --audit-level=high
found 0 vulnerabilities
```

9 test files: `App.test.tsx`, `config.test.ts`, `index-html.test.ts`,
`router/Router.test.tsx`, `router/matchRoute.test.ts`, `data/products.test.ts`,
`pages/CatalogPage.test.tsx`, `pages/LookbookPage.test.tsx` (new, 15 tests),
`pages/AboutPage.test.tsx` (new, 7 tests). 69 tests total, all passing.

`pages/LookbookPage.test.tsx` covers: hero copy; the 4 `<h2>` look headings in order; each
look's exact 3-product assignment checked against D4's table (not just a count); an
exact-set check that all 12 main-catalog product names render as `<h3>`s and the hidden
13th (`200 OK Tee`) never does; captions distinct from catalog descriptions; zero `<img>`
tags; category text visible per card; the closing catalog link; no nested `<main>`; and
three motion cases — reduced motion requested (no `data-motion` ever set), no
`IntersectionObserver` support (same), and a full pending → visible → disconnect cycle via
a fake `IntersectionObserver` instance per section (only the triggered section's observer
disconnects; the other three stay pending and unobserved-from). All render assertions also
assert zero `console.error`/`console.warn` calls.

`pages/AboutPage.test.tsx` covers: hero/heading structure; all five `[PLACEHOLDER: ...]`
markers present verbatim as exact substrings (brackets included); no real-looking founding
year slipped in next to the year placeholder; `git blame` rendered inside a `<code>`
element; no nested `<main>`; six `.about-copy` paragraphs; zero console errors/warnings.

## Notes for the Architect / next tasks

- E6 (easter eggs) and E3/E4 (product detail + cart) are untouched by this branch — no file
  overlap with the parallel E3 branch (`ProductPage.tsx`, cart state).
- Flagging one judgment call for review: D4's lookbook.md §3 describes the look intro
  paragraph as "same body-copy styling as the hero subhead (`--zjc-text-base`...)" but §2
  gives the hero subhead itself `font-size: var(--zjc-text-md)` explicitly — these two
  values don't literally match. I implemented both literally as written (hero subhead at
  `--zjc-text-md`, look intros at `--zjc-text-base`, via a shared `.lookbook-copy` class
  with a `.lookbook-hero` scope override) rather than guessing which one was meant to win.
  Low-stakes (1-2px), didn't block on asking the Creative Director, but flagging in case
  D4 wants to tighten the wording.
- `docs/design/lookbook.md` §4's exact markup (`<a class="lookbook-card">` wrapping the
  tile and caption directly, no `<li>` class) is followed literally in
  `LookbookCard.tsx` — the `<li>` itself carries no class, styling instead lives on the
  `.lookbook-cards` grid container.

## Files changed

```
$ git diff --stat main...feat/web-lookbook-about
 apps/web/src/components/LookbookCard.tsx |  41 +++++
 apps/web/src/index.css                   | 303 +++++++++++++++++++++++++++++++
 apps/web/src/pages/AboutPage.test.tsx    |  83 +++++++++
 apps/web/src/pages/AboutPage.tsx         |  62 ++++++-
 apps/web/src/pages/LookbookPage.test.tsx | 229 +++++++++++++++++++++++
 apps/web/src/pages/LookbookPage.tsx      | 199 +++++++++++++++++++-
 6 files changed, 902 insertions(+), 15 deletions(-)
```

## Status
Ready for Architect review. Board status for E5: `review`.

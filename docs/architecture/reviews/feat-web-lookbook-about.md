# Architect review: `feat/web-lookbook-about` (E5)

Reviewer: architect. Date: 2026-09-24. Branch reviewed at `a194d4a` (base `main`
`de7e106`, before PR #50/#51 landed — no overlap with those files, confirmed below).
PR file: `docs/prs/feat-web-lookbook-about.md`.

## Verdict: **approved**, no required changes.

## What I checked

### 1. Lookbook coverage vs. D4 §3's table
Compared `LookbookPage.tsx`'s `LOOKS` array line-by-line against
`docs/design/lookbook.md` §3 (not the PR's summary):

| Look | Spec (D4 §3) | Branch |
|---|---|---|
| Local | localhost Tee, Rubber Duck Hoodie, sudo Cap | match |
| On-Call | Works on My Machine Tee, Technical Debt Hoodie, TCP Handshake Cap | match |
| Staging | 403 / 404 Tee, cron Crewneck, Off-by-One Cap | match |
| Shipped | Exit Code 0 Tee, git blame Tee, Staging vs Prod Crewneck | match |

Kickers, intros, and per-card captions also match D4 §3 verbatim/near-verbatim (captions
are D4's own editorial lines, correctly distinct from D3's catalog descriptions).
`LookbookPage.test.tsx` has a per-look exact-array assertion plus a whole-page exact-set
assertion (`allCardNames.sort()` === `products.map(p => p.name).sort()`, length 12) and a
dedicated test that `hiddenProduct.name` (`200 OK Tee`) never renders. `LookbookPage.tsx`
imports only `products` from `../data/products`, never `hiddenProduct` — grepped the file
directly, not just the PR's claim. All 12 main-catalog products covered exactly once; the
hidden 13th is genuinely unreachable from this page.

### 2. Data source and placeholder-block CSS
`LookbookPage.tsx` resolves every card via a `Map` built from the real
`src/data/products.ts` `products` export (`resolveProduct`, throws if a name drifts out
of sync) — zero duplicated product data in the page. `LookbookCard.tsx` renders the D4
§4 tile: `image-area` div (`aria-hidden`, grid-motif background via CSS custom
properties only), a `<span>` tag, and an `<h3>` name plate — no `<img>`, no `background`
pointing at an external asset, no data URI. `git grep -n "<img"` across the branch's new
files returns nothing, and `LookbookPage.test.tsx` has an explicit
`document.querySelectorAll("img")` → length 0 test. Confirmed CSS-only.

### 3. About page placeholders — character-for-character
Diffed `AboutPage.tsx`'s five placeholder strings against `docs/design/about.md` §3/§4
byte-for-byte (used `od -c` on the source doc to strip out markdown backtick code-span
markers, which are formatting, not content). All five markers match exactly, including
the long name-origin placeholder's full parenthetical. The two markers that contain a
literal `"` are written as `&quot;` JSX entities (a legitimate, standard JSX text-entity
mechanism — React decodes named HTML entities in JSX text children) rather than escaped
quote characters; this is a style choice consistent with how the rest of the file quotes
"works on my machine" etc., not a content deviation, and renders as a plain `"` in the
browser. `AboutPage.test.tsx` asserts each placeholder as an exact literal substring of
`container.textContent`, plus a regression test that no real 4-digit year appears next
to `[PLACEHOLDER: year]`. Verified.

### 4. Motion / reduced-motion / IntersectionObserver fallback
`motionIsEnabled()` requires both `IntersectionObserver` support and
`matchMedia("(prefers-reduced-motion: no-preference)").matches`, computed once via
`useState`'s lazy initializer (no flash of the wrong state). When `false`, the page never
sets `data-motion` on any section, and the CSS only applies opacity/transform rules
inside `.lookbook-look[data-motion="pending"|"visible"]` selectors — with no attribute,
sections render at the plain, final CSS state (opacity 1, no transform) immediately, not
"eventually." Read the three motion tests in `LookbookPage.test.tsx` directly:
- Reduced motion requested (`matchMedia` mocked to `matches: false`) → asserts none of
  the 4 `.lookbook-look` sections ever gets a `data-motion` attribute.
- `IntersectionObserver` deleted from `window` (motion otherwise allowed) → same
  assertion, confirms the graceful-degradation path independent of the reduced-motion
  path.
- A fake `IntersectionObserver` class, one instance per section (4 total) → asserts every
  section starts `data-motion="pending"`, each has exactly one `observe()` call; firing
  the first section's callback flips only that section to `"visible"` and disconnects
  only its own observer, the other three stay `"pending"` and undisturbed.

All three tests assert real behavior (attribute state, disconnect call counts), not just
that the component renders without throwing. This matches D4 §5's belt-and-suspenders
requirement (JS gate as primary, `tokens.css`'s duration collapse as backstop) and its
no-JS/progressive-enhancement rule (base HTML/CSS state is already the final visible
state before any JS runs).

### 5. Spec ambiguity — hero subhead vs. look-intro type size
Confirmed this is a genuine spec inconsistency in `docs/design/lookbook.md`, not an
Engineer error. §2 gives the hero subhead `font-size: var(--zjc-text-md)` explicitly.
§3 says the look-intro paragraph uses "same body-copy styling as the hero subhead" but
then itself lists `--zjc-text-base` as the value. `tokens.css` confirms
`--zjc-text-base` = 16px, `--zjc-text-md` = 18px — a real 2px difference, not a
transcription error on my part. The Engineer implemented each section's own explicitly-
stated value literally (hero subhead at `--zjc-text-md` via a `.lookbook-hero
.lookbook-copy` scope override, look intros at the shared `.lookbook-copy` base of
`--zjc-text-base`) rather than guessing which of the two conflicting statements in §3
should win, and flagged it in the PR file rather than silently picking one.

**My call: leave as implemented, no Creative Director fix required.** Reasoning: (a) the
gap is 2px on a single subhead/intro line, well below anything a visitor would notice
without pixel-measuring; (b) both values are legitimate, already-defined D2 tokens — no
new value was invented; (c) a hero subhead reading fractionally larger than a repeated
in-page intro paragraph is arguably the more defensible visual hierarchy anyway (hero
content is usually the largest body-text moment on a page); (d) re-opening D4 for a 2px
wording fix isn't worth Creative Director time against the MVP timeline. If the Creative
Director wants to tighten §3's wording in a future pass (drop the "same as hero subhead"
cross-reference, since it's misleading as written), that's a free, non-blocking cleanup,
not a re-review gate for this branch.

### 6. Ownership and the CSS-specificity fix
`git diff main..feat/web-lookbook-about --stat` touches only `apps/web/src/**` (new
`components/LookbookCard.tsx`, edits to `index.css`, `pages/AboutPage.tsx`,
`pages/LookbookPage.tsx`, two new test files) and `docs/prs/feat-web-lookbook-about.md`
— both within the Engineer's and the branch-author's ownership per
`docs/architecture/ownership-map.md`. No overlap with `feat/web-product-cart`'s files
(`ProductPage.tsx`, `cart/**`, `data/variants.ts`, `utils/format.ts`) or with any
Architect-owned path.

CSS specificity fix: E2's existing `.page h1 { font-size: var(--zjc-text-2xl); ... }`
rule (unmodified by this branch, confirmed via diff — line 169 in the pre-branch file)
has specificity (0,1,1) — one class, one type selector. A bare `.lookbook-hero__title`
class selector alone would be (0,1,0), losing to `.page h1` regardless of source order.
The branch's fix qualifies the selector to `h1.lookbook-hero__title` /
`h1.about-hero__title`, also (0,1,1) — a genuine tie, correctly broken by source order
(the new rules are appended after `.page h1` in `index.css`) rather than by a
specificity difference the PR's own comment slightly overstates (it says the new rule
selectors have "higher" specificity than `.page h1`'s combination; they're actually
equal, and the fix works via source-order tie-break, not superiority — a minor
inaccuracy in the PR's own explanation, not in the code). The fix is real, correctly
scoped to only the two new page-specific classes, and does not touch
`CatalogPage.tsx`'s bare `<h1>Catalog</h1>` or the shared `.page h1` rule (mobile at
line 169, desktop 640px bump at line 333) — checked both are byte-identical to `main`.

### 7. Checks run myself (not taken from the PR file)
Ran from a detached worktree at the branch tip (`a194d4a`), Node v22.12.0:

```
$ npm install
added 307 packages, and audited 309 packages in 1s
found 0 vulnerabilities

$ npm run typecheck
(clean, no output)

$ npm run lint
(clean, no output)

$ npm test
 Test Files  9 passed (9)
      Tests  69 passed (69)
(tools/scan-secrets.test.mjs: 9/9 pass, via the combined `npm test` chain)

$ npm run build
✓ 42 modules transformed.
✓ built in 447ms

$ npm run scan-secrets
scan-secrets [working-tree]: 124 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
found 0 vulnerabilities
```

69/69 matches the PR file's claim. (Per the task brief: this branch's 69 total differs
from `feat/web-product-cart`'s own count because they're separate branches off the same
base — expected, not a discrepancy, and moot now that `feat/web-product-cart` has
already merged to `main` ahead of this review.)

## Minor, non-blocking notes
- The PR file's specificity-fix writeup says the new selectors have "higher" specificity
  than `.page h1`; they're actually equal, and the fix works by source-order tie-break.
  Functionally correct, just a slightly imprecise explanation — not worth a re-review
  round-trip.
- `docs/design/lookbook.md` §3's "same body-copy styling as the hero subhead" wording is
  mildly misleading given its own explicit `--zjc-text-base` value; flagged to the
  Creative Director as an optional future wording cleanup, not a blocker (see §5 above).

## Hygiene pass
Secrets: `npm run scan-secrets` PASS, 124 files, 0 findings. Dependencies: `npm audit
--audit-level=high` clean, no new dependencies added by this branch. Accessibility spot
check: heading hierarchy matches D4 (single `<h1>` per page, `<h2>` per look/section,
`<h3>` per card), each look `<section>` has `aria-labelledby` pointing at its own `<h2>`
id, the decorative grid-motif layer is `aria-hidden`, no `<img>` without alt text because
there is no `<img>` at all, hover-lift and scroll-reveal are both gated behind
`prefers-reduced-motion: no-preference`. Broken links: internal-only (`/catalog`,
`/product/:id` via the shared router) — no external requests introduced.

## Recommendation
Ready to merge as-is. No changes requested.

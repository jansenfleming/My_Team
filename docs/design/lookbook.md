# ZeroJance — Lookbook Page Spec (D4)

Owner: creative-director. Branch: `feat/design-pages`. Depends on: D1
(`docs/design/concept.md`) for voice, D3 (`docs/design/products.md`) for the 12
main-catalog products this page showcases, and **D2**
(`docs/design/tokens.css`, `docs/design/style-guide.md`) for every color/type/space/
motion value below — D2 merged to `main` after this branch's task was assigned, and this
spec was written against it directly rather than against placeholder fallback values.
Read D1 first if you haven't — everything below follows its voice guide (deadpan,
technically accurate, terse, in on the joke, peer-to-peer) and its three anti-generic
rules. Route: `/lookbook` (per ADR 0003's route shape list).

**Scope note:** this is a presentational/editorial spec. It invents no new products —
every item referenced below is one of D3's 12 main-catalog products, referenced by its
exact name. The hidden 13th product ("200 OK Tee") is **not** referenced here and must
not appear on this page — D3 Section 3 requires it stay out of every ordinarily-navigable
page, and `/lookbook` is ordinary navigation.

**Photography note (read this before building):** there is no real product photography
for this mockup and none should be assumed or faked. Every visual on this page is a
**styled placeholder block** — a plain surface with a grid-motif "image area," a category
tag, and the product name set in monospace type — not a stand-in awaiting a photo shoot.
Section 4 below is the exact, reusable spec for that block, built entirely from existing
D2 tokens and component rules (no new colors, no new durations).

---

## 1. Page structure

1. **Hero** (page title + kicker + subhead)
2. **Four "look" sections**, each pairing 3 products from the main catalog around a
   workday moment, covering all 12 main-catalog products exactly once (no repeats, no
   omissions)
3. **Closing link** back to the full catalog

Heading hierarchy (for landmarks/screen-reader navigation): page `<h1>` in the hero; each
look section is an `<h2>`; each product's name within a look is an `<h3>`. Wrap the page
content in `<main>`; each look is a `<section aria-labelledby="...">` pointing at its
`<h2>` id.

### Page metadata
- `<title>`: `Lookbook — ZeroJance`
- Meta description: `Twelve items, sorted by the part of the job they're for.`

---

## 2. Hero

- Kicker (small monospace line, styled like a file-comment, same device D3 uses for
  config-file special copy — e.g. `# care.cfg`): `# lookbook.md`
  - Style: `font-family: var(--zjc-font-mono); font-size: var(--zjc-text-sm);
    color: var(--zjc-fg-muted); letter-spacing: var(--zjc-tracking-wide);` — lowercase
    as written, no uppercase transform (matches D3's `#`-comment kickers, which are
    lowercase).
- `<h1>`: `Lookbook`
  - Style: `font-family: var(--zjc-font-sans); font-size: var(--zjc-text-3xl)` desktop
    down to `var(--zjc-text-xl)` at mobile widths (style-guide.md §4's hero/display
    rule — never smaller than `--zjc-text-xl` for an H1); `font-weight:
    var(--zjc-weight-black); line-height: var(--zjc-leading-tight);`
- Subhead (one line, body copy, deadpan): `Same twelve items, sorted by the part of the
  job they're for. No photoshoot — these are the same styled blocks as the product
  pages.`
  - Style: `font-family: var(--zjc-font-sans); font-size: var(--zjc-text-md);
    color: var(--zjc-fg); max-width: var(--zjc-measure);`

This subhead is the one place this page acknowledges the placeholder-photography fact
to the visitor, and it does so in-voice (dry, no apology, no hype) rather than as a
disclaimer banner.

Hero section background: `var(--zjc-bg)`, following the grid-motif rule from
style-guide.md §3 directly (grid is only used on `--zjc-bg`-colored sections) — apply
the grid-motif CSS given in Section 4 below to the hero section background too, for
visual consistency with the look sections.

---

## 3. The four looks

Each look = an `<h2>` name, a one-line monospace "kicker" styled like a config key
(real key, real value — no invented technical facts, per D1 Rule 1), a one-to-two
sentence intro paragraph, and exactly 3 products, each rendered as one placeholder-block
card (Section 4) with an editorial caption underneath (distinct wording from the
product's own catalog description in `products.md` — these are new, shorter editorial
lines, not copy-pasted).

**Look section styling:** `background: var(--zjc-bg)` with the grid-motif pattern
(Section 4's CSS block) applied directly to the section — this is the exact case
style-guide.md §3 describes ("use only on `--zjc-bg`-colored sections... directly").
Heading (`<h2>`): `font-family: var(--zjc-font-sans); font-size: var(--zjc-text-2xl);
font-weight: var(--zjc-weight-bold); line-height: var(--zjc-leading-snug);` — the
"section headline" size per style-guide.md §4. Kicker: same styling as the hero kicker
(Section 2). Intro paragraph: same body-copy styling as the hero subhead
(`--zjc-text-base`, `--zjc-fg`, `--zjc-leading-normal`, `max-width: var(--zjc-measure)`).

Card link target: each card links to that product's detail-page route (exact path/slug
format is the Engineer's call from E2/E3 — this page only needs to resolve by product
name against the shared product-data module). The product name text is part of the
link's accessible name; no extra ARIA labeling is needed since all 12 names are unique.

### Look 1 — Local
- Kicker: `environment: local`
- Intro: "Before anything ships, before anyone's watching. Just you, a terminal, and
  whatever's running on port 3000."
- Cards (in this order):
  1. **localhost Tee** — "Home base. 127.0.0.1, every time."
  2. **Rubber Duck Hoodie** — "For talking through the bug before you ask anyone else."
  3. **sudo Cap** — "Full permissions. Still your problem."

### Look 2 — On-Call
- Kicker: `rotation: primary`
- Intro: "Something's paging. The fix can wait for coffee; the ack can't."
- Cards:
  1. **Works on My Machine Tee** — "True in dev. Under investigation everywhere else."
  2. **Technical Debt Hoodie** — "The balance came due at 2am, like it does."
  3. **TCP Handshake Cap** — "SYN sent. Waiting on the rest of the team to ACK."

### Look 3 — Staging
- Kicker: `environment: staging`
- Intro: "Everything that's supposed to break, breaking here instead of in front of a
  client."
- Cards:
  1. **403 / 404 Tee** — "Access denied, or never existed. Staging doesn't clarify
     which."
  2. **cron Crewneck** — "Running on a schedule nobody on the team wrote down."
  3. **Off-by-One Cap** — "One more pass before this counts."

### Look 4 — Shipped
- Kicker: `environment: production`
- Intro: "It's out. Somebody's name is on the commit, and the logs are clean — for now."
- Cards:
  1. **Exit Code 0 Tee** — "Clean run. Nothing to report."
  2. **git blame Tee** — "The record doesn't forget who touched this last."
  3. **Staging vs Prod Crewneck** — "Same shirt. Higher stakes."

**Coverage check:** 4 looks × 3 products = 12, matching D3's full main-catalog count
exactly (5 shirts, 4 sweatshirts, 3 hats — the same split as D3 Section 0), each product
appearing in exactly one look. The kicker device (`environment: *`, `rotation: primary`)
reuses real, correct terms (deploy environments; on-call rotation roles) — no invented
technical vocabulary, consistent with D1 Rule 1 and with product 7's existing
staging/production framing.

### Why this grouping and not something else
Left out as a framing device: a `git log`-styled changelog structure for this page. D1
Section 4 deliberately deferred the changelog *easter egg* because it reads as an
ordinary content page rather than a secret — building the lookbook as a mechanical git
log would just re-introduce that deferred idea under a different name. The
workday-moment framing (local → on-call → staging → shipped) is a distinct device: it's
editorial/thematic, not a literal log format, and it draws on the same "unglamorous
ritual" folklore D1 Section 1 names directly (2am stack traces, cron nobody remembers,
staging vs. prod) without mechanically reusing a deferred idea.

---

## 4. Placeholder-block component spec (reusable)

This is the exact visual/markup spec for every product card's visual on this page. One
component, reused 12 times. Built entirely from D2 tokens — no new hex values, no new
durations, no component that isn't already covered by `style-guide.md`.

**Note on the dark-panel component:** D2's `--zjc-panel-*` tokens (style-guide.md §3)
are explicitly reserved for structural copy callouts (a care label, a CLI-styled size
chart) and are rate-limited to "once or twice per page." Since this page needs the
placeholder treatment 12 times, it deliberately does **not** use the dark panel — using
it here would blow past that budget and misapply a component meant for something else.
The design below uses only the standard card / tag / grid-motif tokens instead.

### Structure (top to bottom within a 4:5 portrait tile)
1. **Image area** — top ~75% of the tile height. This is the "photo" stand-in.
2. **Divider** — a single hairline border between the image area and the name plate.
3. **Name plate** — bottom ~25% of the tile height. Carries the product name.

### Visual — outer tile ("Cards / product tiles" rule, style-guide.md §3)
- `background: var(--zjc-bg-surface); border: var(--zjc-border-width) solid
  var(--zjc-border-control); border-radius: var(--zjc-radius-md); aspect-ratio: 4 / 5;`

### Visual — image area (top ~75%)
- `background: var(--zjc-bg);` plus the grid-motif pattern, applied directly per
  style-guide.md §3's exact CSS (this is the sanctioned case: grid-motif drawn straight
  on a `--zjc-bg`-colored surface):
  ```css
  background-image:
    linear-gradient(to right, var(--zjc-grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--zjc-grid-line) 1px, transparent 1px);
  background-size: var(--zjc-grid-size) var(--zjc-grid-size);
  ```
  This element carries no text and is purely decorative: `aria-hidden="true"`.
- **Category tag**, pinned to the top-right corner of the image area, offset
  `var(--zjc-space-3)` from the top and right edges. Styled per style-guide.md §3's
  "Tags/chips" rule exactly, with a solid fill added so it stays legible over the grid
  texture behind it (not specified by the chip rule itself, but consistent with it):
  `font-family: var(--zjc-font-mono); font-size: var(--zjc-text-sm); letter-spacing:
  var(--zjc-tracking-wide); text-transform: uppercase; color: var(--zjc-fg-muted);
  background: var(--zjc-bg-surface); border: var(--zjc-border-width) solid
  var(--zjc-border-control); border-radius: var(--zjc-radius-sm); padding:
  var(--zjc-space-1) var(--zjc-space-2);` Text content is the product's category exactly
  as it appears in the product data (`Shirt` / `Sweatshirt` / `Hat`, D3's casing) — the
  uppercase look is a CSS `text-transform`, not a hand-authored uppercase string.

### Visual — divider
- `border-top: var(--zjc-border-width) solid var(--zjc-border-control);`

### Visual — name plate (bottom ~25%)
- `background: var(--zjc-bg-surface); padding: var(--zjc-space-3) var(--zjc-space-4);`
- Product name (`<h3>`): `font-family: var(--zjc-font-mono); font-size:
  var(--zjc-text-md)` on mobile, `var(--zjc-text-lg)` at desktop widths;
  `font-weight: var(--zjc-weight-bold); text-transform: uppercase; letter-spacing:
  var(--zjc-tracking-wide); color: var(--zjc-fg); line-height: var(--zjc-leading-snug);`
  Content is the product's exact catalog name (e.g. "Exit Code 0 Tee"), again visually
  uppercased via CSS, not re-authored in caps in the data.

### Computed contrast (all from D2's own table, style-guide.md §2 — no new pairs)
- Name text `--zjc-fg` on name-plate `--zjc-bg-surface`: **17.77:1** (row 2).
- Tag text `--zjc-fg-muted` on tag fill `--zjc-bg-surface`: **6.13:1** (row 4).
- Both clear the 4.5:1 body-text floor with wide margin. The grid-motif pattern in the
  image area is decorative (`aria-hidden`, low-opacity per its token definition) and is
  explicitly exempt from contrast requirements per style-guide.md §3 — no text is ever
  placed directly on it in this component (the tag has its own solid fill; the name sits
  on the name plate below the divider, not on the grid).

### Caption (below the tile, part of the same link)
- `font-family: var(--zjc-font-sans); font-size: var(--zjc-text-sm); color:
  var(--zjc-fg-muted); margin-top: var(--zjc-space-2);`

### Markup / accessibility
```html
<a href="{product detail route}" class="lookbook-card">
  <div class="lookbook-card__tile">
    <div class="lookbook-card__image-area" aria-hidden="true"></div>
    <span class="lookbook-card__tag">Shirt</span>
    <div class="lookbook-card__nameplate">
      <h3 class="lookbook-card__name">Exit Code 0 Tee</h3>
    </div>
  </div>
  <p class="lookbook-card__caption">Clean run. Nothing to report.</p>
</a>
```
- No `<img>` tag and no `alt` text anywhere in this component: the category and product
  name are real text nodes, not baked into an image, so they're inherently readable by
  assistive tech. Only the decorative grid-motif layer needs `aria-hidden`.
- **Fallback if CSS fails to load entirely:** the raw HTML still renders the tag,
  product name, and caption as plain visible text in document order (no image, no JS
  required to see them) — the page degrades to plain, readable text, never to a blank
  or broken block. This satisfies the "usable fallback if any effect fails"
  requirement.
- **Fast load:** no image assets, no web fonts (system stacks only, per `tokens.css`),
  no network requests for this component — pure CSS plus text already in the page's
  markup.
- **Hover behavior:** follows the standard card rule (style-guide.md §3): lift via
  `transform: translateY(-2px)` over `var(--zjc-dur-base)` / `var(--zjc-ease-out)`,
  wrapped in `@media (prefers-reduced-motion: no-preference)`; nothing else changes on
  hover (no color shift needing its own contrast check).

---

## 5. Motion spec

Each look section (and its 3 cards) animates in on scroll, using only existing D2 motion
tokens — no new duration or easing values.

- **Properties:** `opacity` (`0` → `1`) and `transform: translateY(var(--zjc-space-4))`
  → `translateY(0)` (a 16px offset, reusing the existing mobile-gutter spacing token
  rather than an arbitrary pixel value).
- **Duration:** `var(--zjc-dur-slow)` (480ms) — this is tokens.css's documented use case
  for this exact effect ("page-level reveal, e.g. hero entrance on load").
- **Easing:** `var(--zjc-ease-out)` — tokens.css's stated pairing rule: "elements
  entering the viewport/DOM use ease-out."
- **Stagger:** `var(--zjc-dur-fast)` (120ms) between the 3 cards within a look (card
  index × 120ms delay).
- **Trigger:** `IntersectionObserver`, `threshold: 0.15`, fires once per section (stop
  observing that section after it fires — no re-trigger on scroll back up).
- **Required wrapping:** per style-guide.md §5, this whole effect must be gated behind
  `@media (prefers-reduced-motion: no-preference)` — do not rely solely on
  `tokens.css`'s duration-collapse safety net (see below) as the only reduced-motion
  handling; the media-query gate is the primary mechanism, the token collapse is the
  backstop.

### `prefers-reduced-motion: reduce`
Two independent layers, matching D2's own stated "belt and suspenders" approach
(tokens.css comments, style-guide.md §5):
1. **JS gate:** the entrance-animation JavaScript only runs when both (a)
   `IntersectionObserver` is supported and (b) `(prefers-reduced-motion: no-preference)`
   matches. If reduced motion is requested, the JS never adds the "start hidden, animate
   in" state at all — every section and card renders at its final state (`opacity: 1`,
   no transform) immediately.
2. **Token backstop:** even if a component forgets the JS gate, `tokens.css`'s own
   `@media (prefers-reduced-motion: reduce)` block already collapses every `--zjc-dur-*`
   value (including `--zjc-dur-slow` and `--zjc-dur-fast`) to `0ms`, so any transition
   that does fire completes instantly rather than playing out or getting stuck.

### No-JS / progressive enhancement (also the general fallback if the effect fails)
The base HTML/CSS state — before any JavaScript runs — must already be the final visible
state (`opacity: 1`, no transform). The animation is purely additive. If JavaScript
fails to load or run for any reason, every section and card is simply visible
immediately, with no animation and no broken/stuck-invisible state. This is the concrete
rule behind "style must never block usability" for this page.

---

## 6. Responsive layout

Uses D2's existing spacing scale throughout — no new spacing values introduced for this
page.

- **Mobile (< 768px):** single column. Looks stack top to bottom, separated by
  `var(--zjc-space-7)` (48px) — style-guide.md §4's mobile section-rhythm value. Within
  a look: kicker, then intro paragraph, then the 3 cards stacked vertically (full-width,
  4:5 ratio preserved), gapped by `var(--zjc-space-4)` (16px). Page gutter:
  `var(--zjc-space-4)` (16px), per style-guide.md §4.
- **Tablet (768–1023px):** looks still stack vertically at the same rhythm; within a
  look, cards wrap 2-up (`grid-template-columns: repeat(2, 1fr)`, third card wraps to
  its own row), gapped by `var(--zjc-space-5)` (24px).
- **Desktop (≥ 1024px):** looks separated by `var(--zjc-space-9)` (96px) — style-guide.md
  §4's desktop section-rhythm value. Within a look, kicker + intro render full-width
  above a 3-column card row (`grid-template-columns: repeat(3, 1fr)`), gapped by
  `var(--zjc-space-6)` (32px). Page gutter at desktop: `var(--zjc-space-6)` (32px).

These breakpoints (768px / 1024px) are page-local if the Engineer hasn't already
established global ones in E1's web shell — reuse E1's existing breakpoints instead if
they exist. Looks themselves always stack vertically (never side-by-side), keeping the
"four looks" order legible as a sequence rather than a dense wall of cards. No horizontal
scrolling at any width. No layout depends on JavaScript — the grid column counts above
are pure CSS media queries.

---

## 7. Closing section

Below the four looks, a single link back to the main catalog, styled as the secondary/
ghost button from style-guide.md §3 (`--zjc-fg` text, `--zjc-border-control` border,
transparent fill, shared focus-ring rule):
- Link text: `Browse the full catalog`
- Target: the catalog/home route (E1's existing route for the product grid).
- No additional copy needed here — keep it to the one link.

---

## 8. What this doc deliberately doesn't specify

- **Catalog-grid thumbnail treatment.** That's E2's call; this page's 4:5 lookbook cards
  are intentionally a different shape/treatment from the grid, for editorial contrast.
- **Product detail route/slug format.** E2/E3's call; this page only needs to resolve
  each look's 3 product names against the shared product-data module.
- **Anything not already covered by `tokens.css` / `style-guide.md`.** If the Engineer
  hits a value this spec doesn't define, the answer is D2's existing token set, not a
  new one-off — message the Creative Director rather than inventing a value, per
  style-guide.md §6.

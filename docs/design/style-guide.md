# ZeroJance — Style Guide (D2)

Owner: creative-director. Branch: `feat/design-tokens`. Depends on: D1
(`docs/design/concept.md`). Companion file: `docs/design/tokens.css` — every
token named below is defined there; this document is the usage rules and the
contrast proof. Don't add a raw hex value or a magic-number duration to
component code — if a value isn't in `tokens.css`, ask the Creative Director
before inventing one.

This is D2 only: tokens and system rules. Product copy is D3
(`products.md`, not written yet); lookbook/about layout is D4; easter-egg
specs are D5. Where an example below needs sample copy, it's an invented
throwaway placeholder ("Segfault Hoodie", "$1") — not a real product, don't
build against it.

---

## 1. Why this palette, and why it's a break from the old project

D1 (`concept.md` §1, §3) sets the brand as **workplace humor, not
futurism** — the office, the terminal, the incident channel, not a cyberpunk
movie set. The old, now-superseded project (ADR 0003) was a dark-only,
amber-on-black terminal UI: `color-scheme: dark`, one monospace font
everywhere, an amber prompt/accent, a hazard-tape motif, a rotating "sweep"
status glyph, a typed boot sequence. None of that carries forward — not the
`--zj-*` token names, not the hex values, not the visual language (dark-only,
single-accent-amber, terminal-chrome).

D2's direction instead:

- **Light is the default and only full-site theme for v1** (`color-scheme:
  light` in `tokens.css`). A browsable catalog is selling product photography
  and the type sits on top of it — a light, paper/label ground reads more
  like a real streetwear e-commerce site (closer to how a shipping label,
  hangtag, or spec sheet actually looks) than a dark terminal glass. This is
  a deliberate reversal of the old project's "dark only, no light theme"
  rule, not an oversight.
- **Two type families, each with one job.** A bold system sans
  (`--zjc-font-sans`) carries headlines, UI, and running copy — this is the
  "bold type" the brief asks for, and it's what makes the site read as
  streetwear first. A monospace stack (`--zjc-font-mono`) is reserved for
  the *structural* tech-culture joke: care labels styled like a config file,
  a CLI-styled size chart, prices, tags, the 404/dev-console easter-egg
  copy. Monospace is an accent, never a paragraph — if you're setting more
  than about two lines in `--zjc-font-mono`, it's the wrong token (see D1
  §3.2: the joke lives in the object's structure, not a wall of monospace
  text pretending to be a terminal).
- **One accent hue family instead of an ANSI-style red/amber/green trio.**
  `--zjc-signal` (a cobalt/network blue) is the *only* interactive-attention
  color — links, focus rings, primary buttons, active nav. `--zjc-ok` and
  `--zjc-alert` exist purely as semantic state colors (in-stock/error), not
  as decoration, and neither is a warm amber-and-red pairing like the old
  palette's prompt/fault colors. Blue-as-primary-accent also reads as a
  network/wire reference (RJ45, blueprint, hyperlink-blue) without tipping
  into neon-cyberpunk, which is exactly the register D1 §3.3 asks for
  (curated, specific, not the most-memed tech visual cliché).
- **A grid motif, not a circuit-board motif.** `--zjc-grid-line` /
  `--zjc-grid-size` draw a plain graph-paper grid (two CSS gradients, no
  image asset) for section backgrounds — closer to a spec sheet or dot-grid
  notebook than a glowing PCB trace. This satisfies the brief's "grid or
  circuit motif" with the option that stays furthest from hacker-movie
  circuit-board clichés.
- **Square-ish, utility shapes.** Small radii only (`--zjc-radius-sm` at
  2px up to `--zjc-radius-lg` at 12px for the cart drawer) — nothing
  pill-shaped except explicit status badges. Reads as workwear hardware
  (a zipper pull, a woven label), not a soft consumer-app UI.

---

## 2. Contrast table (computed)

Method: WCAG 2.x relative-luminance contrast ratio,
`(L_lighter + 0.05) / (L_darker + 0.05)`, where `L` is relative luminance
computed from sRGB channels with the standard linearization
(`c ≤ 0.04045 → c/12.92`, else `((c+0.055)/1.055)^2.4`) and luminance
weights `0.2126 R + 0.7152 G + 0.0722 B`. Computed with a small Python script
against the exact hex values in `tokens.css` (not eyeballed). Thresholds:
**body/small text ≥ 4.5:1**, **large text (≥24px, or ≥19px bold) and UI
components/graphical objects ≥ 3:1** (WCAG 1.4.3 and 1.4.11).

| # | Foreground | Background | Ratio | Requirement | Pass | Where it's used |
|---|---|---|---|---|---|---|
| 1 | `--zjc-fg` `#16181C` | `--zjc-bg` `#F2F3F5` | **16.01:1** | body 4.5:1 | ✅ | Body copy, headings on the page background |
| 2 | `--zjc-fg` `#16181C` | `--zjc-bg-surface` `#FFFFFF` | **17.77:1** | body 4.5:1 | ✅ | Body copy, headings on cards/product tiles/drawer |
| 3 | `--zjc-fg-muted` `#5B6270` | `--zjc-bg` `#F2F3F5` | **5.52:1** | body 4.5:1 | ✅ | Meta text, timestamps, secondary copy on page bg |
| 4 | `--zjc-fg-muted` `#5B6270` | `--zjc-bg-surface` `#FFFFFF` | **6.13:1** | body 4.5:1 | ✅ | Same, on a card/surface |
| 5 | `--zjc-signal` `#2A46C9` | `--zjc-bg` `#F2F3F5` | **6.71:1** | body 4.5:1 (links are body-sized) | ✅ | Text links, in-copy accent on page bg |
| 6 | `--zjc-signal` `#2A46C9` | `--zjc-bg-surface` `#FFFFFF` | **7.45:1** | body 4.5:1 | ✅ | Text links, accent on a card |
| 7 | `--zjc-fg-on-signal` `#F2F3F5` | `--zjc-signal` `#2A46C9` | **6.71:1** | UI/large 3:1 (button label is usually ≥16px bold, but this clears body too) | ✅ | Primary button label/icon on a `--zjc-signal` fill |
| 8 | `--zjc-ok` `#3E6B4F` | `--zjc-bg` `#F2F3F5` | **5.53:1** | body 4.5:1 | ✅ | "In stock" text, dry confirmation copy on page bg |
| 9 | `--zjc-ok` `#3E6B4F` | `--zjc-bg-surface` `#FFFFFF` | **6.14:1** | body 4.5:1 | ✅ | Same, on a card |
| 10 | `--zjc-fg-on-ok` `#F2F3F5` | `--zjc-ok` `#3E6B4F` | **5.53:1** | UI/large 3:1 | ✅ | Label on a filled "in stock" pill |
| 11 | `--zjc-alert` `#B3271E` | `--zjc-bg` `#F2F3F5` | **5.86:1** | body 4.5:1 | ✅ | Error/sold-out text, 404 copy on page bg |
| 12 | `--zjc-alert` `#B3271E` | `--zjc-bg-surface` `#FFFFFF` | **6.51:1** | body 4.5:1 | ✅ | Same, on a card |
| 13 | `--zjc-fg-on-alert` `#F2F3F5` | `--zjc-alert` `#B3271E` | **5.86:1** | UI/large 3:1 | ✅ | Label on a filled "sold out" pill, destructive button |
| 14 | `--zjc-border-control` (`--zjc-line-strong`) `#7A7F90` | `--zjc-bg` `#F2F3F5` | **3.59:1** | UI (non-text) 3:1 | ✅ | Default input/chip/card border |
| 15 | `--zjc-border-control` (`--zjc-line-strong`) `#7A7F90` | `--zjc-bg-surface` `#FFFFFF` | **3.99:1** | UI (non-text) 3:1 | ✅ | Same, drawn on a card |
| 16 | `--zjc-border` (`--zjc-line`) `#D7DAE0` | `--zjc-bg` `#F2F3F5` | 1.26:1 | none — decorative only | exempt | Hairline section dividers only. Never used to convey state or as a required boundary (see §3) |
| 17 | `--zjc-panel-fg` `#F2F3F5` | `--zjc-panel-bg` `#16181C` | **16.01:1** | body 4.5:1 | ✅ | Body copy inside a dark spec/care-label panel |
| 18 | `--zjc-panel-fg-muted` `#A9ADB6` | `--zjc-panel-bg` `#16181C` | **7.90:1** | body 4.5:1 | ✅ | Secondary/meta text inside a dark panel |
| 19 | `--zjc-panel-link` `#7C93F0` | `--zjc-panel-bg` `#16181C` | **6.17:1** | body 4.5:1 | ✅ | Links/accents inside a dark panel |
| 20 | `--zjc-panel-ok` `#8FD6A6` | `--zjc-panel-bg` `#16181C` | **10.44:1** | body 4.5:1 | ✅ | "ok" state text inside a dark panel |
| 21 | `--zjc-panel-alert` `#FF8A80` | `--zjc-panel-bg` `#16181C` | **7.79:1** | body 4.5:1 | ✅ | "alert" state text inside a dark panel |

**Never do this** (not in the table because it fails, kept here as a
guardrail): `--zjc-ink` `#16181C` text directly on an `--zjc-ok` or
`--zjc-alert` fill — `#16181C` on `#3E6B4F` measures **2.90:1**, below even
the 3:1 UI floor. Any text on a filled `--zjc-ok`/`--zjc-alert`/`--zjc-signal`
background must use the matching `--zjc-fg-on-*` token (always
`--zjc-paper`), never `--zjc-fg`.

`--zjc-line` (row 16) is the one token in this system with no contrast
requirement, because it's never used to carry text or meaning — it's a
decorative rule between sections. If an engineer ever needs a border that
*does* carry meaning (marks a focusable control, a required field, a
selected state), that border must use `--zjc-line-strong` /
`--zjc-border-control` (rows 14–15) or `--zjc-signal` (focus ring, row 5/6
territory — same hex), not `--zjc-line`.

The `prefers-contrast: more` block in `tokens.css` raises `--zjc-ink-soft`
to `#454B57` and `--zjc-line-strong` to `#656B7D` — both already comfortably
above their base thresholds even before that bump; the media query exists to
give users who ask for more contrast a further margin, not to fix a failing
default.

---

## 3. Component usage rules

- **Body text** always uses `--zjc-fg` on `--zjc-bg` or `--zjc-bg-surface`
  (rows 1–2). Never `--zjc-fg-muted` for a paragraph a visitor needs to
  read to complete a task (checkout copy, size guidance) — muted is for
  genuinely secondary information (a timestamp, a SKU-style tag) where
  missing it costs nothing.
- **Links** are `--zjc-link` (= `--zjc-signal`) and always underlined in
  body copy — color alone never carries the "this is a link" signal.
- **Focus ring** on every interactive element (buttons, links, inputs, the
  Konami-code-triggered element if it's focusable) is
  `outline: var(--zjc-focus-width) solid var(--zjc-focus-ring); outline-offset:
  var(--zjc-focus-offset);`. Never removed, never replaced with a
  box-shadow-only treatment that fails to reach 3:1 against both
  `--zjc-bg` and `--zjc-bg-surface` — `--zjc-signal` already clears both
  (rows 5–6) so this is safe as specified.
- **Buttons.** Primary CTA ("Add to Cart"): `--zjc-signal` fill,
  `--zjc-fg-on-signal` label (row 7), `--zjc-radius-md`,
  `--zjc-border-width-thick` border in the same fill color (or transparent —
  engineer's call), bold weight (`--zjc-weight-bold`), min height
  `--zjc-tap-min`. Destructive (remove from cart): `--zjc-alert` fill,
  `--zjc-fg-on-alert` label (row 13). Secondary/ghost button: `--zjc-fg` text,
  `--zjc-border-control` border, transparent fill.
  All buttons include the shared focus-ring rule above.
- **Status pills** ("In stock", "Sold out", a hidden-product easter-egg
  tag): filled pill, `--zjc-radius-pill`, using the ok/alert pairs (rows
  8–13). Text is always the `--zjc-fg-on-*` token, never `--zjc-fg` (see the
  "never do this" guardrail above).
- **Cards / product tiles**: `--zjc-bg-surface` background,
  `--zjc-border-control` 1px border (`--zjc-border-width`), `--zjc-radius-md`.
  On hover: lift via `transform: translateY(-2px)` over `--zjc-dur-base` /
  `--zjc-ease-out`, and nothing else animates on hover (no color shift that
  would need its own contrast check) — see §5 for the reduced-motion
  fallback.
- **Dark panel component** (`--zjc-panel-*` tokens, rows 17–21): reserved
  for the structural tech-joke copy blocks named in `concept.md` §3.2 — a
  care label formatted as key/value config pairs, a CLI-styled size chart, a
  diff-styled hangtag. Set `background: var(--zjc-panel-bg); color:
  var(--zjc-panel-fg); font-family: var(--zjc-font-mono);` on the block only
  — this never becomes the page or section background, and it never appears
  more than once or twice per page (it's a callout, not a theme). If D3
  doesn't end up specifying a component that needs it, it's fine for this
  block to ship unused in v1 — the tokens cost nothing sitting idle.
- **Grid motif background** (`--zjc-grid-line` + `--zjc-grid-size`):
  ```css
  background-image:
    linear-gradient(to right, var(--zjc-grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--zjc-grid-line) 1px, transparent 1px);
  background-size: var(--zjc-grid-size) var(--zjc-grid-size);
  ```
  Use only on `--zjc-bg`-colored sections (hero, section dividers, the 404
  page background) directly, or swap in `--zjc-grid-line-panel` if the grid
  sits on a `--zjc-panel-bg` block. Never render body text straight on top
  of the grid without a `--zjc-bg-surface` card underneath it — the grid
  itself is exempt from contrast requirements (it's decorative, same as
  `--zjc-line`), but that exemption doesn't extend to text placed over it.
- **Tags/chips**: `--zjc-font-mono`, `--zjc-text-sm`, `--zjc-tracking-wide`,
  uppercase, `--zjc-fg-muted` text, `--zjc-border-control` outline,
  `--zjc-radius-sm`. This is the token-level hook for D3's "config file /
  CLI" copy rule (`concept.md` §3.2) — the mono font and bracket-ready
  tracking are set here; the actual tag copy is D3's job.
- **Type weight fallback**: `--zjc-weight-black` (900) is for hero/display
  headlines only. A system that lacks a true 900 cut (some Windows Segoe UI
  builds) renders a synthetic near-bold instead of failing or showing a
  fallback typeface — no further handling needed, but don't rely on 900 vs.
  700 being visually distinct as the *only* signal of hierarchy (pair it
  with `--zjc-text-2xl`/`--zjc-text-3xl` size, which does the real work).

---

## 4. Layout and type scale in practice

- Page gutter: `--zjc-space-4` (16px) on mobile, `--zjc-space-6` (32px) at
  desktop widths — apply as `padding-inline` on the page shell, not on every
  individual component.
- Section vertical rhythm: `--zjc-space-9` (96px) between major sections on
  desktop, roughly half that (`--zjc-space-7`, 48px) on mobile.
- Hero/display headline: `--zjc-text-3xl` (64px desktop) down to
  `--zjc-text-2xl` (44px) or `--zjc-text-xl` (32px) at mobile widths —
  engineer's call on the exact breakpoint step-down, but never smaller than
  `--zjc-text-xl` for an H1.
- Product name on a detail page: `--zjc-text-xl`, `--zjc-weight-bold`,
  `--zjc-leading-snug`.
- Body copy (product description, about-page paragraph): `--zjc-text-base`,
  `--zjc-weight-regular`, `--zjc-leading-normal`, max width
  `--zjc-measure` (66ch) so lines don't run edge-to-edge on wide viewports.
- Price: `--zjc-font-mono`, `--zjc-text-md` or `--zjc-text-lg` depending on
  context (grid tile vs. detail page), `--zjc-weight-bold`.

---

## 5. Motion and fallback rules

- Every duration a component uses must be one of `--zjc-dur-*` in
  `tokens.css` — no inline `300ms` or similar magic numbers.
- Pairing rule: elements entering the viewport/DOM use `--zjc-ease-out`;
  elements leaving use `--zjc-ease-in`; state swaps (drawer open/close,
  accordion, tab switch) use `--zjc-ease-in-out`.
- Any animation that is not essential to understanding the interface (hover
  lift, hero entrance, drawer slide) must be wrapped in
  `@media (prefers-reduced-motion: no-preference)`. `tokens.css` additionally
  collapses every `--zjc-dur-*` value to `0ms` under
  `@media (prefers-reduced-motion: reduce)`, so even a component that forgets
  the wrapping media query degrades to an instant, fully usable state change
  rather than a stuck or broken transition.
- **No animation on this site is ever the only way to learn something.** A
  cart drawer that slides in also has a definite open/closed DOM/ARIA state;
  a card hover-lift has no information that isn't otherwise present (the
  card is still fully readable and clickable at rest). If a future effect
  (e.g. anything tied to an easter egg in D5) can't meet that bar, it needs
  a non-animated fallback specified alongside it, not shipped as motion-only.
- Nothing in this token set uses `steps()`/blink easing (no blinking
  cursor, no boot-sequence typing effect) — that was specific to the old
  terminal project and isn't part of this brand's visual language.

---

## 6. What the Engineer needs to do with this file

1. Copy `docs/design/tokens.css` verbatim to `apps/web/src/styles/tokens.css`
   (or import it directly from `docs/design/` if the build setup prefers
   that — engineer's call, just don't hand-transcribe values).
2. Import it once, globally (e.g. in the app's root layout/entry), before any
   component stylesheet.
3. Treat every value in it as the only source for color/space/type/motion —
   no raw hex, no unscaled `px`/`rem`, no ad hoc `ease`/duration in component
   code. If a component needs something not covered here, message the
   Creative Director rather than inventing a one-off value.
4. The dark-panel component (§3, `--zjc-panel-*`) and the grid-motif
   background (§3) are both optional until D3/D4 specify where they're
   actually used — it's fine for E1/E2 to ship without them and wire them in
   once D3's product copy or D4's page specs call for them.

---

## 7. Open placeholders

None in this document — D2 contains no facts about the owner or the brand's
founding story. (See `concept.md` §5 for the standing placeholders that
apply to the whole design set.)

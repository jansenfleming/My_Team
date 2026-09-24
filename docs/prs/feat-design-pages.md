# feat/design-pages: ZeroJance lookbook and about-page copy/spec (D4)

Author: creative-director. Branch: `feat/design-pages`. Base: `main` (d08d960, after PR
#40, `docs/board-d2-done`).

## What changed

This is D4 from `docs/architecture/board.md` — the lookbook/editorial page spec and the
about/brand-story page spec, depending on D1 (`docs/design/concept.md`, done and
merged), D3 (`docs/design/products.md`, done and merged), and D2
(`docs/design/tokens.css` / `docs/design/style-guide.md`) — D2 merged to `main` after
this task was assigned as D4, so this doc was written directly against D2's real tokens
rather than the placeholder fallback values the kickoff note anticipated might be
necessary. It adds two new files:

- **`docs/design/lookbook.md`** — a full spec for the `/lookbook` route:
  - **Structure:** a hero, four "look" sections, a closing link back to the catalog.
    Heading hierarchy and landmark structure spelled out (`<h1>` in the hero, `<h2>` per
    look, `<h3>` per product name, `<main>`/`<section aria-labelledby>`).
  - **The four looks** are a workday-moment framing device — Local, On-Call, Staging,
    Shipped — each pairing exactly 3 of D3's 12 main-catalog products (referenced by
    exact name, no new products invented) with a new, short editorial caption distinct
    from the product's own catalog description. All 12 main-catalog products appear
    exactly once across the four looks; the hidden 13th product ("200 OK Tee") is
    explicitly excluded, since this route is ordinary navigation and D3 requires it stay
    out of anything reachable that way.
  - **Placeholder-block component** (Section 4): the exact, reusable visual/markup spec
    for every product's "image" on this page, since there's no real photography. An
    image-area/divider/nameplate structure built entirely from D2's existing tokens (card
    surface, grid-motif background, tag/chip styling, monospace nameplate) — explicitly
    *not* D2's dark-panel component, since that's rate-limited to "once or twice per
    page" and this page needs the placeholder treatment 12 times. Contrast for both text
    elements (nameplate, tag) is cited directly from D2's own computed table (17.77:1 and
    6.13:1), not recomputed against new colors. Markup, ARIA, and a "CSS fails to load"
    fallback are all specified; no `<img>`/`alt` is used since the name/category are real
    text, not baked into an image.
  - **Motion spec** (Section 5): scroll-triggered entrance animation, specified entirely
    in D2's own duration/easing tokens (`--zjc-dur-slow`, `--zjc-dur-fast`,
    `--zjc-ease-out`) rather than new arbitrary values. Two-layer reduced-motion handling
    (a JS gate on `prefers-reduced-motion`, plus D2's existing token-collapse backstop)
    and an explicit no-JS/progressive-enhancement fallback (base state is always fully
    visible without JavaScript).
  - **Responsive layout** (Section 6): three breakpoints, entirely in D2's spacing scale
    (`--zjc-space-4` through `--zjc-space-9`), with a note to prefer E1's existing
    breakpoints if they already exist.
  - Closes with what's deliberately left unspecified (catalog-grid thumbnail treatment,
    product-detail route format) and whose call those are.

- **`docs/design/about.md`** — brand-story copy and layout spec for the `/about` route:
  - Five sections in fixed order: hero (two paragraphs of brand-premise copy adapted
    from D1 into public-facing form), "The name" (reuses D1's own "design frame, not a
    claimed etymology" language as an explicit in-copy disclaimer, with the real
    placeholder still carrying the actual answer), "Where this started" (four distinct
    `[PLACEHOLDER: ...]` markers — year, founder detail, location, reason — matching
    every fact D1 flagged as open), "What we make" (D1's technical-accuracy and
    structural-joke rules restated as public brand philosophy), "Who this is for"
    (closing, peer-to-peer, no sales pitch).
  - Layout notes give exact typography for every element (kicker, h1, h2, body,
    inline-code terms) entirely in D2 tokens, plus an explicit instruction that
    placeholder markers render in normal body styling — visible, unstyled-as-an-error,
    verbatim.
  - Closing section states explicitly what's *not* on this page and why: no invented
    founder bio/press quotes (nothing was supplied, and only D1's already-identified
    open facts get placeholders — no new ones stubbed in speculatively), no
    checkout-mockup disclaimer (out of scope for this page), no easter-egg references
    (D5's job, separate branch).

## Why

D4 needs a real lookbook/about spec before E5 (Engineer's "Lookbook and about pages"
task) can build them without guessing. Both files were written against D2's actual
merged tokens rather than inventing fallback colors/spacing, specifically to avoid
handing the Engineer two specs that would need reconciling later — this task's own
kickoff note anticipated D2 might not be merged in time and told me not to block on it,
but since it merged (PR #38, approved, board updated) before I started writing, using
the real system directly is strictly better than shipping fallback values.

The lookbook's "workday moment" framing (rather than, say, a literal `git log`-styled
page) was a deliberate choice to avoid quietly re-implementing D1's deferred changelog
easter-egg idea under a different task name — Section 3 of `lookbook.md` explains this
directly.

## How to review

1. Read `docs/design/lookbook.md` and `docs/design/about.md` in full (about 260 and 90
   lines respectively).
2. **Product references:** confirm every product named in `lookbook.md` is one of D3's
   12 main-catalog products, spelled exactly as in `products.md`, each appearing exactly
   once across the four looks (12 products, 4 looks × 3 cards — cross-check the
   "Coverage check" note in Section 3). Confirm the hidden 13th product ("200 OK Tee")
   is never referenced.
3. **No invented photography:** confirm the doc states plainly (multiple times) that
   there is no real photography and describes a styled placeholder instead, and that the
   placeholder-block spec (Section 4) doesn't imply or gesture at real photos existing.
4. **Token discipline:** spot-check that every color/type/space/duration/easing value
   cited in both files is an actual token name from `docs/design/tokens.css` (e.g.
   `--zjc-dur-slow`, `--zjc-space-9`, `--zjc-text-2xl`) — no raw hex, no magic-number
   durations, per style-guide.md §6's rule that the Creative Director itself should
   follow.
5. **Dark-panel component budget:** confirm `lookbook.md`'s explicit reasoning for *not*
   using D2's `--zjc-panel-*` component for the 12 placeholder cards (style-guide.md's
   "once or twice per page" rate limit) — this is the one place this doc pushes back on
   a tempting reuse rather than taking it.
6. **Accessibility:** confirm heading hierarchy (`h1`/`h2`/`h3`) is unambiguous in both
   docs, that the placeholder-block's decorative grid layer is `aria-hidden` while the
   category/name text is real DOM text (no missing `alt`-text gap, since there's no
   `<img>` at all), and that the motion spec's reduced-motion handling is two-layered
   (JS gate + token backstop) rather than relying on just one.
7. **Placeholders (about.md):** confirm exactly two D1-carried facts get placeholders —
   the name's real origin, and the founding story (year/founder/location/reason) — and
   that no other fact about the owner or brand history is invented or implied anywhere
   in either file.
8. **Cart/checkout discipline:** confirm neither file's copy implies a real transaction
   anywhere (neither touches cart/checkout copy directly, but check nothing slipped in).
9. Confirm both files only touch `docs/design/**` (Creative Director's owned path).

## Checks run

Documentation-only change (two new Markdown files under `docs/design/`, no code). No
build/lint/test/typecheck tooling applies. Verified via `git status` / `git diff --stat`
that the only changes in the branch are the additions of `docs/design/lookbook.md` and
`docs/design/about.md`. Cross-referenced every product name against
`docs/design/products.md` and every token name against `docs/design/tokens.css` by hand
(both are short, closed lists) — no automated linter exists in this repo for either
check.

## Status

Ready for Architect review. Not pushed, no PR opened — the lead handles the remote side
after Architect review. E5 (Engineer's "Lookbook and about pages" task) can start once
this merges (it also needs E1 and D2, both already merged).

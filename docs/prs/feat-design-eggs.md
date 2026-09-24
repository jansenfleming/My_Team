# feat/design-eggs: ZeroJance easter-egg specs (D5)

Author: creative-director. Branch: `feat/design-eggs`. Base: `main` (d08d960, after PR
#40, `docs/board-d2-done`).

## What changed

This is D5 from `docs/architecture/board.md` — exact trigger/output/discoverability
specs for the three easter eggs D1 already picked (`docs/design/concept.md` §4): a
dev-console/view-source message, a joke 404 page, and a hidden 13th product via Konami
code. D5 depends on D1 and D3 (`docs/design/products.md`, for the hidden product's
identity — "200 OK Tee"), both merged. It adds one new file:

- `docs/design/easter-eggs.md`:
  - **§1 Dev-console/view-source message**, in two parts: a static HTML comment for
    `apps/web/index.html` (found via "View Page Source," present even if JS fails —
    literal text: `view-source: 200 OK. / Nothing else is hidden in the markup — try
    the console.`), and three `console.log` calls fired once per full page load
    (not per client-side route change), global on every route. Exact strings given
    verbatim, including a `%c`-styled banner line. Line 3 of the console output
    (`"Not everything here is in the catalog."`) doubles as the sole discoverability
    hint for the hidden-product egg — it says something's hidden without naming the
    mechanism.
  - **§2 Joke 404 page**: rewrites the existing placeholder
    `apps/web/src/pages/NotFoundPage.tsx`. Chose the "item not found in catalog" /
    real-HTTP-status angle over a fake stack trace, explicitly because a fabricated
    stack trace risks reading like a return to the old terminal project's aesthetic
    (ADR 0003) or an invented technical detail (D1 Rule 1). Exact copy: heading `404`,
    a status line built from the real `pathname` (`GET {pathname} → 404 Not Found`,
    with a truncation rule for pathnames over 60 characters), body copy `Not in the
    catalog. Try the catalog instead.`, and two real links (`Back to catalog`,
    `Back home`). Cites exact D2 tokens for every color (`--zjc-alert` for the heading —
    style-guide.md's own contrast table already earmarks that row for "404 copy"; grid
    motif on the page background — style-guide.md names the 404 page as a sanctioned
    use for it).
  - **§3 Hidden 13th product via Konami code**: fixes the one detail D3 left open — the
    slug (`200-ok`, route `/product/200-ok`, no router changes needed, matches the
    existing `/product/:slug` pattern). Specifies the exact key sequence (the classic,
    unmodified 10-key Konami code, compared case-insensitively for the two letters), a
    global `window`-level listener (not catalog-only) mounted once in `Layout`, a full
    sequence-matching algorithm (including the "mismatch resets to 0, but re-check for
    a fresh match at position 0" detail so a fumbled attempt can be retried without a
    pause), a guard against firing while focus is in an editable element, and a rule to
    never call `preventDefault()` so normal key behavior is untouched. On completion:
    sets a `localStorage` flag (`zj_unlocked_200ok`, value `"1"`, wrapped in try/catch
    with an in-memory session-only fallback if storage throws or is blocked) and shows a
    persistent (not timed) confirmation banner — exact copy `Item unlocked.` plus a real
    `View 200 OK Tee` link to `/product/200-ok` and a dismiss control, `aria-live="polite"`,
    non-modal. Explicitly does **not** auto-navigate on code completion — navigation is
    user-initiated via the banner's link, chosen specifically to avoid an unrequested
    page-context-change on a keystroke (a WCAG "change on request" concern), not as a
    scope cut. Specifies the exact `ProductPage` gating logic for later (E3/E6): the
    slug `200-ok` renders the real hidden-product page only if the `localStorage` flag
    is set; otherwise it renders the same `NotFoundPage` any other unmatched slug gets —
    which is what makes the product genuinely unreachable by guessing the URL, per D3
    §3's constraint. Also states plainly this hint is deliberately undocumented beyond
    the one console-log breadcrumb — pure discovery, not an oversight.
  - **§4 Cross-cutting constraints**: confirms all three are client-side only, harmless,
    respect `prefers-reduced-motion` (noting `tokens.css` already collapses durations to
    `0ms` under `reduce` as a fallback even if a component forgets the media query),
    reuse D2's already-computed contrast rows rather than inventing new color pairings,
    and don't introduce a new no-JS failure mode (the whole SPA already requires JS).
  - **§5 Buildability check**: a table estimating each egg's build size — dev-console/
    view-source under an hour, 404 rewrite under an hour, Konami code a few hours — all
    comfortably under the board's "well under a day" bar for D5, individually and
    combined. No simplification was needed from a bigger first draft; notes that the
    banner-plus-link reveal (over an auto-navigating toast) was chosen as both the
    simpler build and the more accessible one, not a budget cut.
  - **§6 Engineer notes**: lists exactly which files this touches once E3/E6 build it,
    the exact `localStorage` key/value to reuse verbatim, and a note to message the
    Creative Director (not guess) if an assumption here (e.g. whether `Layout` remounts
    on route change) turns out wrong.

## Why

D5 needed D1's picks and D3's product identity settled first, which is why it's
sequenced after both on the board. With D2 (tokens/style guide) merged since D1 was
written, this doc could cite real `--zjc-*` token names and the real computed contrast
table instead of deferring color specifics — style-guide.md turned out to already
anticipate several of these exact needs (a "404 copy" contrast row, "the Konami-code-
triggered element" mentioned in its focus-ring rule, a `--zjc-z-toast` layer, and a
`--zjc-ok` token described as the "confirmed" register), so this spec reuses those
rather than inventing new visual language. E6 (easter-egg implementation) and the
`ProductPage`-lookup portion of E3 are both blocked on this.

## How to review

1. Read `docs/design/easter-eggs.md` in full (about 340 lines).
2. Confirm no new eggs were picked and none of D1's picks were changed — check §0's
   framing sentence against `concept.md` §4's table (dev-console/view-source, joke 404,
   Konami-code hidden product; changelog page and discount-code pun stay deferred).
3. Confirm each of the three specs answers exactly what the board's D5 entry asks for:
   exact trigger, exact output/content, discoverability hint, and which page(s) — §1,
   §2, and §3 each have a dedicated subsection for every one of those.
4. Confirm the hidden-product mechanics actually satisfy D3 §3's hard constraint ("must
   not be reachable by direct navigation from ordinary browsing," "not filtered out at
   render time") — see §3 "Reveal," step 3: the gate is a `localStorage` check inside
   the future `ProductPage` lookup itself, so guessing `/product/200-ok` without ever
   entering the code renders the ordinary 404, identically to any other wrong slug.
5. Confirm the Konami sequence is the real, unmodified classic code (no invented
   variant) and that the matching algorithm's "reset then re-check position 0" detail is
   actually correct Konami-code implementation practice (it is — it's the standard fix
   for the "fumbled retry" problem), not an invented technical detail.
6. Confirm every color/token reference in §2 and §3 matches a real name and row in
   `docs/design/tokens.css` / `docs/design/style-guide.md` (spot-check `--zjc-alert`,
   `--zjc-ok`, `--zjc-z-toast`, `--zjc-fg-muted`, `--zjc-link`, and the grid-motif
   snippet) — nothing here should invent a token name or hex value.
7. Confirm no copy anywhere implies a real transaction, a real payment, or a fabricated
   fact about the owner or the brand (none of the three eggs touch cart/checkout copy or
   the founding story, so this should be a clean check).
8. Confirm §5's buildability table is a reasonable read of the actual engineering
   surface described in §1-§3 — if any of the three looks like more than "well under a
   day" of real work to you, flag it; the instruction was to simplify anything that
   didn't clear that bar, and my read is all three do.
9. Confirm the file only touches `docs/design/**` (Creative Director's owned path) —
   no `apps/**` changes; this doc specifies behavior for the Engineer to build later, it
   doesn't implement any of it.

## Checks run

Documentation-only change (one new Markdown file under `docs/design/`, no code).
No build/lint/test/typecheck tooling applies. Verified via `git status` /
`git diff --stat` that the only change in the branch is the addition of
`docs/design/easter-eggs.md`. Cross-checked every `--zjc-*` token name and every cited
contrast row against the actual `docs/design/tokens.css` and `docs/design/style-guide.md`
content on `main` (not from memory) before writing them into this spec. The Konami-code
sequence and its "reset, then re-check position 0" retry behavior were checked against
the standard, widely-documented implementation of the cheat code, not invented for this
doc. No external network calls, no third-party assets, no code that touches
`localStorage` in a way this doc doesn't explicitly wrap in a try/catch fallback.

## Status

Ready for Architect review. Not pushed, no PR opened — the lead handles the remote side
after Architect review. E6 (easter-egg implementation) and the `ProductPage`-lookup part
of E3 can start once this merges and their other dependencies (relevant pages) are also
in place, per the board.

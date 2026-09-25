# feat/design-founder-story: real founder's-story copy + footer fix

Author: creative-director. Branch: `feat/design-founder-story`. Base: `main` (6bcfe93,
after PR #68, `docs/agent-teams-lessons-log`).

## What changed

The owner (Jansen Fleming) supplied real, first-person founder's-story material — why
ZeroJance exists (the tech+fashion intersection, translating tech's precision and
creativity into wearable form, "minimalist streetwear with character," no strict rules,
a solo personal-vision founding) — with editorial latitude to select and adapt it rather
than paste it verbatim. This branch does three things, all `docs/design/**` (no
`apps/**` edits — that's the Engineer's job for item 3 below):

1. **`docs/design/about.md` §4 ("Where this started") rewritten.** Replaced the single
   four-placeholder paragraph with three short paragraphs: the real *why* (tech+fashion,
   translation into wearable form, minimalist-streetwear-with-character philosophy, no
   strict rules, "the brand I want to wear"), followed by one closing sentence that
   keeps exactly three placeholders literal and bracketed —
   `[PLACEHOLDER: year]`, `[PLACEHOLDER: founder name or detail]`,
   `[PLACEHOLDER: location]`. The fourth placeholder that used to live here
   (`[PLACEHOLDER: the specific reason ZeroJance exists...]`) is gone because that fact
   is no longer missing — it's answered by real, owner-supplied content, not invented.
   This section is also the one place on the page written in first person ("I," not
   "we") — a short note explains why (the source material is the founder's own unsigned
   first-person account; a founder's-note register fits naturally in this one section
   without pulling the rest of the page's plural, peer-to-peer voice off course). Nothing
   else on the page changed.

2. **`docs/design/about.md` §3 ("The name") left untouched**, per instructions — the
   founder's-story material doesn't address the name's origin, so its placeholder
   (`[PLACEHOLDER: the real meaning or origin of the name "ZeroJance"...]`) stays exactly
   as D4 originally wrote it.

3. **`docs/design/concept.md`'s two founding-story placeholders narrowed, not deleted.**
   - §1 ("Premise"): the old single placeholder
     (`[PLACEHOLDER: brand founding story — who started it, when, why, where]`) is
     replaced with a short paragraph stating the *why* is now real and pointing at
     `about.md` §4, followed by a narrower placeholder covering only what's still open:
     `[PLACEHOLDER: brand founding story — who started it, when, where]`.
   - §5 ("Open placeholders"): the matching bullet is updated the same way — narrowed to
     who/when/where, with an inline note that the why is answered and sourced.

4. **Footer copy fix (Rank 1 in `docs/architecture/phase-2-backlog.md`, the loose end
   flagged in `docs/architecture/mvp-readiness.md` §4).** `apps/web/src/layout/
   Layout.tsx` currently renders a literal `[PLACEHOLDER: real footer copy from the
   Creative Director.]` on every page, right after the existing honest mock-checkout
   sentence. This branch doesn't touch `apps/web/**` (not my file to edit), but supplies
   the exact replacement line below for the Engineer to drop in verbatim.

### Footer copy (for the Engineer — exact text)

Replace the bracketed placeholder in `apps/web/src/layout/Layout.tsx`'s `<footer>` so
the full paragraph reads:

> ZeroJance is a mockup catalog. Nothing on this site processes a real payment or sends
> a real order. Browse like it's `localhost` — nothing you do here leaves the browser.

Exact new sentence (replaces only the bracketed text, the two sentences before it are
unchanged):

```
Browse like it's localhost — nothing you do here leaves the browser.
```

Notes for implementation:
- This is factually true today (the Architect's `mvp-readiness.md` §8 independently
  re-grepped `apps/web/src` for `fetch(`/`XMLHttpRequest`/`axios`/etc. and found zero
  live hits outside tests/comments) — the line isn't just in-voice, it's a real,
  checkable claim, consistent with D1's "technically accurate" rule.
- `localhost` is one of D1's own preferred specific dev-culture references
  (`concept.md` §3, point 3), not a generic tech buzzword.
- Optional, not required: if you want the inline-code treatment `about.md` uses for
  literal commands/terms in body copy (`font-family: var(--zjc-font-mono); font-size:
  0.9em`), wrap `localhost` in `<code>localhost</code>` inside the footer `<p>`. Plain
  text is also fine for a one-line footer aside — this isn't a structural block, so it
  doesn't need its own styling rule.
- Keep it a single sentence appended to the existing paragraph (don't add a second
  `<p>`) — the footer is a small, low-emphasis element, not a second disclosure block.

## Why

Two independent needs, both flagged as open loose ends before this branch:
- The about page has carried a fully-bracketed founding-story paragraph since D4, and
  the owner has now supplied real material for part of it (the why). Leaving the
  placeholder as-is once real content exists would mean invented is regressed to
  "still blank" — narrowing it instead keeps every fact honestly labeled without
  hiding the one thing that's now actually true.
- The footer placeholder was the one concrete, no-owner-input-required gap the
  Architect's MVP readiness review found (`mvp-readiness.md` §4, `phase-2-backlog.md`
  Rank 1) — a live, visible `[PLACEHOLDER: ...]` bracket shipping on every page of the
  site, unlike the about-page placeholders, which are expected mockup-stage content.

## What stays a placeholder, and why (hard constraints check)

- `[PLACEHOLDER: year]`, `[PLACEHOLDER: founder name or detail]`,
  `[PLACEHOLDER: location]` — the founder's-story text answers *why* ZeroJance exists,
  not *when*, *who* (by name), or *where*. None of these three are invented, inferred,
  or narrowed away; they're still literal brackets in `about.md` §4 and in `concept.md`'s
  two mentions.
- `[PLACEHOLDER: the real meaning or origin of the name "ZeroJance"...]` in `about.md`
  §3 and `concept.md` §1 — untouched. The founder's-story material never addresses the
  name's origin, so nothing here changes it.
- No new fact about the owner beyond what was quoted in the task (no bio, no press
  quote, no team detail, no city, no year) was added anywhere in this branch.

## How to review

1. Read `docs/design/about.md` §4 in full (new copy) and confirm: the three
   placeholders (`year`, `founder name or detail`, `location`) are still literal
   brackets, nothing beyond the supplied founder's-story material is asserted as fact,
   and the first-person voice shift is explained rather than silently inconsistent with
   the rest of the page.
2. Confirm `docs/design/about.md` §3 is byte-identical to before this branch (diff it
   directly — it should show zero changes in that section).
3. Read `docs/design/concept.md` §1 and §5 and confirm both founding-story mentions are
   narrowed (who/when/where only) rather than deleted, and both point at `about.md` §4
   for the now-real why.
4. Check the footer copy section above against D1's cart/checkout hard rule
   (`concept.md` §2) — confirm the new line doesn't imply any real transaction, and
   against D1's "technically accurate" rule — confirm the "nothing leaves the browser"
   claim is actually true (re-run the same grep `mvp-readiness.md` §8 used, or trust its
   recent independent verification, since this branch doesn't touch `apps/web/**`).
5. Confirm via `git diff --stat` that only `docs/design/about.md` and
   `docs/design/concept.md` changed in this branch — no `apps/**` edits (footer
   implementation is a separate Engineer task, not done here).

## Checks run

Documentation-only change, two files under `docs/design/`, no code touched. No build/
lint/test/typecheck tooling applies. Verified via `git diff --stat` that the only
changes in this branch are to `docs/design/about.md` and `docs/design/concept.md`.

## Status

Ready for Architect review. Not pushed, no PR opened, no `apps/web/**` file edited —
per the approval boundaries, reporting back to the lead with the branch name; the
Architect reviews before the lead merges, same as every other task. The footer line
above still needs an Engineer pass on `apps/web/src/layout/Layout.tsx` (and, if a
snapshot/placeholder-preservation test exists for the footer, a matching test update) —
flagging that as the one follow-up action this branch doesn't itself complete.

# ZeroJance — About Page Copy/Spec (D4)

Owner: creative-director. Branch: `feat/design-pages`. Depends on: D1
(`docs/design/concept.md`) for voice and the two placeholders this page carries
forward, and **D2** (`docs/design/tokens.css`, `docs/design/style-guide.md`) for the
type/spacing values in Section 1 below — D2 merged to `main` after this branch's task
was assigned; this spec was written against it directly. Route: `/about` (per ADR
0003's route shape list).

**Hard rule carried from D1/the brief:** every `[PLACEHOLDER: ...]` marker below is
exactly that — no founding year, location, founder detail, headcount, or backstory is
invented anywhere on this page. The Engineer must render placeholder text **verbatim**,
brackets and all, not hide it, strip it, or fill it in. This is expected, visible
mockup-stage content, not a bug — the owner reviewing the live page should be able to
see at a glance what's still missing.

---

## 1. Page structure

1. Hero (kicker + `<h1>` + opening copy, two short paragraphs)
2. "The name" (`<h2>`)
3. "Where this started" (`<h2>`) — carries the placeholders
4. "What we make" (`<h2>`)
5. "Who this is for" (`<h2>`)

All five sections, in this order, single column. No motion, no interactive component,
no placeholder-photography block is required for this page — it's copy-led. (Optional:
if the Engineer wants a visual anchor near the hero, the lookbook's placeholder-block
component — `docs/design/lookbook.md` Section 4 — can be reused as-is for a single
decorative header block; this is optional, not required, and if used it must still
respect the same reduced-motion/no-JS rules from that spec.)

### Page metadata
- `<title>`: `About — ZeroJance`
- Meta description: `Workwear for people who live inside terminals, tickets, and
  on-call rotations.`

### Layout notes
- Single column, readable measure: `max-width: var(--zjc-measure)` (66ch, D2's token —
  style-guide.md §4's "body copy" rule) so paragraphs don't stretch full-width on
  desktop.
- Heading hierarchy: one `<h1>` (hero), each of the four named sections below is an
  `<h2>`. No further nesting needed — this page has no sub-sections.
- Wrap the page content in `<main>`.
- Typography (all from `tokens.css`, no new values):
  - Kicker (`# about.md`): `font-family: var(--zjc-font-mono); font-size:
    var(--zjc-text-sm); color: var(--zjc-fg-muted); letter-spacing:
    var(--zjc-tracking-wide);` — same treatment as the lookbook page's kicker, for
    cross-page consistency.
  - `<h1>`: `font-family: var(--zjc-font-sans); font-size: var(--zjc-text-3xl)` desktop
    down to `var(--zjc-text-xl)` mobile; `font-weight: var(--zjc-weight-black);
    line-height: var(--zjc-leading-tight);`
  - `<h2>` (each named section): `font-family: var(--zjc-font-sans); font-size:
    var(--zjc-text-2xl); font-weight: var(--zjc-weight-bold); line-height:
    var(--zjc-leading-snug);`
  - Body paragraphs: `font-family: var(--zjc-font-sans); font-size:
    var(--zjc-text-base); font-weight: var(--zjc-weight-regular); color: var(--zjc-fg);
    line-height: var(--zjc-leading-normal);`
  - Inline code-styled terms (`git blame`, `works on my machine`, etc., where they
    appear as literal commands/phrases in body copy): `font-family:
    var(--zjc-font-mono); font-size: 0.9em` (relative to surrounding body text, not a
    separate token — this is a short inline accent, not a structural block, so it
    doesn't need its own `--zjc-text-*` size).
  - `[PLACEHOLDER: ...]` markers: render in the same body-paragraph styling as the
    surrounding text — no special highlight color or treatment. They should read as
    normal (if incomplete) sentences, not as broken UI or error states.
  - Section vertical rhythm: `var(--zjc-space-7)` (48px) between sections on mobile,
    `var(--zjc-space-9)` (96px) on desktop — style-guide.md §4's standard rhythm,
    reused as-is.
  - Page gutter: `var(--zjc-space-4)` (16px) mobile, `var(--zjc-space-6)` (32px)
    desktop — same as the lookbook page.

---

## 2. Hero

- Kicker (same device as the lookbook page, small monospace file-comment style):
  `# about.md`
- `<h1>`: `About ZeroJance`
- Opening copy (two paragraphs, body text):

> ZeroJance makes workwear for people who live inside terminals, tickets, and on-call
> rotations. Not costumes for people who think that sounds cool — clothes for people
> who already know what a 2am stack trace looks like.
>
> Software work has its own folklore. Not the sci-fi kind — the specific, unglamorous
> kind: a `git blame` that only ever finds your own name, a cron job nobody remembers
> writing, the gap between "works on my machine" and "works in prod." We're not
> interested in hacking the mainframe. We're interested in the stuff that's actually
> true.

---

## 3. The name

- `<h2>`: `The name`
- Body copy:

> We tend to read it near "zero" — exit code 0, index 0, a null result — against
> something that rhymes with "riddance," or "chance." Take that as a style note, not an
> origin story. `[PLACEHOLDER: the real meaning or origin of the name "ZeroJance", if
> there is one beyond the style note above — do not present the style note as fact if a
> real origin is supplied later]`

This reuses D1 Section 1's own framing for the name ("a design frame for tone... not a
claimed etymology") as public-facing copy, but keeps the same explicit disclaimer D1
uses internally, so a visitor can't mistake it for a real backstory. The placeholder
still carries the actual answer.

---

## 4. Where this started

- `<h2>`: `Where this started`
- Body copy:

> Founded in `[PLACEHOLDER: year]` by `[PLACEHOLDER: founder name or detail]`, in
> `[PLACEHOLDER: location]`. `[PLACEHOLDER: the specific reason ZeroJance exists — what
> problem, whose idea, why apparel]`.

Four distinct placeholders in one short paragraph, matching D1's list of what must not
be invented (founding year, location, headcount/founder detail, backstory). No
surrounding copy in this section asserts anything as fact — it's structured so the
paragraph reads as a normal "founded in [year] by [founder]" sentence once the owner
supplies real values, without needing to be rewritten.

---

## 5. What we make

- `<h2>`: `What we make`
- Body copy:

> Shirts, sweatshirts, and hats. Every care label, hangtag, and size note is styled
> like something a computer would actually output — a config file, a crontab listing,
> an access log, a `git blame` trace. If a detail isn't technically accurate, it
> doesn't ship. We'd rather cut a joke than get the syntax wrong.

This is D1 Rule 1 (technical accuracy is non-negotiable) and Rule 2 (the joke lives in
the object's structure) restated as public brand philosophy, not an internal process
note — genuine copy, not exposition about the design docs.

---

## 6. Who this is for

- `<h2>`: `Who this is for`
- Body copy:

> People who've read a stack trace out loud to nobody. People who know the difference
> between 403 and 404 without looking it up. If that's not you yet, the shirts still
> fit.

Closes the page on the same peer-to-peer, no-hype register as the rest of the site —
invites the reader in without a sales pitch ("the shirts still fit" undercuts any
gatekeeping tone the rest of the paragraph might otherwise read as).

---

## 7. What this doc deliberately leaves out

- **No founder bio, no press quotes, no "as featured in," no team photo.** None of these
  were supplied by the owner; per the hard constraints, nothing here invents them, and
  none are stubbed in as placeholders because they weren't asked for — only the facts
  D1 already identified as open (name origin, founding story) get placeholders.
- **No mockup/checkout disclaimer on this page.** That rule (cart/checkout copy must
  never claim a real transaction) governs cart-adjacent copy specifically; this page
  doesn't touch cart or checkout language, so it isn't repeated here.
- **No easter-egg references.** D5 (separate branch, separate Creative Director
  instance) owns those specs; this page doesn't need to set up or hint at any of them.

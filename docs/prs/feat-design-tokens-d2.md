# feat/design-tokens: ZeroJance design tokens and style guide (D2)

Author: creative-director. Branch: `feat/design-tokens`. Base: `main`
(acd3482, after PR #32, `docs/board-d1-done`).

**Filename note:** the board/kickoff convention is `docs/prs/<branch-slug>.md`,
which for this branch would be `docs/prs/feat-design-tokens.md` — but that
path already holds the *old, superseded* project's D2 PR description (git
history: commits `1da7fd9` and `4cfef7a` on `main`), and the project brief
says explicitly not to remove old `docs/prs/**` content from the live tree.
Overwriting it in place would have both destroyed a visible historical
record and been confusing to anyone reading `docs/prs/` (two unrelated PRs
claiming the same filename). I left that file untouched and named this one
`feat-design-tokens-d2.md` instead. This collision will very likely recur
for other branches that reused an old project's branch name (e.g. the
Engineer's `feat/web-shell` collides with the existing
`docs/prs/feat-web-shell.md`) — flagging for the Architect to set a standing
convention (my instinct: a `-d2`/task-ID suffix like this one, but that's
the Architect's call, not mine to decide unilaterally).

## What changed

This is D2 from `docs/architecture/board.md` — tokens and system rules
building on D1's brand concept (`docs/design/concept.md`, merged). Two new
files:

- `docs/design/tokens.css` — CSS custom properties under the `--zjc-*`
  prefix (deliberately not `--zj-*`, see "Why a new prefix" below): raw
  palette + semantic aliases, a component-scoped "dark panel" token set,
  two system font stacks (bold sans for headlines/UI/body, monospace for
  structural accents), a type scale (12px–64px), a 4px-based spacing scale,
  shape/border/focus/tap-target tokens, CSS-only grid-motif tokens (no
  image asset), motion durations/easings, and a z-index scale. Includes a
  `prefers-reduced-motion: reduce` block that collapses all durations to
  `0ms`, and a `prefers-contrast: more` block that strengthens the two
  tokens with the least contrast margin.
- `docs/design/style-guide.md` — usage rules per component (buttons, status
  pills, cards, the dark panel, the grid motif, tags, type-scale-in-practice,
  motion/fallback rules) and a 21-row contrast table with computed ratios
  for every text/background and UI/background pairing the token set defines,
  plus the method used to compute them.

## Why

- **Direction**: light theme as the default and only full-site theme for
  v1 (`color-scheme: light`) — a deliberate reversal of the old,
  superseded project's dark-only terminal theme (ADR 0003). A catalog
  selling product concepts reads better on a light/paper ground; a small
  set of `--zjc-panel-*` tokens gives an inverse dark surface for one
  specific structural component (a config-file-styled care label, a
  CLI-styled size chart — D1 §3.2's "joke lives in the object's structure"
  rule) without making the whole site dark.
- **Two font families, each with one job**: a bold system sans for
  headlines/UI/body (the brief's "bold type"), monospace reserved for
  structural accents only (prices, tags, care-label/size-chart blocks) —
  never full paragraphs, per D1 §3.2.
- **One accent hue** (`--zjc-signal`, a cobalt/network blue) instead of the
  old project's amber-prompt language, plus two single-purpose state colors
  (`--zjc-ok`, `--zjc-alert`). Blue-as-primary-accent reads as a network/
  wire/hyperlink reference without tipping into neon-cyberpunk, matching D1
  §3.3's "curated, not the most-memed reference" rule.
- **Grid motif over circuit-board motif**: two CSS linear-gradients (no
  image asset, no network request) draw a graph-paper-style grid — closer
  to a spec sheet than a glowing PCB trace, per the brief's "grid or circuit
  motif" language.

### Why a new prefix (`--zjc-*`, not `--zj-*`)

The board's D2 task and the kickoff brief both say explicitly not to reuse
`--zj-*` names, hex values, or visual language from the old project's
`tokens.css` (removed from the live tree, still in git history at commit
`1da7fd9`). I checked that commit directly. The old file used a `--zj-*`
prefix for a dark-only, amber/verdigris/vermilion terminal palette with a
hazard-tape gradient, a rotating "sweep" status glyph, and boot-sequence/
cursor-blink motion tokens. This file:
- Uses a distinct prefix, `--zjc-*` (does not match the `--zj-*` glob —
  confirmed by grep: the only bare `--zj-` matches in either new file are
  in two sentences of documentation *naming* the old prefix to explain why
  it isn't reused, not any actual token).
- Reuses no hex value from the old file (checked all ten old hex constants
  against both new files — no match).
- Reuses no semantic names (old: `ink`/`bone`/`slate`/`amber`/`verdigris`/
  `vermilion`/`rule`/`hazard-tape`/`sweep-*`/`cursor-*`/`boot-*`; new:
  `paper`/`surface`/`ink`/`ink-soft`/`line`/`signal`/`ok`/`alert`) and no
  effect (no hazard tape, no sweep glyph, no boot typing, no cursor blink —
  see `style-guide.md` §5's closing note).

## How to review

1. Read `docs/design/tokens.css` top-to-bottom — it's one file, organized
   palette → semantic aliases → dark-panel tokens → type → spacing →
   shape/border → grid motif → motion → z-index, then the two `@media`
   blocks at the bottom.
2. Read `docs/design/style-guide.md` §1 for the direction rationale, then
   §2's contrast table. Spot-check a few rows against the hex values in
   `tokens.css` directly if you want to re-derive a ratio by hand: the
   formula is WCAG's standard relative-luminance contrast ratio, given in
   full at the top of §2.
3. Confirm every text/background pairing actually used by a component rule
   in §3 appears in the §2 table (I cross-checked this while writing it;
   the one exception, `--zjc-line`, is explicitly marked exempt because
   it's decorative-only and never carries text or state — see the row 16
   note and the "never do this" guardrail directly under the table).
4. Confirm no `--zj-*` (old prefix) token, no old hex value, and no
   terminal-specific effect language (hazard tape, sweep glyph, boot
   sequence, cursor blink) appears anywhere in either new file.
5. Confirm the file only touches `docs/design/**` (Creative Director's
   owned path).

## Checks run

Documentation/CSS-only change — no `apps/web` code, no build/lint/test step
applies. What I actually verified, with real output (not asserted):

- **Contrast math**: wrote a small Python script implementing the WCAG
  relative-luminance formula, ran it against every hex value quoted in
  `style-guide.md` §2, and additionally re-ran it *parsed directly out of
  `tokens.css`* (not retyped) as a second, independent pass — all 21 table
  rows plus the "never do this" guardrail pairing reproduced the numbers in
  the table. Every row meets or exceeds its WCAG threshold (4.5:1 body /
  3:1 UI-and-large-text); the one exception (`--zjc-line`, 1.26:1) is
  explicitly marked exempt as decorative-only, not a failing pairing.
- **Old-project reuse check**: `git show 1da7fd9:docs/design/tokens.css`
  to read the old file directly from history; `grep` for the old file's ten
  hex constants and for the bare `--zj-` prefix against both new files —
  zero token-usage matches (only the two explanatory sentences that name
  the old prefix in prose).
- **CSS sanity**: brace-balance check (`{` count == `}` count: 5/5) on
  `tokens.css`; no leftover `\uXXXX` escape artifacts in either file
  (checked by grep after a prior draft revealed the escapes needed
  verifying — they render correctly as real characters, confirmed).

## Status

Ready for Architect review. Not pushed, no PR opened — per the approval
boundaries, the lead handles the remote side after Architect review. D3
(product concepts/copy) is being worked by a separate Creative Director
session on its own branch in parallel; D4 and D5 are queued next for this
session once D2 is reviewed.

# Review: feat/design-tokens (D2 — design tokens and style guide)

Reviewer: Architect. Date: 2026-09-24. Branch reviewed at `a3dfd5a` (base `main` @ `acd3482`,
per the branch's own PR file). Verdict: **approved**.

## Scope / ownership check

`git diff main..feat/design-tokens --name-only`:
- `docs/design/tokens.css` (new)
- `docs/design/style-guide.md` (new)
- `docs/prs/feat-design-tokens.md`

All within Creative Director's owned path (`docs/design/**`) plus its own PR file
(`docs/prs/feat-design-tokens.md`, the standard path — the earlier filename-collision
issue at this same path was already resolved by intentional overwrite per the lead's
prior decision, not re-flagged here). No touches to `apps/**`, `packages/**`,
`.claude/**`, or any Engineer path. Clean.

## Deliverables

Both required files present and complete:
- `docs/design/tokens.css` — palette (raw inks + semantic aliases), a component-scoped
  dark-panel token set, two system font stacks, type scale, 4px-based spacing scale,
  shape/border/focus/tap-target tokens, CSS-only grid-motif tokens, motion
  durations/easings, z-index scale, a `prefers-reduced-motion: reduce` block collapsing
  durations to 0ms, and a `prefers-contrast: more` block strengthening the two
  lowest-margin tokens.
- `docs/design/style-guide.md` — direction rationale (§1), a 21-row computed contrast
  table with method stated (§2), component usage rules (§3), layout/type-scale-in-practice
  (§4), motion/fallback rules (§5), engineer handoff steps (§6), and an open-placeholders
  section confirming none apply to this doc (§7).

## Contrast table — spot-checked by hand

Recomputed WCAG relative-luminance contrast ratios independently from the hex values in
`tokens.css` (not from the table) for 5 pairings spanning both the light-surface and
dark-panel token sets:

| Pairing | Computed | Table claims | Match |
|---|---|---|---|
| `#16181C` on `#F2F3F5` (row 1) | 16.006 | 16.01:1 | yes |
| `#5B6270` on `#F2F3F5` (row 3) | 5.524 | 5.52:1 | yes |
| `#2A46C9` on `#F2F3F5` (row 5) | 6.711 | 6.71:1 | yes |
| `#7A7F90` on `#F2F3F5` (row 14, UI/non-text) | 3.593 | 3.59:1 | yes |
| `#7C93F0` on `#16181C` (row 19, dark panel) | 6.173 | 6.17:1 | yes |

All five reproduce the table to the stated precision. All body-text pairings clear
4.5:1 and all UI/large-text/non-text pairings clear 3:1; the one exempt row (`--zjc-line`,
1.26:1, row 16) is correctly marked decorative-only and the style guide explicitly
prohibits using it to carry text or state. Every token pairing actually invoked by §3's
component rules appears in the §2 table. No reason to doubt the remaining 16 rows.

## Old-project reuse check

Compared against the superseded terminal project's tokens, read directly from history
(`git show 1da7fd9:docs/design/tokens.css`):
- **Prefix**: old file uses `--zj-*`; new file uses `--zjc-*` — distinct, does not match
  the old glob. The only `--zj-` substrings in either new file are two prose sentences
  naming the old prefix to explain the deliberate break, not live tokens (confirmed by
  reading the file, not just trusting the PR description's claim).
- **Hex values**: old palette (`#0B0D10`, `#12161B`, `#1E1210`, `#DAD5C8`, `#8E97A3`,
  `#F5A524`, `#6FCF97`, `#FF5A45`, `#2B323B`, `#6B7684`) vs. new palette (`#F2F3F5`,
  `#FFFFFF`, `#16181C`, `#5B6270`, `#D7DAE0`, `#7A7F90`, `#2A46C9`, `#3E6B4F`, `#B3271E`,
  `#A9ADB6`, `#7C93F0`, `#8FD6A6`, `#FF8A80`) — no overlap.
- **Visual language**: old file was dark-only (`color-scheme: dark`), single amber
  accent, a hazard-tape repeating-gradient token, a "sweep" status-glyph token set, and
  motion built for a terminal (implied boot/cursor treatment via a mono-only body font).
  New file is light-default, one cobalt "signal" accent plus two single-purpose state
  colors, a plain CSS graph-paper grid (not circuit/PCB), small utility-shape radii, and
  explicitly states in §5 that no `steps()`/blink easing, boot-sequence, or cursor-blink
  effect exists anywhere in the new set. No hazard stripes, scanlines, neon, or
  boot/cursor effects found in either new file.

## Hard-rule check

- No external network calls: grepped both new files for `https?://`, `url(`, `@import`,
  `@font-face`, `googleapis`, `fonts.`, `cdn.` — zero matches. Font stacks are system-only
  (`-apple-system`/`Segoe UI`/... and `ui-monospace`/`SF Mono`/...).
- No fabricated owner/brand facts — neither file references the owner or a founding
  story; §7 of the style guide correctly notes none apply to this doc.

## Hygiene

- `tools/scan-secrets.mjs` run against the branch's three changed files (extracted via
  `git show` since the branch is checked out in another worktree): `3 files scanned, 0
  skipped, 0 error(s), 0 warning(s) -> PASS`.
- No `package.json`/lockfile changes on this branch, so a full `npm install`/`npm audit`
  has nothing new to evaluate; skipped as not applicable to a docs/CSS-only branch.
- No markdown hyperlinks in either file to check for breakage (cross-references are
  plain-text paths in prose, not `[text](url)` links).
- Accessibility: contrast table verified above; focus-ring, reduced-motion, and
  reduced-motion-collapse rules are all specified and consistent between `tokens.css`
  and `style-guide.md` §3/§5.

## Verdict

**Approved.** No required changes. Board's D2 row updated to `approved` in this same
commit.

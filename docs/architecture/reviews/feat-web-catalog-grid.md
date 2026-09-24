# Architect review — `feat/web-catalog-grid` (board task E2)

Reviewer: architect. Date: 2026-09-24. Branch base: `main` @ `d08d960` (confirmed current
`origin/main` at review time — no merges landed between branch creation and this review).
Branch tip: `4ceb969` (4 commits, not pushed).

**Verdict: approved.**

## What I checked

### 1. Product data — 12 vs. 13, verbatim copy, structural exclusion
Read `apps/web/src/data/products.ts` in full and diffed every field against
`docs/design/products.md` §2/§3 by hand:
- `products` array has exactly 12 entries, 5 shirt / 4 sweatshirt / 3 hat — matches D3's
  split exactly.
- Every name, category, price, tag list, description, and `specialCopy.content` block
  (all 8 that D3 specifies one) matches D3 verbatim — field names, spacing, and command
  syntax unchanged (checked `care.cfg`, `git blame` output, the CLF access-log lines,
  `crontab -l`, the INI two-block config, the TCP handshake trace, and the two remaining
  config-file blocks character-for-character).
- The 5 plain-copy products (`localhost`, `Works on My Machine`, `Rubber Duck Hoodie`,
  `sudo Cap`, `Off-by-One Cap`) correctly carry no `specialCopy`, matching D3 §1.
- The hidden 13th product (`200 OK Tee`) is `export const hiddenProduct`, a value never
  referenced by `products`, `CatalogPage.tsx`, or any other file in the diff (confirmed
  via `git grep hiddenProduct` — only the data module and its own test import it). This
  satisfies D3's hard constraint: excluded by construction, not filtered at render time.
  Its copy also matches D3 §3 verbatim, including the deadpan-tone description reused
  from D1.

### 2. D2 tokens wired in for real
- `apps/web/src/styles/tokens.css` diffed byte-for-byte against `docs/design/tokens.css`
  — identical.
- Imported in `main.tsx` before `index.css`, confirmed by reading the file.
- Read all of `index.css` and `ProductCard.tsx`: every color, spacing, type, radius,
  z-index, and motion value is a `var(--zjc-*)` reference. Grepped for raw hex, `rgb(`/
  `rgba(`, and un-tokenized `ms`/`ease-*` values in `index.css` — none found.
- One minor deviation, not blocking: `.page { max-width: 72rem; }` is a new, un-tokenized
  raw value (tokens.css has no container-width token, and the style guide's §6 rule reads
  literally as "no unscaled px/rem"). It's a defensible one-off in the same spirit as the
  already-precedented, also-un-tokenized 640px/960px breakpoints, but the PR should have
  flagged it to the Creative Director the way it flagged the D4 placeholder-tile
  treatment, instead of silently picking a number. Not asking for a fix on this branch —
  noting it so the Creative Director can decide whether a container-width token belongs
  in a future D2 revision.

### 3. Responsiveness and CSS-only placeholders
- Read the grid CSS: 2 columns at base, `repeat(3,1fr)` at `min-width: 640px`,
  `repeat(4,1fr)` at `min-width: 960px`.
- Confirmed in the actual production build output (`dist/assets/*.css`, built fresh in
  this review, not taken from the PR): all three rules present at the claimed
  breakpoints, byte-identical to what the PR quotes.
- `ProductCard`'s placeholder is a `<span>` with `aria-hidden="true"`, styled with the
  grid-motif CSS gradients from `tokens.css` — no `<img>`, no background-image URL, no
  network request. Grepped the whole diff for `<img`, `http://`, `https://`, `fetch(`,
  `XMLHttpRequest` — the only hits are comments/tests documenting the absence.

### 4. Ownership
`git diff main..feat/web-catalog-grid --name-only` touches only:
`apps/web/src/{components,data,pages,styles}/**`, `apps/web/src/main.tsx`,
`apps/web/src/index.css`, and `docs/prs/feat-web-catalog-grid.md`. Nothing under
`docs/design/**`, `.claude/**`, or any Creative Director path. Clean.

### 5. Hard rules
No network calls, no external assets/fonts (system font stack only, matching D2), no
fabricated content — product copy matches D3 verbatim rather than being paraphrased. No
secrets.

### 6. Checks — reproduced myself, not taken on faith
Ran in this worktree, Node v22.12.0, after `npm install` (checked out branch tip `4ceb969`
detached, since the branch was already checked out in the Engineer's worktree):

```
$ npm run typecheck   -> clean, no output
$ npm run lint        -> clean, no output
$ npm test            -> 7 test files passed (7), 46 tests passed (46)
                          + tools/scan-secrets.test.mjs: 9/9 pass
$ npm run build       -> ✓ 41 modules transformed, built in 433ms
                          dist/assets/index-DluCaYE1.css and index-DWEQdIHB.js —
                          identical hashes to the PR's own run (confirms reproducibility)
$ npm run scan-secrets -> 114 files scanned, 0 skipped, 0 errors, 0 warnings -> PASS
                          (113 in the PR's run; +1 here is this review file's own worktree
                          state at scan time, not a finding)
$ npm run audit:ci     -> found 0 vulnerabilities
```

All numbers match the PR file's claims exactly (test file count, test count, build
manifest). Spot-checked `data/products.test.ts` and `pages/CatalogPage.test.tsx` by
reading them in full: both have a dedicated assertion that the hidden product is excluded
(`products.some(p => p.id === "200-ok-tee")` is `false`, and `screen.queryByText("200 OK
Tee")` is not in the document) — not just a count-of-12 check standing in for it.

## Minor notes for the record (non-blocking)
- The `.page { max-width: 72rem }` raw value (see §2 above) — flagging for the Creative
  Director's awareness, not a required change.
- Breakpoint values (640px/960px) remain un-tokenized, consistent with E1's existing
  convention and the board task's instruction to reuse it — not a new issue introduced by
  this branch.
- The Engineer correctly flagged its own scope call (catalog placeholder-tile visual
  treatment, made in the absence of D4) in the PR file — no action needed now, revisit if
  D4 wants something different.

## Board update
`docs/architecture/board.md` E2 row: `todo` -> `approved`.

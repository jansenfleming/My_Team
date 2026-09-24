# Review: feat/design-eggs (D5)

Reviewer: architect, 2026-09-24. Commit reviewed: `703a19a` (base `main` at `d08d960`,
current). Docs-only design branch: architect review only, no QA gate required.

Note: a review file with this same path already existed, written for the old,
superseded cybersecurity-terminal project's `feat/design-eggs` branch (Konami-style
"quip table" content, unrelated to streetwear). That branch and its content are gone;
this review overwrites the stale file, matching the convention already used for
`feat-web-shell.md` and `feat-design-tokens.md`. No content is lost — git history keeps
the old text.

## Scope reviewed

`docs/design/easter-eggs.md` (new, ~342 lines) and `docs/prs/feat-design-eggs.md`
(rewritten, overwriting a stale file from the old project — same established
convention as `feat-web-shell.md`/`feat-design-tokens.md`, not flagged as a problem).

## 1. All three D1-picked eggs specced, none added/dropped

Confirmed. `concept.md` §4 picked exactly three: dev-console/view-source message, joke
404 page, hidden 13th product via Konami code (changelog page and discount-code pun
stay deferred). `easter-eggs.md` §0 states this explicitly and §1–§3 spec exactly those
three, one section each, no more. Each section gives:
- **Exact trigger** — e.g. Konami: the literal 10-key sequence, exact matching/reset
  algorithm, global `window`-level listener location, editable-element guard, no
  `preventDefault()`. 404: any unmatched `matchRoute()` result, including the hidden
  slug when locked. Dev-console: fires once per full page load, not per route change.
- **Exact output/content** — literal strings given verbatim for all three (HTML
  comment text, three `console.log` calls in order with exact styling string, 404
  heading/status-line format/body copy/link labels, banner copy/link/dismiss control).
- **Discoverability** — dev-console/view-source: inherently discoverable by the named
  action. 404: every visitor who hits a bad URL sees it. Konami: deliberately
  undocumented except for one indirect breadcrumb (console line 3), explicitly framed
  as a design choice, not an oversight.

This is precise enough to build without guessing — trigger, output, and edge cases
(truncation, storage failure, focus guard, re-entry after unlock) are all spelled out.

## 2. Token cross-check

Spot-checked every `--zjc-*` name cited in `easter-eggs.md` against
`docs/design/tokens.css` and the contrast table in `docs/design/style-guide.md`:

| Cited | Exists | Claimed purpose | Matches source |
|---|---|---|---|
| `--zjc-alert` | yes | 404 heading; style-guide row 11, "Error/sold-out text, 404 copy on page bg" | yes, row 11 text matches verbatim |
| `--zjc-fg-muted` | yes | 404 status line, row 3, 5.52:1 on `--zjc-bg` | yes, exact ratio matches |
| `--zjc-link`/`--zjc-signal` | yes | 404 links, row 5, 6.71:1 | yes, exact ratio matches |
| `--zjc-fg` | yes | 404 body copy (row 1); Konami banner body, row 2, 17.77:1 on `--zjc-bg-surface` | yes, both ratios match |
| `--zjc-bg-surface` | yes | Konami banner card background | yes |
| `--zjc-z-toast` | yes | Konami banner z-index (60), "same layer already named for the added-to-bag toast" | yes, `tokens.css` defines `--zjc-z-toast: 60` with that exact comment |
| `--zjc-ok` | yes | Konami banner accent, "in-stock / confirmed / exit code 0 register" | token exists with that exact purpose — **but** this phrasing is `tokens.css`'s own inline comment (line 46), not `style-guide.md`'s row 8 wording ("'In stock' text, dry confirmation copy"). The spec attributes it to "the token style-guide.md names for exactly this register" — minor misattribution of *which* file, not a wrong token or a wrong meaning. Non-blocking. |
| `--zjc-weight-bold` (700) | yes | console `%c` style, "matches `--zjc-weight-bold`" | yes, `--zjc-weight-bold: 700` |
| `--zjc-font-mono` | yes | console style + 404 status line | yes |
| `--zjc-text-2xl`/`--zjc-text-3xl`/`--zjc-weight-black` | yes | 404 heading size options | yes |
| `--zjc-text-sm`/`--zjc-text-base` | yes | 404 status line size options | yes |
| `--zjc-dur-moderate`/`--zjc-ease-out` | yes | optional banner entrance | yes |
| Grid motif on "the 404 page background" | — | style-guide.md §3 names "the 404 page background" as a sanctioned use | yes, verbatim match in style-guide.md §3 |

**Result: every cited token exists with the name and purpose claimed.** The only
finding is the one-line attribution nit above (tokens.css vs. style-guide.md as the
source of the "in-stock / confirmed / exit code 0" phrase) — doesn't affect
buildability, not required to fix before merge, but worth a one-line correction next
time this file is touched if convenient.

## 3. Konami / hidden-product URL-guessing constraint (D3)

D3 §3's hard constraint: the 13th product "must not be reachable by direct navigation
from ordinary browsing," and must be "excluded from every 'all products' loop by
construction, not filtered out at render time."

`easter-eggs.md` §3 "Reveal," step 3 is explicit and correctly satisfies this: the
route `/product/200-ok` is *not* specially registered or omitted — `matchRoute.ts`
needs no changes, it matches the existing `/^\/product\/([^/]+)$/` pattern like any
other product slug. The gate lives **inside `ProductPage`'s lookup**: it renders the
real product "only if `localStorage.getItem('zj_unlocked_200ok') === '1'`," and
explicitly states that this covers "a visitor who guesses or types the URL directly
without ever entering the code" — in that case it "render[s] the exact same
`NotFoundPage` any other unmatched slug gets." That is precisely "gate on the unlock
flag inside the page, not omit the route" — a visitor cannot get the real page by URL
alone under any circumstance, only by completing the code first (which sets the flag
this same page checks). Unambiguous instruction for the Engineer; no guessing required.

## 4. Ownership check

`git diff --stat main..feat/design-eggs` touches only:
- `docs/design/easter-eggs.md` (new)
- `docs/prs/feat-design-eggs.md` (rewritten)

Both are Creative Director-owned paths per `ownership-map.md`. No `apps/**` or other
path touched. `docs/prs/feat-design-eggs.md` overwriting a stale file from the deleted
old-project branch of the same name matches the established, already-approved
convention (same as `feat-web-shell.md`, `feat-design-tokens.md`) — not a problem.

## 5. Hard-rule check

- **Client-side only, no external calls/assets:** confirmed for all three eggs —
  static HTML comment, `console.log` calls, `window` keydown listener,
  `localStorage`. §4 of the spec states this explicitly and it holds up on inspection;
  nothing fetches, posts, or references a third-party URL.
- **No fabricated owner/brand facts:** confirmed. The only "new technical claims" are
  the `200 OK` framing of a page-source request (correct HTTP usage) and "console.log
  is still the most common debugger" (a defensible, non-specific claim about developer
  practice, not a fabricated statistic). No owner/founding-story content appears
  anywhere in this doc.
- **Cart/checkout copy discipline:** N/A — none of the three eggs touch cart or
  checkout copy.
- **Accessibility:** the Konami banner is non-modal, dismissible, `aria-live="polite"`,
  doesn't auto-navigate (explicitly avoids an unrequested context change), and the 404
  page's pathname is rendered as escaped JSX text, never `dangerouslySetInnerHTML`.
  Reduced-motion is respected per the standing `tokens.css` fallback. Good practice
  beyond the minimum bar.

## 6. Hygiene

- `npm install` at repo root: clean, `0 vulnerabilities`, only a pre-existing
  `EBADENGINE` warning (eslint-visitor-keys/Node version) and an eslint deprecation
  notice, neither introduced by this branch.
- `node tools/scan-secrets.mjs --path <easter-eggs.md> <feat-design-eggs.md>` (branch
  copies of the two changed files): `2 files scanned, 0 skipped, 0 error(s), 0
  warning(s) -> PASS`.
- Branch is docs-only; no lint/typecheck/build/test applies.

## Verdict

**Approved.** No required changes. One optional, non-blocking nit: `easter-eggs.md`'s
Konami-banner token note attributes the "in-stock / confirmed / exit code 0" phrase to
`style-guide.md` when it's actually `tokens.css`'s inline comment on `--zjc-ok` — the
token and its meaning are both correct, only the cited source file is off by one
document. Not worth a re-review cycle; fold it in if the Creative Director happens to
touch this file again.

Ready to merge. E6 (easter-egg implementation) and the `ProductPage`-lookup portion of
E3 are unblocked on the design side once this lands.

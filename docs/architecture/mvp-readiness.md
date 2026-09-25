# ZeroJance MVP Readiness Report (A3)

Owner: Architect. Date: 2026-09-25. Branch: `docs/architecture-a3-mvp-readiness`, off
`main` at `5a5a848` (current tip: D1-D5, E1-E7 all merged). This report is the
Architect's independent verification, not a re-statement of the board — every check
below was re-run in this worktree, not copied from a prior review file.

Companion doc: `docs/architecture/phase-2-backlog.md` (candidate next steps).

---

## 1. Verdict up front

**Recommendation: go.** The MVP as built matches the owner's original scope in
`docs/project-brief.md` with no material gaps. The full check suite is clean on current
`main`, verified independently. There is one small, genuine loose end (a live footer
placeholder never picked up by any design task — see §4) and a short list of
non-blocking notes carried over from individual reviews (see §5). None of these are
scope gaps or broken functionality; all are documented so the owner can decide, per the
brief, whether to fix them before or after shipping.

This is a recommendation, not a deploy decision — the Architect has no deploy authority
(`docs/project-brief.md`, "Approval boundaries"). The owner decides whether/when to
ship; the lead relays that decision.

---

## 2. What shipped (summary, not a PR-by-PR re-listing)

- **Brand and design system** (D1-D2): a voice guide (deadpan, technically-accurate,
  peer-to-peer), a palette/type/spacing/motion token set (`docs/design/tokens.css`,
  `--zjc-*`), and a style guide with a fully computed WCAG contrast table — spot-checked
  independently by the Architect during D2's review, not just read.
- **Catalog** (D3, E2): 12 main-catalog products (5 shirts / 4 sweatshirts / 3 hats),
  plus a hidden 13th shirt (bringing the shirt total to 6 once it's counted), each with
  a real tech/programming in-joke copy-checked against the actual command/protocol/
  status-code behavior it references. A responsive grid (2/3/4 columns at three
  breakpoints), CSS-only placeholder art (no images, no network requests).
- **Product detail + cart** (E3-E4): per-product pages with a mock size/variant picker,
  `localStorage`-persisted cart state, a cart drawer with working quantity/remove/
  subtotal math, and a checkout screen that is honestly and explicitly mocked in both
  code (a comment at the exact point a real order/payment call would go) and copy (an
  exact, D1-specified disclosure line on both the checkout and post-order screens: no
  claim of a processed payment or a sent order anywhere).
- **Lookbook and about pages** (D4, E5): a four-look editorial page covering all 12
  catalog products exactly once (verified again below), motion gated behind
  `prefers-reduced-motion` with an `IntersectionObserver` fallback path; an about page
  carrying five distinct `[PLACEHOLDER: ...]` markers for real owner/founding facts.
- **Three easter eggs, curated** (D5, E6): a view-source HTML comment + a
  `console.log` sequence (fires once per page load); a joke 404 page using a real,
  correctly-formatted HTTP status line; and a hidden 13th product gated behind the
  classic Konami sequence, unlockable via a `localStorage` flag with an in-memory
  fallback, confirmed unreachable by direct URL guessing until unlocked.
- **Polish pass** (E7): a cyclic keyboard focus trap on the cart drawer (closing a real
  gap flagged in E4's review — a keyboard user could previously tab into dimmed
  background content while the drawer was open), a stale `color-scheme` meta fix, a
  header-overflow fix, and a CSS grid-blowout fix (`repeat(N, 1fr)` →
  `repeat(N, minmax(0, 1fr))` at all 5 call sites).
- **Process**: every task went through the full branch → PR file → Architect review →
  lead merge cycle described in `docs/architecture/ownership-map.md`, with real command
  output re-run by the Architect (not taken on the PR author's word) at every review —
  confirmed by reading all ten `docs/architecture/reviews/feat-{design,web}-*.md` files
  for this project in full before writing this report.

## 3. Scope check against the owner's original brief

Checked directly against `docs/project-brief.md` Part 1 (the owner's verbatim master
prompt), not against the board's paraphrase of it:

| Owner's ask | Status | Evidence |
|---|---|---|
| Product grid | Met | `apps/web/src/pages/CatalogPage.tsx`, responsive 2/3/4-col grid |
| Product detail pages | Met | `apps/web/src/pages/ProductPage.tsx`, one per product via `/product/:slug` |
| Lookbook/editorial page | Met | `apps/web/src/pages/LookbookPage.tsx`, 4 looks, all 12 products |
| About/brand page | Met | `apps/web/src/pages/AboutPage.tsx`, placeholders intact |
| Believable mock cart/checkout, no real payment | Met | `apps/web/src/cart/**`; verified no `fetch`/`XMLHttpRequest`/network call anywhere in cart or checkout code (re-grepped this worktree, zero hits outside test spies and comments) |
| 6-12 products, shirts/sweatshirts/hats only, no accessories | Met | 12 in the main catalog (5 shirt + 4 sweatshirt + 3 hat), verified by reading `apps/web/src/data/products.ts` directly: `products.length === 12`, categories are exactly `"shirt" | "sweatshirt" | "hat"` |
| Hidden 13th product, discoverable via interaction | Met | Konami code → `hiddenProduct` (`200 OK Tee`), gated in `ProductPage`'s lookup, not in routing |
| Multiple secret/easter-egg layers (more than one) | Met | 3 distinct layers on 3 distinct discovery surfaces (browser devtools, an error page, a keyboard sequence) — within the brief's own suggested list |
| Not an interactive terminal (contrast with the old project) | Met | No terminal engine, no command parser; ADR 0003 confirms the old `apps/web/src/terminal/**` was removed |
| Real GitHub PRs, Architect review, lead merges | Met | Confirmed via `git log --oneline` on `main`: every feature branch shows a merge commit plus a separate `docs/review-*` merge, matching the working agreement |

**No scope gaps found.** The site matches the owner's original ask as written, not just
the board's restatement of it.

## 4. One loose end found during this review (not caught by any prior task)

`apps/web/src/layout/Layout.tsx`'s `<footer>` (shipped in E1, never touched since)
renders, verbatim, on every page:

> ZeroJance is a mockup catalog. Nothing on this site processes a real payment or sends
> a real order. **[PLACEHOLDER: real footer copy from the Creative Director.]**

This is honest (it doesn't fabricate anything) and functionally harmless, but it is a
visible, literal placeholder bracket on every single page of a site being evaluated for
launch readiness — not the same category as the about-page placeholders, which are
narrative facts about the owner the brief explicitly expects to stay placeholder until
supplied. Checked every D1-D5 design doc and every engineering review for a mention of
footer copy: none exists. No task ever picked this up; it fell through a gap between
E1 (which added it as a stopgap) and D4 (which specified about/lookbook copy but not the
global footer). This is a small, same-day fix for the Creative Director (a real,
in-voice one-line footer sentence, still honest about the mock-checkout discipline) —
flagging it here rather than letting it ship unnoticed. Not a blocker for the go/no-go
call below, but recommended to close before the owner considers this "done" cosmetically.

## 5. What was explicitly deferred, and why (from the reviews and design docs)

- **`git log`-styled changelog page** (brief idea #3): deferred in D1 (`concept.md` §4)
  because it reads as an ordinary nav-reachable content page, not a "secret" — building
  it would blur the curated-eggs budget. `docs/design/lookbook.md` explicitly avoided
  reusing this framing for the lookbook page itself, to keep the deferral clean. Flagged
  by D1 as a genuine v2 candidate, not a rejected idea.
- **Discount code that's a programming pun** (brief idea #5): deferred in D1 because a
  *working* discount code implies functioning checkout validation/state right where
  mock-commerce honesty is already the highest-stakes part of the site (E4). The pun
  itself shipped anyway as static copy (the HTTP-200 line reused on the hidden product
  and in D1's own do/don't table), just not as an interactive coupon field.
- **Config-file-styled product tags/care labels** (brief idea #6): not deferred, but
  reclassified — D1 folded this into D3 as a standing copy rule (8 of 13 products carry
  a config-file/log-styled `specialCopy` block) rather than counting it against the
  2-3 curated "egg" budget, since it's visible standard copy, not a discovered secret.
- **`git blame --porcelain` mislabeling** (D3 first-pass review): a real technical-
  accuracy error (the hangtag showed `git blame`'s *default* output but was labeled
  "porcelain," a different real format) — caught in first-pass review, fixed in the
  branch's own follow-up commit (`6b5972c`), independently re-verified by the Architect.
  Resolved, not outstanding.
- **CLF request-line completeness** (D3 review, optional/non-blocking): the product-4
  hangtag's Common Log Format line initially omitted the HTTP version in the quoted
  request field. Noted as optional in first-pass review; the Creative Director added it
  anyway in the same fix commit. Resolved, not outstanding.
- **`--zjc-ok` token source misattribution** (D5 review, non-blocking): `easter-eggs.md`
  attributes a phrase to `style-guide.md` that's actually `tokens.css`'s inline comment.
  Token and meaning are both correct; only the cited source file is off by one document.
  Left as a fold-in-next-touch note, not worth its own review cycle.
- **Lookbook hero-subhead vs. look-intro type size** (E5 review): a genuine 2px spec
  inconsistency in `docs/design/lookbook.md` §3 (two conflicting statements about which
  token to use). The Engineer implemented each section's own explicitly-stated value
  literally and flagged the conflict rather than guessing. Architect's call: leave as
  implemented — the gap is imperceptible and both values are legitimate D2 tokens. A
  free wording cleanup for the Creative Director next time that file is touched, not a
  blocker.
- **Cart-drawer keyboard focus trap** (flagged in E4's review, closed in E7): tabbing
  past the drawer's last focusable element used to leak focus into dimmed background
  content for keyboard users specifically (pointer users were already blocked by the
  backdrop). Deliberately deferred from E4 to E7 (the board's dedicated a11y pass)
  rather than bolted on under review pressure. Confirmed closed: E7 shipped a live,
  correctly-wrapping cyclic focus trap with two tests proving the actual keyboard-escape
  scenario. Resolved, not outstanding.
- **Checkout shipping/tax exact-dollar-amount test coverage** (E4 review, non-blocking):
  no test asserts the literal rendered shipping/tax/total dollar figures, only that the
  labels are present. The Architect hand-verified the arithmetic against a seeded
  fixture and found it correct. A minor test-coverage gap on illustrative mock numbers
  with no real-world stakes — worth a follow-up assertion whenever this file is next
  touched, not required before ship.
- **`.page { max-width: 72rem }` un-tokenized value** (E2 review, non-blocking): one raw
  CSS value with no corresponding D2 token (tokens.css has no container-width token).
  Flagged to the Creative Director's awareness for a possible future D2 revision; not a
  defect.
- **Hosting decision** (ADR 0003, explicit): deliberately not decided. ADR 0003 names
  GitHub Pages as the likely fit (matches the old project's ADR 0002 reasoning: static,
  free, no backend to expose) but states plainly a fresh ADR should be written "when the
  build is close to shippable, not guessed now." That point has now arrived — see the
  Phase 2 backlog.

## 6. `[PLACEHOLDER: ...]` marker inventory (grepped fresh, this review)

Every live marker in the current site and its source design docs, and exactly what the
owner needs to supply for each:

| Location | Marker | What's needed from the owner |
|---|---|---|
| `docs/design/concept.md` (D1, source spec) | `[PLACEHOLDER: real meaning/origin of the name "ZeroJance"]` | The real meaning/origin of the brand name, if one exists beyond the "zero" tone-frame D1 uses as a style note only |
| `docs/design/concept.md` (D1, source spec) | `[PLACEHOLDER: brand founding story — who, when, why, where]` | The founding story: who started ZeroJance, when, why, where |
| `docs/design/about.md` (D4, source spec) + `apps/web/src/pages/AboutPage.tsx` (shipped page, byte-verified identical to the spec by the E5 review) | `[PLACEHOLDER: the real meaning or origin of the name "ZeroJance", if there is one beyond the style note above...]` | Same as above — name origin |
| same | `[PLACEHOLDER: year]` | The year ZeroJance was founded |
| same | `[PLACEHOLDER: founder name or detail]` | Who founded it / founder detail |
| same | `[PLACEHOLDER: location]` | Where it was founded |
| same | `[PLACEHOLDER: the specific reason ZeroJance exists — what problem, whose idea, why apparel]` | The founding motivation/story |
| `apps/web/src/layout/Layout.tsx` (site-wide footer) | `[PLACEHOLDER: real footer copy from the Creative Director.]` | Not an owner-fact placeholder — this one needs the Creative Director to write real in-voice footer copy (see §4); no owner input required, just an un-picked-up task |

Six of the eight rows are the same underlying two owner facts (name origin, founding
story), repeated because the about-page copy spells each fact-slot out separately
(year/founder/location/reason) rather than one combined placeholder. The footer row is
the one genuine process gap (§4), not an owner-input wait.

No other `[PLACEHOLDER: ...]` markers exist anywhere in `apps/web/**` or the live
`docs/design/**` specs (grepped the full worktree, excluding `node_modules`, `dist`, and
files that belong to the superseded old project — `docs/prs/feat-design-commands.md`,
`docs/prs/feat-terminal-engine.md`, `docs/architecture/adr/0002-hosting.md`,
`docs/architecture/kickoff/*.md`, `.claude/agents/*.md` — which are historical record
for the terminal project or generic process docs, not live ZeroJance content).

## 7. Check suite — real output, re-run independently on current `main`

Run in this worktree (`.claude/worktrees/agent-aa67f9a9dfc412afc`), `main` at `5a5a848`,
Node v22.12.0, npm 11.6.1, 2026-09-25. Every command below was actually executed for
this report, not copied from a prior review file.

```
$ npm install
npm warn EBADENGINE eslint-visitor-keys@5.0.1 (needs Node ^22.13/^20.19/>=24; pre-existing, unrelated)
npm warn deprecated eslint@9.39.5 (pre-existing)
added 307 packages, and audited 309 packages in 2s
found 0 vulnerabilities

$ npm run typecheck
tsc --noEmit -p tsconfig.json   -> exit 0, no output

$ npm run lint
eslint .   -> exit 0, no output

$ npm test
 Test Files  17 passed (17)
      Tests  157 passed (157)
   Duration  2.67s
(tools/scan-secrets.test.mjs: 9/9 pass, part of the same run via `node --test tools/*.test.mjs`)

$ npm run build
vite v7.3.6 building client environment for production...
✓ 49 modules transformed.
dist/index.html                   0.59 kB │ gzip:  0.36 kB
dist/assets/index-TqR6siyd.css   24.06 kB │ gzip:  4.30 kB
dist/assets/index-DfB4jRoc.js   250.68 kB │ gzip: 78.00 kB
✓ built in 469ms

$ npm run scan-secrets
scan-secrets [working-tree]: 148 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
found 0 vulnerabilities
```

All seven checks clean. 157/157 tests across 17 files matches E7's review exactly (the
last engineering gate); no regression since. The one pre-existing, unrelated
`EBADENGINE` warning (an `eslint-visitor-keys` dependency wanting a slightly newer Node
patch than this environment's 22.12.0) has been present and non-blocking since E1's
first review — not a new finding.

A stray, pre-existing `package-lock.json` diff (one `"peer": true` metadata line
removed, an artifact of this environment's `npm install` regenerating lockfile
metadata against a package.json unchanged since before this branch) was present in the
worktree before this task started and is not part of this branch's diff — left alone,
not committed.

## 8. Basic hygiene pass (this review, beyond the check suite)

- **Secrets:** `npm run scan-secrets` clean, 148 files (see §7).
- **Dependencies:** `npm audit --audit-level=high` clean, 0 vulnerabilities. No new
  dependency has been added since E7's review.
- **Broken links:** every `Link to="..."` target across the app resolves to one of the
  6 registered routes (`/`, `/catalog`, `/product/:slug`, `/lookbook`, `/about`, 404
  fallback) — confirmed by each individual task's own review (E1-E7) and re-spot-checked
  here; no new routes or links were added since E7, so no new broken-link risk exists.
- **Accessibility:** landmarks (skip link, single `<main>`), heading hierarchy (no
  level-skipping on any page), `aria-live` regions for cart/confirmation UI, keyboard
  focus trap on the cart drawer, `prefers-reduced-motion` respected everywhere motion is
  used, and the full D2 contrast table (independently spot-checked with hand-computed
  WCAG ratios during D2's review) — all previously verified per-task and not
  re-litigated here since nothing touching these areas has changed since E7.
- **No external calls:** re-grepped the full `apps/web/src` tree for
  `fetch\(|XMLHttpRequest|axios|WebSocket|EventSource|https?://` outside of tests/
  comments — zero live hits, confirming the mock-cart/checkout discipline holds
  end-to-end, not just in the branches that introduced it.

## 9. Process note on this task's own status

Per the same "lead confirms the merge" convention used for every other board task, A3's
board row moves to `review` with this report (not `done`) — the Architect does not mark
its own work merged. Once the lead reviews this branch and the real PR is merged, the
lead (or the Architect on the lead's confirmation) flips A3 to `done`, matching the
pattern used for A1 and every D/E task.

# Review: feat/design-brand (D1 — Brand identity and voice)

Reviewer: Architect. Branch: `feat/design-brand` (2 commits, off `main` @ f44f356, not
pushed). Files touched: `docs/design/concept.md` (new), `docs/prs/feat-design-brand.md`
(new). Verdict: **approved**.

## 1. Definition-of-done check (against board.md's D1 entry)

| Required | Found | Verdict |
|---|---|---|
| Premise | Section 1: ZeroJance as workwear built on programming/networking folklore ("workplace humor, not futurism"), explicitly contrasted with both generic streetwear-coding templates and the repo's own prior cyberpunk-terminal project (cites ADR 0003 implicitly via the contrast, matches ADR 0003's actual content). | Met |
| Voice guide with do/don't sample lines | Section 2: tone description (deadpan, technically accurate, terse, peer-to-peer, doesn't explain its own jokes) plus a 7-row do/don't table with concrete lines and a stated reason per row. | Met |
| Three anti-generic points | Section 3: (1) technical correctness is a hard constraint — no invented status codes/commands for a pun; (2) joke lives in the object's structure (config-file care label, CLI-styled size chart) not a slogan; (3) curated references that explicitly avoid the three most-memed tropes (Matrix rain, "someone else's computer," hoodie-hacker silhouette), replaced with a concrete list (cron, `git blame`, TCP handshake, off-by-one, 403-vs-404, etc). All three are specific and checkable, not generic branding platitudes. | Met |
| Explicit pass over all six brief easter-egg ideas, picks + reasons for deferrals | Section 4: a six-row table, one row per brief idea. Picked for D5: dev-console/view-source message, joke 404 page, hidden-13th-product via Konami code — three different discovery surfaces, each with a build-cost/on-theme rationale. Deferred: `git log`-styled changelog (reclassified as nav-reachable content, not a "secret," and flagged as a v2 candidate — a real tradeoff, not "didn't get to it") and the programming-pun discount code (deferred specifically because a *working* discount code adds interactive-checkout surface right where mock-commerce honesty is already load-bearing — the pun itself survives as static tag copy). Config-file product tags reclassified as a standing D3 copy rule rather than a curated egg, since it's not visitor-discovered. Picks total 3, within the board's "2-3" budget. | Met |

Quality note: the reasoning for both deferrals is a genuine tradeoff argument (content-vs-secret distinction; checkout-honesty risk surface), not a placeholder excuse. This is the kind of judgment call D1 needed to make explicit for D5 to build on.

## 2. Ownership check

`git diff --stat main..feat/design-brand`:
```
docs/design/concept.md        | 149 ++++++++++++++++++++++++++++++++++++++++++
docs/prs/feat-design-brand.md |  82 +++++++++++++++++++++++
2 files changed, 231 insertions(+)
```
Both paths are Creative Director territory per `ownership-map.md` (`docs/design/**` and
`docs/prs/<branch-slug>.md`, authored by the branch's own author). Nothing under
`apps/**`, `.claude/**`, `docs/architecture/**`, or any other Architect/Engineer-owned
path is touched. Clean.

## 3. Hard-rule check

- **Fabricated facts about the owner / founding story:** none found. Two explicit
  `[PLACEHOLDER: ...]` markers cover the only two places an owner/founding fact could
  land: the real meaning/origin of "ZeroJance," and the founding story (who/when/why/
  where). The doc goes further than the minimum bar: it gives a **design frame** for the
  name ("zero" / exit-code-0 / index-0 read against "riddance"/"chance") but explicitly
  labels it as a tone frame, not a claimed etymology, and explicitly instructs that it
  must never be presented as fact in customer-facing copy. No founding year, location,
  headcount, or backstory appears anywhere in the document (confirmed by full read).
- **Cart/checkout honesty rule:** Section 2 states the hard rule in full — cart/
  checkout copy must read as real UI but never claim a real transaction; the rule
  explicitly binds D3/D4/D5 too, not just this doc's own examples. Checked every
  cart-adjacent example in the do/don't table ("Sized true...", "Ships when it ships. No
  ETA promises here either.") — none imply a processed payment or a sent order. No
  cart/checkout-adjacent copy elsewhere in the file conflicts with this rule.

## 4. Basic hygiene

- **Secrets:** `npm install` in this worktree, then `npm run scan-secrets` against the
  working tree — clean (`88 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS`).
  Additionally ran the scanner directly against extracted copies of both of the branch's
  new files (`node tools/scan-secrets.mjs --path <concept.md> <feat-design-brand.md>`):
  `2 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS`.
- **External calls / third-party assets:** grepped both new files for `http(s)://` —
  zero matches. No fetched assets, no external links, no scripts. Consistent with a
  docs-only branch.
- **Dependencies:** branch adds no `package.json`/lockfile changes, so `npm audit` is
  not applicable to this diff.
- **Accessibility / broken links:** not applicable — no HTML/UI shipped in this branch.

## Outcome

No changes required. D1 is approved. `docs/architecture/board.md` updated: D1 row set
to `approved`, and the "Suggested waves" section updated to note that D2, D3, and D4
start once the lead confirms `feat/design-brand` is merged into `main` (per the working
agreement, teammates don't build on an unmerged branch, even an approved one).

Recommend to the lead: merge `feat/design-brand`, then merge this review branch
(`docs/review-design-brand`).

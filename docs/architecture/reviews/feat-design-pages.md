# Architect review — `feat/design-pages` (D4: lookbook and about-page copy/spec)

Reviewer: Architect. Review branch: `docs/review-design-pages`, based on `origin/main`
at `30b2f75` (fetched fresh; includes PR #41 `feat/design-eggs` and PR #42
`docs/review-design-eggs`, both landed after `feat/design-pages` was branched from
`d08d960`). `feat/design-pages` itself: two commits on top of `d08d960`
(`e0be6cc` design docs, `f10cc7b` PR file), not pushed, not rebased — reviewed as-is;
no conflicts with the newer `main` commits since those touched `docs/design/easter-eggs.md`
and review/board files only.

**Verdict: Approved.** No required changes.

---

## 1. Product references and coverage

Cross-checked every product name in `docs/design/lookbook.md`'s four "look" sections
against `docs/design/products.md` Section 2 (the 12 main-catalog products), by exact
string match:

- Look 1 — Local: localhost Tee, Rubber Duck Hoodie, sudo Cap
- Look 2 — On-Call: Works on My Machine Tee, Technical Debt Hoodie, TCP Handshake Cap
- Look 3 — Staging: 403 / 404 Tee, cron Crewneck, Off-by-One Cap
- Look 4 — Shipped: Exit Code 0 Tee, git blame Tee, Staging vs Prod Crewneck

All 12 names match `products.md` exactly (including punctuation, e.g. "403 / 404 Tee").
Each of the 12 appears exactly once, with no repeats and no omissions — the doc's own
"Coverage check" claim in Section 3 is accurate. Category tag content is specified as
the product's category "exactly as it appears in the product data (`Shirt` /
`Sweatshirt` / `Hat`, D3's casing)," which matches `products.md`'s casing.

Hidden 13th product ("200 OK Tee"): grepped both new files for "200 OK", "13th", and
"hidden product" — zero matches outside the explicit statements that it must be
excluded. The doc correctly treats `/lookbook` as ordinary navigation (not the
Konami-code path) and keeps the hidden product out, consistent with `products.md`
Section 3's constraint.

## 2. Token cross-check

Sampled and verified against `docs/design/tokens.css` (D2, merged):

| Token cited | Exists | Claimed purpose matches tokens.css/style-guide.md |
|---|---|---|
| `--zjc-text-3xl` | yes | hero/display headline — matches |
| `--zjc-weight-black` | yes | hero/display type only — matches |
| `--zjc-text-2xl` | yes | tokens.css literally comments this as "section headline"; used for `<h2>` — matches |
| `--zjc-text-lg` | yes | tokens.css comments "card title, section label"; used for product-card name at desktop — matches |
| `--zjc-measure` | yes | 66ch running-paragraph max width — matches |
| `--zjc-dur-slow` | yes | tokens.css comments "page-level reveal (e.g. hero entrance on load)"; lookbook cites this near-verbatim for its scroll-reveal — matches |
| `--zjc-dur-base` / `--zjc-ease-out` | yes | "default transitions: card hover lift" — matches hover-lift usage exactly |
| `--zjc-space-9` / `--zjc-space-7` | yes | style-guide.md §4's documented desktop/mobile section rhythm (96px/48px) — matches exactly |
| `--zjc-radius-sm` | yes | tokens.css comments "tags, chips"; used for the tag — matches |
| `--zjc-grid-line` / `--zjc-grid-size` | yes | style-guide.md §3's grid-motif CSS block, reproduced verbatim in lookbook.md Section 4 — matches |

Also checked the two contrast-ratio citations in `lookbook.md` Section 4 against
`style-guide.md`'s computed table directly:
- "Name text `--zjc-fg` on name-plate `--zjc-bg-surface`: 17.77:1 (row 2)" — matches
  style-guide.md row 2 exactly.
- "Tag text `--zjc-fg-muted` on tag fill `--zjc-bg-surface`: 6.13:1 (row 4)" — matches
  style-guide.md row 4 exactly.

No mismatches found in this sample. No raw hex values or magic-number durations
appear in either file — every color/space/type/motion value is a `--zjc-*` token
reference.

One accuracy note, not a defect: `lookbook.md` states the dark-panel placeholder tokens
(`--zjc-panel-*`) are deliberately *not* used for the 12 lookbook cards because
style-guide.md rate-limits that component to "once or twice per page" — this is a
correct, verified quote of style-guide.md §3, and a reasonable design call.

## 3. `about.md` voice and placeholder discipline

Voice matches D1 (`concept.md`): deadpan, terse, peer-to-peer, no exclamation points,
no hype words. The "Where this started" section carries exactly four distinct
placeholders (`[PLACEHOLDER: year]`, `[PLACEHOLDER: founder name or detail]`,
`[PLACEHOLDER: location]`, `[PLACEHOLDER: the specific reason ZeroJance exists...]`),
matching every fact D1 Section 5 flags as open. "The name" section carries the one
remaining D1 placeholder (real origin/meaning of "ZeroJance") and explicitly
disclaims the "reads near zero" framing as a style note, not a claimed etymology —
consistent with D1 §1's own language. No other fact about the owner or the brand's
founding is asserted anywhere in either file; Section 7 of `about.md` explicitly
confirms no founder bio, press quotes, or team photo are stubbed in (correctly, since
none were requested as placeholders by D1).

## 4. Buildability for the Engineer

Both specs give layout (section order, heading hierarchy, landmarks), responsive
behavior (three explicit breakpoints for `lookbook.md`, single-column with token-based
rhythm for `about.md`), and placeholder-image treatment (`lookbook.md` Section 4: a
full markup/CSS spec for the reusable placeholder-block component, explicit that there
is no real photography and none should be faked, with a stated no-CSS/no-JS fallback).
Motion is fully specified for `lookbook.md` (properties, duration/easing tokens,
stagger, `IntersectionObserver` trigger, two-layer reduced-motion handling: a JS gate
plus tokens.css's duration-collapse backstop) and correctly scoped out for `about.md`
("No motion... required for this page — it's copy-led"). Both docs state explicitly
what they leave to the Engineer's judgment (route/slug format, breakpoint reuse from
E1) rather than leaving it ambiguous. This is enough detail to build without follow-up
questions.

## 5. Ownership check

`git diff --stat main..feat/design-pages` shows exactly three files, all new:
`docs/design/about.md`, `docs/design/lookbook.md`, `docs/prs/feat-design-pages.md`.
All three are within the Creative Director's owned paths (`docs/design/**`, and
`docs/prs/<branch-slug>.md` authored by the branch's own author) per
`docs/architecture/ownership-map.md`. Nothing under `apps/**`, `.claude/**`, or any
other Engineer/Architect path is touched.

## 6. Hard-rule check

- No external network calls, fonts, or assets referenced anywhere in either file —
  both explicitly rely on system font stacks and CSS-only visuals (confirmed by
  reading both files in full, not just the stated claims).
- No fabricated facts about the owner or brand founding (see §3 above).
- Routes (`/lookbook`, `/about`) match ADR 0003's route-shape list.
- Cart/checkout discipline: neither file touches cart-adjacent copy; `about.md`
  Section 7 correctly notes the checkout-honesty rule doesn't apply here rather than
  silently ignoring it.

## 7. Hygiene pass

- `node tools/scan-secrets.mjs --path <extracted branch files>` (the three new files
  extracted via `git show feat/design-pages:<path>`, since the branch was checked out
  in another worktree): `3 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS`.
- `npm install` at repo root: completed clean, `0 vulnerabilities` (`npm audit`
  ran as part of install output). Pre-existing `EBADENGINE` warning for
  `eslint-visitor-keys@5.0.1` under Node v22.12.0 is unrelated to this branch
  (docs-only change, no `package.json` touched) and already present on `main`.
- No build/lint/test/typecheck tooling applies — documentation-only change, as the PR
  file states.
- Broken-link / accessibility spot check: heading hierarchy in both docs is
  unambiguous (`<h1>` once, `<h2>` per named section, `<h3>` per product card name in
  `lookbook.md`); the placeholder-block's decorative grid layer is specified
  `aria-hidden="true"` while product name/category remain real text nodes (no
  `<img>`/missing-`alt` gap); internal links (`/lookbook`, `/about`, catalog route)
  are spec-level route references, not yet live, so nothing to broken-link-check at
  this stage.

## Summary

D4 is well-scoped, technically accurate against D2's real tokens, faithful to D3's
product list, faithful to D1's voice and placeholder discipline, stays inside its
owned paths, and gives the Engineer enough to build `/lookbook` and `/about` without
follow-up questions. No changes requested.

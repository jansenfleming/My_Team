# chore/web-founder-story: real footer copy + founder's-story content on About (D4 follow-up)

Author: engineer. Branch: `chore/web-founder-story`. Base: `main` (f649418, after PR #70,
`docs/review-founder-story`).

## What changed

Ad hoc, post-MVP follow-up flagged by the Architect's review of `feat/design-founder-story`
(`docs/architecture/reviews/feat-design-founder-story.md`, "Follow-up needed" section): the
owner supplied real founder's-story content, the Creative Director wrote it into
`docs/design/about.md` §3-4, and the Architect approved that branch — but the design-doc
change alone doesn't touch `apps/web/**`, so the app was still rendering the old
placeholder copy. This branch implements that approved spec in the app, three small,
scoped changes, no design-doc edits.

### 1. Footer copy — `apps/web/src/layout/Layout.tsx`

Replaced the `[PLACEHOLDER: real footer copy from the Creative Director.]` bracket with the
Creative Director's exact specified line, appended to the existing mock-catalog sentence in
the same `<footer><p>` — no structural change to the footer:

> ZeroJance is a mockup catalog. Nothing on this site processes a real payment or sends a
> real order. Browse like it's localhost — nothing you do here leaves the browser.

### 2. About page content — `apps/web/src/pages/AboutPage.tsx`

Replaced the old single-paragraph, four-placeholder "Where this started" section with the
new three-paragraph version from the current `docs/design/about.md` §4, copied faithfully
(not paraphrased):

- Paragraph 1: the tech+fashion intersection, first-person voice ("ZeroJance started with
  two things I've always been drawn to...").
- Paragraph 2: the "minimalist streetwear with character" philosophy and the no-strict-rules
  / "I'm building the brand I want to wear" closing beat.
- Paragraph 3: the closing "Founded in `[PLACEHOLDER: year]` by
  `[PLACEHOLDER: founder name or detail]`, in `[PLACEHOLDER: location]`." sentence — the
  three placeholders that remain, rendered verbatim, brackets included, exactly as before.

The fourth old placeholder (`[PLACEHOLDER: the specific reason ZeroJance exists — what
problem, whose idea, why apparel]`) is gone, per the new spec — that fact is now real,
owner-supplied content and no longer an open placeholder. Section 3 ("The name") was not
touched. Straight-apostrophe HTML entities (`&apos;`) are used throughout, matching the
existing file's convention elsewhere on the page (`We&apos;re`, `isn&apos;t`, etc.).

### 3. Test fix — `apps/web/src/pages/AboutPage.test.tsx`

- `PLACEHOLDERS` array: dropped the now-gone "reason ZeroJance exists" placeholder; kept
  the three that remain (`year`, `founder name or detail`, `location`).
- The `foundedSentence` assertion (founding-facts-not-invented test): re-scoped to the new
  three-paragraph structure (shorter slice window since the "reason" placeholder no longer
  trails the sentence) and extended to assert all three placeholders individually, not just
  `[PLACEHOLDER: year]`.
- Added a new test, "renders the real founder's-story content in 'Where this started' (not
  just what's still missing)", asserting phrases from the new paragraphs 1 and 2 actually
  render — so the suite also confirms what's now real ships correctly, not only what's still
  missing.
- Updated the paragraph-count test from 6 to 8 `p.about-copy` elements (two-paragraph hero +
  three-paragraph founder's story + one each for "What we make" / "Who this is for"; "The
  name" also keeps its one paragraph — 2 + 3 + 1 + 1 + 1 = 8).

## New dependencies

None.

## How to test

```
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Manual: `npm run dev -w @site/web`, visit `/about` — "Where this started" now reads as
three real paragraphs ending in the three bracketed placeholders; visit any page and check
the footer — the new "Browse like it's localhost" line renders after the existing
mockup-catalog sentence, same footer structure as before.

## Real command output

Run in `.claude/worktrees/agent-afd3233829fec59fb`, Node v22.12.0.

```
$ npm install
npm warn EBADENGINE eslint-visitor-keys@5.0.1 (needs Node ^22.13/^20.19/>=24;
  pre-existing, unrelated — same warning as every prior review)
npm warn deprecated eslint@9.39.5 (pre-existing)
added 307 packages, and audited 309 packages in 2s
found 0 vulnerabilities

$ npm run typecheck
> zerojance-site@0.0.0 typecheck
> npm run typecheck --workspaces --if-present
> @site/web@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json
(clean, no output)

$ npm run lint
> zerojance-site@0.0.0 lint
> eslint .
(clean, no output)

$ npm test
> zerojance-site@0.0.0 test
> npm run test --workspaces --if-present && node --test tools/*.test.mjs
> @site/web@0.0.0 test
> vitest run

 RUN  v5.0.1 .../apps/web
Not implemented: navigation to another Document   (jsdom noise, pre-existing,
                                                     same as prior PRs — not a
                                                     regression)

 Test Files  17 passed (17)
      Tests  158 passed (158)
   Start at  19:01:17
   Duration  2.74s

TAP version 13
# Subtest: clean tree passes (exit 0)
ok 1 - clean tree passes (exit 0)
# Subtest: planted fake secrets are caught (exit 1) and never printed
ok 2 - planted fake secrets are caught (exit 1) and never printed
# Subtest: generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
ok 3 - generic assignment in a test path is a warning, not a failure, unless --fail-on-warn
# Subtest: token-format secrets in test paths still fail
ok 4 - token-format secrets in test paths still fail
# Subtest: inline allow marker and allowlist file (with reason) suppress findings
ok 5 - inline allow marker and allowlist file (with reason) suppress findings
# Subtest: allowlist entry without a reason is rejected (exit 2)
ok 6 - allowlist entry without a reason is rejected (exit 2)
# Subtest: --path scans a directory (for build output)
ok 7 - --path scans a directory (for build output)
# Subtest: --history finds a secret that was committed then deleted
ok 8 - --history finds a secret that was committed then deleted
# Subtest: usage errors exit 2
ok 9 - usage errors exit 2
1..9
# tests 9
# pass 9
# fail 0

$ npm run build
> zerojance-site@0.0.0 build
> npm run build --workspaces --if-present
> @site/web@0.0.0 build
> vite build

vite v7.3.6 building client environment for production...
transforming...
✓ 49 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.59 kB │ gzip:  0.36 kB
dist/assets/index-TqR6siyd.css   24.06 kB │ gzip:  4.30 kB
dist/assets/index-Bejsyuga.js   251.60 kB │ gzip: 78.39 kB
✓ built in 451ms

$ npm run scan-secrets
> zerojance-site@0.0.0 scan-secrets
> node tools/scan-secrets.mjs
scan-secrets [working-tree]: 153 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS
```

17 test files, 158 tests total, all passing (up from 157 on `main` — one new test added,
"renders the real founder's-story content..."). No tests were removed beyond the one
placeholder assertion that no longer applies; nothing found flaky.

`npm install` regenerated an unrelated single-line `peer: true` flag change in
`package-lock.json` (a pre-existing lockfile/npm-version quirk, not caused by this branch's
dependencies — none were added or changed); reverted before committing so this branch's
diff stays scoped to the three files above.

## Cross-cutting constraints confirmed

- **No design-doc changes.** This branch touches only `apps/web/**` — the spec was already
  final and approved on `feat/design-founder-story`/`docs/review-founder-story`.
- **Copy fidelity.** The About page content was copied faithfully from
  `docs/design/about.md` §4 as currently on `main`, no paraphrasing, no improvement, no
  invented facts. The three remaining placeholders render verbatim, brackets included.
- **Footer line matches spec exactly**, same sentence, same footer structure — no
  restructuring.
- **No fabricated facts.** No year, location, or founder name was invented anywhere;
  `[PLACEHOLDER: year]`, `[PLACEHOLDER: founder name or detail]`, and
  `[PLACEHOLDER: location]` remain literal bracketed text.
- **No network calls, no new dependencies, no other files touched.** Only
  `apps/web/src/layout/Layout.tsx`, `apps/web/src/pages/AboutPage.tsx`, and
  `apps/web/src/pages/AboutPage.test.tsx` were changed.

## Status

Not pushed, no PR opened (per instructions — the lead handles that). Ready for Architect
review.

# Review: chore/web-founder-story

Reviewer: Architect. Date: 2026-09-25. Branch under review: `chore/web-founder-story`
(single commit `e875ae2`, not pushed), base `main` at `f649418`. This review's own
commit sits on `docs/review-web-founder-story`, branched from `main` at the same
`f649418` (current tip at review time — confirmed via `git fetch origin main`, no newer
commits).

**Verdict: approved.** No changes required.

---

## 1. Footer copy — character-for-character check

`apps/web/src/layout/Layout.tsx`:

```diff
-          sends a real order. [PLACEHOLDER: real footer copy from the Creative Director.]
+          sends a real order. Browse like it&apos;s localhost — nothing you do here leaves
+          the browser.
```

`&apos;` renders as `'`, so the live text reads: `Browse like it's localhost — nothing
you do here leaves the browser.` — matches
`docs/architecture/reviews/feat-design-founder-story.md`'s specified line exactly,
character for character (including the em dash). Appended to the existing mock-checkout
disclosure sentence inside the same `<footer><p>`; no restructuring of the footer
element. Confirmed.

## 2. About page copy fidelity — highest-stakes check

Diffed `docs/design/about.md` §4 on `main` (source of truth, unchanged by this branch —
confirmed zero `docs/design/**` in the diff) against `apps/web/src/pages/AboutPage.tsx`'s
rendered content, sentence by sentence.

**Paragraph 1** (spec):
> ZeroJance started with two things I've always been drawn to: technology and fashion —
> the way technology creates, solves problems, and expresses ideas, and the way clothing
> communicates a personality without saying a word. This is where those two things meet.
> Not clothing that screams "technology," but the precision, creativity, and futuristic
> feeling of it, translated into something you can actually wear.

Rendered (entities decoded): identical, word for word, including the em dash and the
quoted "technology". Confirmed.

**Paragraph 2** (spec):
> The foundation is minimalist streetwear with character: clean silhouettes, subtle
> details, graphics with something going on, pieces that feel intentional rather than
> over-designed. Sometimes that's a detail nobody notices but you. Sometimes it's loud
> enough to turn heads. There aren't strict rules — I'm not building a brand around what
> I think everyone else should wear. I'm building the brand I want to wear, and if it
> means something to the people who find it too, that's the whole upside.

Rendered: identical, word for word, including the em dash placement around "There
aren't strict rules". Confirmed.

**Paragraph 3** (spec):
> Founded in `[PLACEHOLDER: year]` by `[PLACEHOLDER: founder name or detail]`, in
> `[PLACEHOLDER: location]`.

Rendered: `Founded in [PLACEHOLDER: year] by [PLACEHOLDER: founder name or detail], in
[PLACEHOLDER: location].` — all three placeholders present, verbatim, brackets
included. No paraphrase anywhere in any of the three paragraphs; no fact added, dropped,
or softened.

**Old fourth placeholder** (`[PLACEHOLDER: the specific reason ZeroJance exists — what
problem, whose idea, why apparel]`) — confirmed genuinely gone from the rendered
component, not hidden by CSS or left dead in a comment. `grep -n "reason ZeroJance
exists" apps/web/src/pages/AboutPage.tsx` (extracted branch tree) returns no match.

**Section 3 ("The name")** — confirmed untouched. The diff hunk for `AboutPage.tsx`
starts at the `<h2>Where this started</h2>` heading; nothing above it changed. Read the
full rendered §3 body directly against `about.md` §3 as an extra check (not required by
the diff alone, since an unrelated find/replace could in principle touch unchanged
lines without showing in a diff, but it did not) — byte-identical to spec, including the
nested placeholder bracket for the name-origin.

## 3. Test coverage — read directly, not trusted from the PR description

`apps/web/src/pages/AboutPage.test.tsx`:

- `PLACEHOLDERS` array (lines 9-13) now lists exactly the three remaining placeholders
  (`[PLACEHOLDER: year]`, `[PLACEHOLDER: founder name or detail]`,
  `[PLACEHOLDER: location]`) — the fourth is gone. Confirmed by reading the array
  literal directly.
- New test `"renders the real founder's-story content in 'Where this started' (not just
  what's still missing)"` asserts three real, non-vague quoted substrings pulled
  directly from the new copy: `"ZeroJance started with two things I've always been
  drawn to: technology and fashion"` (paragraph 1), `"minimalist streetwear with
  character"` and `"I'm building the brand I want to wear"` (paragraph 2). These are
  exact substrings of the rendered text, not generic placeholders for "some real text
  exists" — confirmed this actually locks in the tech+fashion and philosophy content
  rather than testing something trivial.
- `"does not invent any founding facts..."` test: re-scoped window (200 → 120 chars from
  `"Founded in"`) still correctly captures the shortened third paragraph and now also
  asserts the other two placeholders individually, not just `[PLACEHOLDER: year]`. Sound
  tightening, not a weakening — the shorter window is appropriate because the sentence
  itself got shorter (the fourth placeholder no longer trails it).
- Paragraph-count assertion (6 → 8): counted `<p className="about-copy">` elements
  directly in the component source myself rather than trusting the PR file's arithmetic:
  hero (2) + "The name" (1) + "Where this started" (3, up from 1) + "What we make" (1) +
  "Who this is for" (1) = **8**. Matches the updated test exactly.

## 4. Ownership check

`git diff --stat main..chore/web-founder-story`:

```
 apps/web/src/layout/Layout.tsx        |   3 +-
 apps/web/src/pages/AboutPage.test.tsx |  29 +++--
 apps/web/src/pages/AboutPage.tsx      |  20 +++-
 docs/prs/chore-web-founder-story.md   | 194 ++++++++++++++++++++++++++++++++++
```

Four files, all within `apps/web/**` or `docs/prs/**`. Zero `docs/design/**` touched —
confirmed this branch implements the already-approved spec without re-editing it.
`package-lock.json` has zero diff against `main` (the PR file's note that an
`npm install`-generated lockfile churn was reverted before committing checks out).

## 5. Real checks — run myself, on an extracted copy of the branch tree

The branch is checked out live in another worktree
(`.claude/worktrees/agent-afd3233829fec59fb`), so I extracted it via `git archive
chore/web-founder-story` into a scratch directory and ran everything fresh there
(Node v22.12.0):

```
$ npm install
added 50 packages, and audited 309 packages in 552ms
found 0 vulnerabilities

$ npm run typecheck
(clean, no output)

$ npm run lint
(clean, no output)

$ npm test
 Test Files  17 passed (17)
      Tests  158 passed (158)
(tools/*.test.mjs: 9/9 passed)

$ npm run build
✓ 49 modules transformed.
✓ built in 449ms

$ npm run scan-secrets
scan-secrets [working-tree]: 157 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm audit
found 0 vulnerabilities
```

158/158 tests across 17 files, exactly as the PR file claims. Ran `npm audit` too for
completeness even though optional (no dependency changes) — clean.

---

## Summary

This is a faithful, scoped implementation of the already-approved `about.md` §3-4 copy
and the specified footer line. Every sentence in the new "Where this started" section
matches the design doc verbatim; the three remaining placeholders render literally,
brackets included; the old fourth placeholder is genuinely gone from the rendered
output, not just visually hidden; "The name" section is untouched; ownership stayed
within `apps/web/**` and `docs/prs/**`; and all real checks (typecheck, lint, test,
build, scan-secrets, audit) pass clean on an independently extracted copy of the branch.

This closes out the loose end flagged in `docs/architecture/mvp-readiness.md` §4 and
partially closes Phase 2 backlog Ranks 1-2 from that same report: the founder's-story
*why* is now real content, faithfully implemented in the live app. The three remaining
facts — founding year, founder name/detail, and location — are still open, but they are
gated on the owner supplying them, not on any outstanding team task.

**Recommendation to the lead: ready to merge.**

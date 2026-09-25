# Review: feat/design-founder-story

Reviewer: Architect. Date: 2026-09-25. Branch under review: `feat/design-founder-story`
(single commit `717943c`, not pushed), base `main` at `6bcfe93`. This review's own
commit sits on `docs/review-founder-story`, branched from `main` at the same `6bcfe93`
(current tip at review time).

**Verdict: approved.** No changes required. See the one follow-up task flagged at the
end for the lead — an Engineer task, not a blocker on this branch.

---

## 1. `about.md` §4 ("Where this started") — content fidelity

Compared the new three-paragraph body copy directly against the owner's verbatim
chat text (reproduced in my task brief) line by line:

- Paragraph 1 (tech+fashion intersection, "where those two worlds meet," "not
  clothing that screams 'technology,'" precision/creativity/futuristic feeling
  translated into wearable form) is a faithful condensation of the owner's first four
  short paragraphs. No fact added.
- Paragraph 2 ("minimalist streetwear with character," clean silhouettes/subtle
  details/interesting graphics/intentional not over-designed, the invisible-detail vs.
  loud-enough-to-turn-heads contrast, "There aren't strict rules") tracks the owner's
  text closely, including keeping "There aren't strict rules" as its own beat rather
  than folding it away. The closing lines — "I'm not building a brand around what I
  think everyone else should wear. I'm building the brand I want to wear" — are a
  near-verbatim callback to the owner's own sentence, correctly used as the section's
  emotional anchor. The final clause ("if it means something to the people who find it
  too, that's the whole upside") is a compressed, accurate rendering of the owner's
  closing line about the brand becoming "something bigger than just my own style" — not
  a new claim.
- Nothing invented: no year, no city, no founder name, no headcount, no anecdote not in
  the source. The one sentence from the owner's text that's dropped entirely
  ("ZeroJance is ultimately an expression of what I like—technology, design,
  streetwear, creativity...") is a legitimate omission under "use pieces of it," not a
  distortion — nothing it contained survives elsewhere in a garbled form.
- All three remaining placeholders — `[PLACEHOLDER: year]`,
  `[PLACEHOLDER: founder name or detail]`, `[PLACEHOLDER: location]` — are present,
  literal, and unfilled, in the closing "Founded in ... by ... in ..." sentence, exactly
  the pattern D4 originally used. Confirmed by reading the rendered blockquote directly,
  not just the PR file's claim.

## 2. `about.md` §3 ("The name") — untouched claim

Diffed directly rather than trusting the PR description:

```
git show main:docs/design/about.md | sed -n '/^## 3\. The name/,/^---/p' > s3_main.txt
git show feat/design-founder-story:docs/design/about.md | sed -n '/^## 3\. The name/,/^---/p' > s3_branch.txt
diff s3_main.txt s3_branch.txt
```

Zero diff output — byte-identical. Confirmed.

## 3. `concept.md` placeholder narrowing

Read §1 ("Premise") and §5 ("Open placeholders") in the branch version against `main`.
Both mentions moved from a single `[PLACEHOLDER: ... who, when, why, where]` to a
narrower `[PLACEHOLDER: ... who, when, where]`, each with a one-line pointer to
`about.md` §4 for the now-real *why*. This is a real narrowing, not cosmetic rewording:
the *why* fact genuinely left the placeholder (it's answered, sourced, and traceable),
while who/when/where remain open and unfilled in both places. No new fact appears in
either paragraph beyond what §4 itself now states.

## 4. Tone judgment — first-person §4 against plural "we" elsewhere

Read the full rendered page top to bottom (not just the diff). Hero and §3 use "we"
("we tend to read it," "we're not interested in hacking the mainframe"); §4 opens
immediately with "ZeroJance started with two things **I've** always been drawn to" and
stays first-person through both prose paragraphs; §5 and §6 return to "we."

**Judgment: this reads as an intentional, reasonably well-executed choice, not a
jarring break.** Reasons:
- The pronoun switch happens at the very first word of the section, not partway
  through, so there's no moment where a reader has to backtrack and re-parse who's
  speaking.
- A "founder's story" section speaking in first person while the rest of an About page
  uses brand-plural "we" is an extremely common, unremarkable convention (most brand
  About pages with a founder's-note section do exactly this) — it doesn't need an
  explicit on-page disclaimer to land correctly, and adding one ("A note from our
  founder:") would actually cut against D1's voice rule against self-conscious
  meta-commentary.
- The placeholder `[PLACEHOLDER: founder name or detail]` sits in the same paragraph as
  the "I" voice, which anchors the pronoun to an identifiable (if not-yet-named)
  person rather than leaving it ambiguous.
- The PR file's own explanatory note is in the design-doc's prose (for
  reviewers/engineers), not printed on the live page — correctly scoped; it doesn't
  need to be, and putting it in visible copy would be exactly the kind of
  joke-explaining-itself the voice guide prohibits.

This is squarely the kind of call D1 gave the Creative Director latitude for. No
changes requested here.

One very minor, non-blocking observation for whoever next touches this file: "the way
technology creates, solves problems, and expresses ideas" quietly drops the owner's
"can be used to" (technology as a tool, not an agent) in favor of tighter phrasing.
Defensible compression, not a factual distortion — not worth a revision cycle on its
own.

## 5. Footer copy

**Ownership check:** `git diff --stat main..feat/design-founder-story` shows exactly
three files touched — `docs/design/about.md`, `docs/design/concept.md`,
`docs/prs/feat-design-founder-story.md`. Zero `apps/web/**` paths. Confirmed the branch
only *specifies* the footer line for a later Engineer task; it doesn't implement it.

**Accuracy check:** re-ran the same grep `mvp-readiness.md` §8 used, against the
branch's own tree (extracted via `git archive feat/design-founder-story`, since the
branch is checked out read-only in another worktree):

```
grep -rEn "fetch\(|XMLHttpRequest|axios|WebSocket|EventSource|https?://" apps/web/src \
  --include="*.ts" --include="*.tsx" | grep -viE "\.test\.|__tests__|//"
```

Zero hits — matches my own A3 finding, still true today (this branch doesn't touch
`apps/web/**`, so nothing could have changed it). The proposed line — "Browse like
it's localhost — nothing you do here leaves the browser." — is a real, checkable claim,
not just an in-voice-sounding one.

**Voice check:** fits D1 cleanly. `localhost` is one of D1's own named preferred
dev-culture references (`concept.md` §3, point 3), the line is terse and deadpan with
no hype language, and it doesn't touch the cart/checkout hard rule (it's not
cart-adjacent copy, and it doesn't imply any transaction). Approved as written.

## 6. Ownership check

Confirmed above (§5): only `docs/design/**` and `docs/prs/**` touched. No overlap with
any other agent's owned files.

## 7. Hygiene pass

Branch content extracted via `git archive feat/design-founder-story` into a scratch
directory (the branch is checked out live in another worktree, so it couldn't be
switched to directly in this one) and both commands run against that exact tree:

```
$ npm install
npm warn EBADENGINE eslint-visitor-keys@5.0.1 (needs Node ^22.13/^20.19/>=24;
  pre-existing, unrelated — same warning as every prior review)
npm warn deprecated eslint@9.39.5 (pre-existing)
added 307 packages, and audited 309 packages in 2s
found 0 vulnerabilities

$ npm run scan-secrets
scan-secrets [working-tree]: 152 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS
```

(152 files vs. `mvp-readiness.md`'s 148 — expected, this branch adds the new PR file
plus the growth in `about.md`/`concept.md`; no unexpected file count.) Both clean.
Documentation-only change; no lint/typecheck/test/build tooling applies (nothing in
`apps/**` or `packages/**` changed), consistent with the PR file's own "Checks run"
section.

---

## Follow-up needed (not a blocker on this branch — flagging for the lead)

This is not a board task with an ID — ad hoc, post-MVP — but once this branch merges it
unblocks a real Engineer task with two parts:

1. **Implement the footer line.** Replace the
   `[PLACEHOLDER: real footer copy from the Creative Director.]` bracket in
   `apps/web/src/layout/Layout.tsx`'s `<footer>` with the exact sentence specified in
   the PR file: `Browse like it's localhost — nothing you do here leaves the browser.`
   (Optional inline-code styling for `localhost` per the PR file's note — Engineer's
   call.)
2. **Update `about.md`'s content in `AboutPage.tsx` and its test.** Paste the new §4
   copy into `apps/web/src/pages/AboutPage.tsx` (currently still rendering the old
   four-placeholder single paragraph). `apps/web/src/pages/AboutPage.test.tsx`'s
   `PLACEHOLDERS` array (lines 9-14) currently asserts all **four** old placeholders
   verbatim, including
   `"[PLACEHOLDER: the specific reason ZeroJance exists — what problem, whose idea, why apparel]"`
   — that one is gone in the new copy and the test will need to drop it, while keeping
   assertions for the three that remain (`year`, `founder name or detail`, `location`).
   The test also has a `foundedSentence` assertion (line ~59) built around the old
   single-paragraph structure that will need to be re-checked against the new
   three-paragraph layout.

Recommend scoping this as one Engineer task touching only `apps/web/src/layout/
Layout.tsx`, `apps/web/src/pages/AboutPage.tsx`, and `apps/web/src/pages/
AboutPage.test.tsx` — no design-doc changes needed, the spec is already final on this
branch.

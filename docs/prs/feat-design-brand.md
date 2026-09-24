# feat/design-brand: ZeroJance brand concept and voice (D1)

Author: creative-director. Branch: `feat/design-brand`. Base: `main` (f44f356, after PR
#29, `chore/agent-roster-reconcile`).

## What changed

This is D1 from `docs/architecture/board.md` — the first Creative Director task, and the
foundation D2-D5 (tokens, product copy, lookbook/about, easter-egg specs) build on. It
adds one new file:

- `docs/design/concept.md` — the ZeroJance brand identity:
  - **Premise**: ZeroJance is workwear built around the specific, unglamorous folklore
    of programming/networking work (stack traces, `git blame`, cron jobs, `ping`
    failures, staging vs. prod) rather than sci-fi/hacker-movie cyberpunk imagery. The
    explicit contrast is "workplace humor, not futurism" — a deliberate break from both
    generic streetwear templates and from the repo's own prior project (the
    cybersecurity-terminal site), per ADR 0003.
  - **Voice guide**: tone description (deadpan, technically accurate, terse, peer-to-
    peer, never explains its own joke) plus a 7-row do/don't table with concrete sample
    lines, and a hard rule on cart/checkout-flavored copy (must read as real UI, must
    never claim a real payment or order was sent — this rule is binding on all later
    docs, not just D1).
  - **Three anti-generic rules**: (1) every technical reference must be factually
    correct — no invented status codes or commands for the sake of a pun; (2) the joke
    lives in an object's *structure* (config-file-style care labels, CLI-styled size
    charts) not just a printed slogan; (3) curated, specific tech references, explicitly
    avoiding the most-memed ones (Matrix rain, "someone else's computer," hoodie-hacker
    silhouettes).
  - **Easter-egg selection**: all six ideas from the brief evaluated in a table. Picked
    for D5: dev-console/view-source message, a joke 404 page, and a hidden 13th product
    via Konami code — three different discovery surfaces (browser tooling, a mandatory
    error page, a deliberate hidden interaction), each with a one-line reason. Deferred:
    the `git log`-styled changelog page (flagged as a strong v2 candidate, not rejected;
    it reads as a nav-reachable content page rather than a "secret") and the programming-
    pun discount code (deferred specifically because a *working* discount code adds
    interactive-checkout surface area right where mock-commerce honesty matters most;
    the pun itself survives as static tag copy instead). The config-file-styled product
    copy idea is reclassified as a standing D3 copy rule rather than one of the curated
    eggs, since it's not something a visitor discovers — it's on every product page.
  - **Placeholders**: two explicit `[PLACEHOLDER: ...]` markers — the real meaning/origin
    of the name "ZeroJance," and the brand's founding story. No other fact about the
    owner or the brand's history appears anywhere in the document.

## Why

D2 (tokens/style guide), D3 (product copy), D4 (lookbook/about), and D5 (easter-egg
specs) all depend on D1 per the board's dependency graph. Each of those needs a settled
premise and voice to work from rather than inventing tone ad hoc per document — in
particular D3's product descriptions need the "technically correct, structural joke"
rules from Section 3 to stay consistent, and D5 needs the curated egg list from Section 4
to know which three to spec in detail.

## How to review

1. Read `docs/design/concept.md` in full — it's short (about 150 lines).
2. Check Section 1 (premise) against `docs/project-brief.md` and ADR 0003: confirm
   nothing here reuses the old terminal project's cyberpunk framing, and that the
   "ZeroJance" name gloss is clearly marked as a design frame, not a claimed fact, with
   the founding-story and name-origin placeholders present and not filled in.
3. Check Section 2's do/don't table for the "no real transaction" cart/checkout rule —
   this is the rule D3/D4/D5 and eventually the Engineer's E4 all need to hold to.
   Confirm none of the "Do" examples slip into implying a real order.
4. Check Section 4's easter-egg table covers all six ideas from the brief (project-
   brief.md's list and the kickoff doc's list match) and that the reasoning for each
   deferral is a real tradeoff, not just "didn't get to it."
5. Confirm the file only touches `docs/design/**` (Creative Director's owned path) and
   doesn't touch `apps/**` or other Architect-owned paths.

## Checks run

This is a documentation-only change (one new Markdown file under `docs/design/`, no
code). No build/lint/test/typecheck tooling applies — there is nothing under
`apps/web/**` or `tools/**` touched by this branch. Verified via `git status` /
`git diff --stat` that the only change in the branch is the addition of
`docs/design/concept.md`.

## Status

Ready for Architect review. Not pushed, no PR opened — per the approval boundaries,
the lead handles the remote side after Architect review. D2-D5 are queued as separate
sessions/branches once this merges.

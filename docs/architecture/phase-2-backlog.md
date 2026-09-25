# ZeroJance Phase 2 Backlog (candidates, not a commitment)

Owner: Architect. Companion to `docs/architecture/mvp-readiness.md` (A3). This is a
**proposal**, matching the roadmap's Phase 2 placeholder
(`docs/architecture/roadmap.md`) — nothing here is started, scheduled, or approved.
The owner picks what (if anything) happens next; the lead relays that decision, same as
every other approval boundary in this project.

Shape borrowed loosely from the old project's `docs/design/backlog.md` (ranked, each
with what/why/cost — that file no longer exists on disk per ADR 0003's cleanup, but its
structure was a reasonable reference; content below is entirely new, built from what
this project actually deferred). Ranking is by (value toward the "own identity, not a
generic streetwear template" goal, and MVP dogfooding feedback) versus (cost/risk),
highest first.

---

## Rank 1: Real footer copy (close the loose end from `mvp-readiness.md` §4)
**What:** replace `apps/web/src/layout/Layout.tsx`'s literal
`[PLACEHOLDER: real footer copy from the Creative Director.]` with a real, in-voice
one-line footer sentence — still honest about the mock-checkout discipline, per D1's
hard rule.
**Why rank 1:** the only actual loose end this review found; smallest possible
Creative Director task (one sentence, no new spec needed, D1's voice guide already
covers everything needed to write it), and it's a visible placeholder bracket on every
page today.
**Effort:** under an hour, Creative Director only, no Engineer work beyond dropping the
new sentence into the existing JSX.
**Risk:** none.

## Rank 2: Owner-supplied brand facts (unblock the remaining `[PLACEHOLDER: ...]` markers)
**What:** once the owner supplies real answers, replace the two underlying facts (name
origin/meaning, founding story: year/founder/location/reason) across
`docs/design/concept.md`, `docs/design/about.md`, and `apps/web/src/pages/AboutPage.tsx`.
**Why rank 2:** every other placeholder in the live site traces back to these two facts
(see the inventory table in `mvp-readiness.md` §6); nothing else is blocking a fully
"real" about page.
**Effort:** small once the owner supplies the content — a Creative Director copy pass
(update the two design docs) plus an Engineer pass (paste the new copy into
`AboutPage.tsx`, update `AboutPage.test.tsx`'s placeholder-preservation assertions to
match, since those tests currently assert the bracketed text is preserved verbatim and
will need to flip to asserting the real content instead).
**Risk:** none technically. Entirely gated on the owner's own input, not on any team
decision.

## Rank 3: Hosting decision + deploy ADR
**What:** a fresh ADR (ADR 0004) deciding real hosting for ZeroJance, now that the build
is stable and close to shippable — exactly the trigger ADR 0003 named ("a fresh ADR once
the build is close to shippable, not assumed now"). GitHub Pages is the likely fit
(static-only, free, matches "no real backend," and mirrors the old project's ADR 0002
reasoning), but this ADR should confirm that against current constraints (e.g. whether
the client-side router's history-API paths need a Pages-specific 404-redirect trick,
since Pages can't rewrite arbitrary paths server-side — `ADR 0003` already flagged this
as a known routing/hosting interaction to check).
**Why rank 3:** the one deliberately-undecided architectural question left over from
this project (ADR 0003's own words), and it's the prerequisite for Phase 3 ("ship it")
in the roadmap. Nothing here commits to deploying — writing the ADR and the workflow
file is prep; the owner still approves the actual deploy per the brief's approval
boundaries.
**Effort:** small-medium — an ADR, a GitHub Actions workflow file (or equivalent), and a
verification pass that client-side routes survive a hard refresh/direct URL hit under
the chosen host.
**Risk:** low. Static hosting for a no-backend mockup is a well-trodden path; the main
risk is an under-specified routing fallback, which the ADR should address directly.

## Rank 4: `git log`-styled changelog page
**What:** a real, nav-reachable page (not a curated "egg") styled like `git log`
output — commit-style entries narrating the site's own build history in ZeroJance's
voice. D1 explicitly deferred this (`docs/design/concept.md` §4) because it reads as
ordinary content, not a secret, and flagged it as "a strong v2 candidate, not a rejected
one." `docs/design/lookbook.md` independently confirms the lookbook's own "workday
moment" framing was deliberately kept distinct from this idea, so building the
changelog later doesn't step on already-shipped content.
**Why rank 4:** highest remaining "own identity" value from the original egg-idea list —
distinctive, on-brand, and reuses assets already proven out (D2's mono type tokens, the
`git blame` product's precedent for technically-correct git-command styling).
**Effort:** medium — a new route, a new page component, and real content (either a
narrated version of this project's actual git history, in-voice, or a fictionalized
"product drop log" in the same format — Creative Director's call to scope, flagged to
the Architect for a routing decision either way).
**Risk:** low-medium. Needs a real technical-accuracy pass if it uses actual `git log`
formatting (same discipline D1 Rule 1 already established for D3/D5) — mainly a content
task, not an engineering risk.

## Rank 5: Discount-code pun, as a real (still-mocked) interactive element
**What:** a discount-code input on the checkout screen that accepts a specific
programming-pun code and visibly applies a mock discount to the displayed total — the
idea D1 deferred specifically because "a working discount code implies functioning
checkout logic ... right where mock-commerce honesty is already load-bearing." Phase 2
could revisit this now that the checkout screen (E4/E7) already has an established,
well-tested honesty pattern (an explicit disclosure line, a comment at the point a real
integration would go) to extend rather than invent from scratch.
**Why rank 5:** genuine "delight" value and a widely-recognized ecommerce UI pattern to
mock convincingly, but it's the riskiest idea on this list for exactly the reason D1
named — it's easy for a "working" discount field to read as more functional than it is
if the mock boundary isn't drawn as carefully as E4's checkout screen already was.
**Effort:** medium — a new input, mock validation against one or two hardcoded punny
codes, a recomputed (still fake) total, and copy that keeps the same "nothing was
charged" honesty the checkout screen already establishes.
**Risk:** medium. The only idea on this list with a real mock-commerce-discipline risk;
should get a dedicated Architect read specifically for checkout-honesty language before
it ships, same scrutiny E4 got.

## Rank 6: More product variety / a lightweight category filter
**What:** if the owner wants more than the current 12 products, or a simple category tab
(shirts/sweatshirts/hats) on the catalog grid — explicitly named as a roadmap Phase 2
candidate already ("More product variety or a richer filter/category experience, if the
owner wants more than 6-12 products").
**Why rank 6:** real value if the owner wants to grow the catalog, but the MVP's 12
products were deliberately scoped to the brief's 6-12 range — this only matters if the
owner asks for more.
**Effort:** low for a simple category-tab filter (client-side only, no new data shape);
medium for materially more products (more Creative Director copy work, technical-
accuracy-checked per product, same discipline as D3).
**Risk:** low. Entirely additive; doesn't touch any shipped behavior.

## Rank 7: Real browser E2E (Playwright)
**What:** the roadmap already flags this ("Playwright/browser E2E (can be a Phase 2
addition)"); E7's PR notes Playwright was installed only to a scratch location for local
verification during that task, never added as a project dependency. A real E2E suite
would give actual cross-browser confidence beyond the current jsdom/Vitest component
tests (157/157 passing, but jsdom-based).
**Why rank 7:** solid engineering hygiene value (catches real-browser routing/focus/CSS
issues the current suite can't), but the current component-test coverage is already
strong and every visual/behavioral claim in every review was independently spot-checked
by the Architect — this is risk-reduction on top of an already-solid base, not a gap.
**Effort:** medium — new dependency, new CI consideration (ties into Rank 3's hosting/
workflow decision if E2E should run in the same pipeline), a small initial suite
covering the core flows (browse → product → add to cart → checkout, the Konami unlock,
the 404 page).
**Risk:** low technically; mainly a "worth the ongoing maintenance cost" judgment call
for a static mockup site with no backend.

## Rank 8: Small non-blocking cleanups (batch these whenever a nearby file is next touched)
Not worth their own branch/review cycle individually — fold into whatever task next
touches the relevant file:
- `docs/design/easter-eggs.md`'s `--zjc-ok` token attributed to the wrong source file
  (`style-guide.md` vs. its actual home, `tokens.css`) — token and meaning are correct,
  only the citation is off by one document.
- `docs/design/lookbook.md` §3's "same body-copy styling as the hero subhead" wording,
  which is mildly misleading given its own explicit, different token value
  (`--zjc-text-base` vs. the hero's `--zjc-text-md`) — a wording fix, not a visual change.
- A numeric-assertion test for `CartDrawer.tsx`'s checkout-step shipping/tax/total
  dollar amounts (currently only label presence is tested; the Architect hand-verified
  the arithmetic is correct during E4's review).
- A container-width token (`--zjc-container` or similar) to replace the one raw
  `.page { max-width: 72rem }` value flagged during E2's review, if the Creative
  Director wants full token coverage.

---

## Explicitly not backlogged (reconsider only if the owner asks)
- **Real payments/checkout, real accounts/auth, a real backend or database.** Out of
  scope for this entire project per the brief, not a "not yet" — would need its own ADR,
  its own scoped QA role (per the brief's stated trigger for reintroducing QA), and
  explicit owner approval before any design work starts.
- **A real newsletter signup that actually sends anything.** Same reasoning — the
  brief's own named example of a feature that would need a QA role brought back in
  before it ships.
- **Search, richer filtering/sorting beyond a simple category tab, wishlist/favorites,
  reviews, internationalization, a CMS, analytics.** All explicitly out of MVP scope per
  `docs/architecture/roadmap.md`; nothing found during this review changes that
  calculus — revisit only on direct owner request.

## Not covered here
The MVP itself and its verification: `docs/architecture/mvp-readiness.md`. Individual
task history and detailed findings: `docs/architecture/reviews/*.md`.

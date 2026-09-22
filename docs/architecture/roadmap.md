# Roadmap

Owner: Architect. Principle from the owner: start simple, then keep improving. Each
phase must leave `main` working.

Rewritten 2026-09-22 for ZeroJance (streetwear catalog mockup), superseding the
cybersecurity-terminal roadmap. See `docs/architecture/adr/0003-streetwear-pivot.md` for
the stack decision and what was kept/dropped from the old project.

## MVP (Phase 1): "a believable catalog"

A visitor lands on a product grid, opens a product detail page, browses a lookbook
page, reads an about/brand page, adds items to a cart that behaves like a real one, and
— if they poke around — finds a couple of secret layers. No login, no real payment, no
server.

### In
1. **Web shell and routing** (Engineer): app shell, client-side routing for home/
   catalog/product-detail/lookbook/about/404, mobile-first responsive layout skeleton.
   Placeholder copy until the Creative Director's specs land.
2. **Brand identity and voice** (Creative Director): the ZeroJance visual identity —
   name/premise recap, voice guide, design tokens (colors, type, spacing, motion), a
   short style guide. Streetwear + tech/programming aesthetic; explicitly not a repeat
   of the old cyberpunk terminal palette.
3. **Product data and catalog grid** (Engineer + Creative Director): 6-12 products
   across shirts/sweatshirts/hats only, each with name, price, 1-2 images (or styled
   placeholders), a short tech-culture-flavored description/tags. Creative Director
   supplies the concepts and copy; Engineer builds the typed data module and the grid.
4. **Product detail pages** (Engineer): per-product page, size/variant picker (mock),
   "Add to Cart" that visibly works.
5. **Lookbook/editorial page** (Creative Director spec + Engineer build): a small
   editorial/lookbook layout distinct from the grid.
6. **About/brand page** (Creative Director copy + Engineer build): brand story with
   `[PLACEHOLDER: ...]` for anything about the owner or the brand's founding that isn't
   supplied.
7. **Mock cart** (Engineer): cart drawer or page, quantity edit, remove, a subtotal, and
   a "checkout" screen that clearly does not process a real payment. Honest in code
   (comment at the point a real implementation would integrate a payment provider) and
   in copy (no "order confirmed" language).
8. **Secret/easter-egg layers, curated** (Creative Director spec + Engineer build): pick
   2-3 from the owner's list (e.g. a hidden 13th product, a dev-console/view-source
   message, a `git log`-styled changelog page, a joke 404, a discount code that's a
   programming pun, config-file-styled product tags/care labels) — not all of them.
   Creative Director records which were picked and why the rest were left out.
9. **Basic hygiene** (Architect, ongoing): `tools/scan-secrets.mjs` clean, `npm audit`
   reviewed, no broken internal links, a quick accessibility pass (landmarks, alt text,
   contrast, keyboard reachability, `prefers-reduced-motion` respected) on each merged
   page.
10. **Tests** (Engineer): component/unit tests for the catalog grid, product detail,
    cart logic, and each easter egg's trigger condition.

### Explicitly out of MVP
Real payments/checkout, real accounts or auth, a real backend or database, a newsletter
signup that actually sends anything, search, filtering/sorting beyond maybe a simple
category tab, wishlist/favorites, reviews, internationalization, a CMS, analytics,
Playwright/browser E2E (can be a Phase 2 addition), accessories (per the brief: shirts/
sweatshirts/hats only for v1), more than the curated easter-egg set.

### MVP exit criteria
- Fresh clone: `npm install`, then `npm run dev` gives a working site; `npm test`
  passes; `npm run lint` and `npm run typecheck` pass; `npm run build` produces a static
  `apps/web/dist`.
- Every Phase 1 board task is Done per the brief's definition of done (owner tests pass
  with real output, Architect reviews and merges).
- `npm run scan-secrets` is clean; `npm audit --audit-level=high` has no open
  high/critical findings the Architect hasn't triaged.
- The curated easter eggs all work and are documented in `docs/design/easter-eggs.md`.
- No fabricated facts about the owner or the brand's founding story remain — every such
  spot is `[PLACEHOLDER: ...]` until the owner supplies real content.

## Phase 2: "make it feel alive" (starts after MVP merge; board written then)
- More product variety or a richer filter/category experience, if the owner wants more
  than 6-12 products.
- Additional easter eggs from the Creative Director's backlog (deferred ones get a
  reasons-left-out note in Phase 1; Phase 2 can revisit).
- A real hosting decision and its own ADR (GitHub Pages is the likely fit, matching ADR
  0002's reasoning for the old project — static, free, no backend to expose — but this
  needs a fresh ADR once the build is close to shippable, not assumed now).
- If the owner wants a real newsletter signup or any other feature that touches a real
  external service or collects real user input: a small, scoped backend/integration
  decision (its own ADR) **and** a QA role brought in for that specific piece, per the
  brief.
- Polish pass: performance (image weight, bundle size), deeper accessibility review,
  cross-device QA by the Architect.

## Phase 3: "ship it" (only with the owner's approval)
- Deploy runbook (owner- and lead-executed): set hosting source, run the deploy
  workflow once, verify the live URL. Agents prepare, the owner approves, the lead
  clicks — same discipline as the old project's ADR 0002.
- Real content replacing any remaining `[PLACEHOLDER: ...]` values.

## Phase 4: continuous improvement
Owner-directed backlog. Candidates: real product photography, a real newsletter
integration (with its own review), more easter eggs, seasonal drops as a content
pattern.

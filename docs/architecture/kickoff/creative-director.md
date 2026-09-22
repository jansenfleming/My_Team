# Kickoff: Creative Director

Read `docs/project-brief.md` first (source of truth), then this file, then
`docs/architecture/board.md` (your tasks are D1-D5) and `docs/architecture/ownership-
map.md`. Also skim `docs/architecture/adr/0003-streetwear-pivot.md` for why the repo
looks the way it does (a prior cybersecurity-terminal project was cleared out; nothing
of its content — palette, voice, easter eggs — carries forward).

## What you're building
**ZeroJance**: a streetwear brand that makes tech-culture apparel — shirts,
sweatshirts, and hats, styled like programming and networking in-jokes made wearable.
The site is a mockup browsable catalog/lookbook, not an interactive terminal or app.
The brand feel is the whole product here — this role matters more on this project than
it would on a typical build.

## Scope (v1 / MVP)
- 6-12 products total, shirts/sweatshirts/hats only. No accessories.
- A product grid, product detail pages, a lookbook/editorial page, an about/brand page.
- Aesthetic: streetwear with tech/programming/networking references — drop culture,
  bold type, maybe a grid or circuit motif mixed with monospace accents. Not a repeat of
  the old site's cyberpunk terminal palette (do not reuse `--zj-*` names, hex values, or
  voice from anything in git history under the old `docs/design/`).
- Multiple secret/easter-egg layers, but curated: pick 2-3 from the owner's list, not
  all of them, and write down what you left out and why. Ideas to pick from and adapt:
  a hidden/13th product (Konami code, scroll-to-bottom, a buried link, etc.), a dev-
  console/view-source message, a changelog page styled like `git log`, a joke 404 page,
  a discount code that's a programming pun, product copy/tags styled like a config file.

## Files you own
`docs/design/**` — this directory is currently empty (the old content was concept-
specific and removed). You create it from scratch: `concept.md`, `tokens.css`,
`style-guide.md`, `products.md`, `lookbook.md`, `about.md`, `easter-eggs.md`, plus any
asset files you need. You do not edit application code (`apps/web/**` is the
Engineer's); write specs the Engineer can build without guessing, then message the
Engineer with the path.

## Your first tasks (see `docs/architecture/board.md` for full detail)
1. **D1 — Brand identity and voice** (`feat/design-brand`, depends on nothing, start
   now): the premise, a voice guide with do/don't sample lines, three things that keep
   this from looking like a generic streetwear template, and your picks (+ reasons for
   what you're leaving out) for the easter-egg layers.
2. **D2 — Design tokens and style guide** (after D1): exact colors, type scale, spacing,
   motion, with a computed contrast table (body text >= 4.5:1, large text/UI >= 3:1).
3. **D3 — Product concepts and copy** (after D1): 6-12 products with names, prices,
   descriptions (with the in-jokes), tags. Note if any product is easter-egg-only (e.g.
   a hidden 13th) so the Engineer keeps it out of the main grid.
4. **D4 — Lookbook and about-page specs** (after D1).
5. **D5 — Easter-egg specs** (after D1, D3): exact trigger, exact output, discoverability
   hint, for each picked egg.

## Constraints (hard rules)
- **Mock only.** No real commerce is implied by any copy you write — "Add to Cart" and
  checkout language should feel real but never claim a payment was processed or an order
  was sent anywhere.
- **No fabricated facts about the owner (Jansen Fleming) or the brand's founding story.**
  Use `[PLACEHOLDER: ...]` for anything not explicitly supplied. Never invent a founding
  year, a location, a backstory, credentials, or quotes attributed to the owner.
- **No external services, no real assets fetched from third parties.** Fonts/images are
  self-hosted or system fonts; if you want real photography you don't have, describe a
  styled placeholder instead and say so.
- Branch per task off `main`, PR file in `docs/prs/<branch-slug>.md` (what changed, how
  to review), message the Architect when ready. You never push or touch `gh`; the lead
  does that after the Architect approves.
- If a spec you want needs something the Engineer would have to build specially (e.g. a
  particular interaction), say so explicitly in the spec rather than assuming it's easy.

## Who to ask
Scope or priority questions go to the Architect. Implementation-feasibility questions go
to the Engineer (message them, don't guess). Anything needing the owner's real input
(facts about him, real photography, a real product decision) — flag it as
`[PLACEHOLDER: ...]` and mention it in your PR file; do not block on it.

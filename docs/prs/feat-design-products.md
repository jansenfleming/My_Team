# feat/design-products: ZeroJance product concepts and copy (D3)

Author: creative-director. Branch: `feat/design-products`. Base: `main` (acd3482, after
PR #32, `docs/board-d1-done`).

## What changed

This is D3 from `docs/architecture/board.md` — 6-12 product concepts and copy, depending
on D1 (`docs/design/concept.md`, done and merged). It adds one new file:

- `docs/design/products.md` — 12 catalog products (shirts/sweatshirts/hats, no
  accessories) plus one additional hidden 13th product, structured as:
  - **Section 0** states the count explicitly up front, per the lead's instruction: 12
    products in the main catalog (within the brief's 6-12 range) **+ 1 hidden 13th
    product in addition to those 12**, not counted toward the 6-12 and explicitly
    excluded from the catalog grid/sitemap/any "all products" loop. Category split: 5
    shirts, 4 sweatshirts, 3 hats in the visible catalog; the hidden product is a 6th
    shirt.
  - **Section 1 (curation notes)** explains which of D1's curated tech references made
    the cut (cron, `git blame`, the TCP three-way handshake, off-by-one errors,
    `localhost`, 403-vs-404, `sudo`, staging-vs-prod, rubber-duck debugging, technical
    debt, exit codes, HTTP status codes) and names what was deliberately left out and
    why: yak-shaving/whiteboard-interview/`ping` (didn't pair as cleanly with a garment
    in this batch — flagged as v2 candidates), the specific `sudo make me a sandwich`
    xkcd bit (too memed even though `sudo` itself is used), and any named
    language/framework/version (would date the catalog). Also explains the
    structural-copy split: 8 of 13 products get a structural joke (care label/hangtag
    styled as a real technical artifact), 5 are intentionally plain, to avoid the "every
    product has the same gimmick" trap.
  - **Section 2** — the 12 main-catalog products, each with name, category, mock USD
    price, a deadpan description built on a technically-correct in-joke, 1-3 tags, and
    (for 7 of the 12) exact special copy: a care label or hangtag styled as a real
    format — a config file, a `crontab -l` listing, an INI-style two-environment config,
    a Common Log Format access-log excerpt, `git blame` porcelain output, and a TCP
    handshake trace. Every format is real and used correctly (see "Checks run" below).
  - **Section 3** — the hidden 13th product, "200 OK Tee," called out with a bolded
    constraint that the Engineer must not wire it into the grid, listing data, sitemap,
    or any normally-reachable route; it exists only as a target for D5's Konami-code
    trigger spec. Its description line deliberately reuses D1's own HTTP-200 do/don't
    example verbatim, so the payoff for finding the egg is presented as the concrete
    fulfillment of a voice example the brand already committed to, not a new line
    invented just for the egg.
  - **Section 4** — a summary table (name, category, price, tags, structural-copy note)
    for quick scanning.
  - **Section 5** — notes for the Engineer: build the typed data module from Section 2
    only, keep the hidden product as a separate excluded record, render special-copy
    blocks close to verbatim (they're real formats, not paraphrase targets), and reuse
    the fixed tag vocabulary rather than inventing new tags.

## Why

D3 needs a real, curated product list before D5 (easter-egg specs) can be written — D5
depends on D3 specifically because the hidden-13th egg needs a real product to reveal,
which is why "200 OK Tee" is defined here even though its trigger mechanics are D5's job.
E2 (catalog grid) and E3 (product detail + cart) are also blocked on this for real data.

Every description follows D1's voice guide directly: deadpan, terse, no exclamation
points, no explaining the joke, and every technical reference (exit codes, `git blame`'s
output format, HTTP 403 vs. 404 semantics, `crontab` syntax, the TCP three-way handshake,
Common Log Format) is a real, checkable fact — none are approximated or invented for the
sake of a pun, per D1 Rule 1. The structural-copy rule (D1 Rule 2, formally reclassified
from an "egg" to a standing D3 rule) is satisfied with 7 different products getting a
non-slogan structural joke, using 5 different real formats so it doesn't read as one
gimmick repeated 7 times.

## How to review

1. Read `docs/design/products.md` in full (about 280 lines).
2. Confirm the count: 12 main-catalog products (6-12 range, satisfied), 1 additional
   hidden product explicitly not counted toward that range and explicitly excluded from
   the grid — Section 0 states this plainly, cross-check against Section 4's totals row.
3. Confirm every product is a shirt, sweatshirt, or hat — no accessories (check the
   Category column in Section 4).
4. Spot-check the technical claims for accuracy (this is the rule a technical reviewer
   would actually wince at if wrong): `git blame`'s porcelain output format (hash,
   author, date, time, UTC offset, line number), Common Log Format's field order and its
   `-` convention for unavailable fields, `crontab`'s 5-field syntax
   (minute/hour/day-of-month/month/day-of-week), the TCP three-way handshake sequence
   (SYN, SYN/ACK, ACK), the 403-vs-404 semantic distinction, and exit code 0 meaning
   success. None of these should be approximated or wrong.
5. Confirm no copy claims a real transaction (no product description implies cart/
   checkout behavior — that's out of scope for this doc, but check nothing slipped in).
6. Confirm no fabricated facts about the owner or brand history appear anywhere (none
   were needed for this doc — product copy doesn't touch the founding story).
7. Confirm the hidden product's constraint language (Section 3) is unambiguous enough
   that the Engineer won't accidentally include it in E2's grid data.
8. Confirm the file only touches `docs/design/**` (Creative Director's owned path).

## Checks run

Documentation-only change (one new Markdown file under `docs/design/`, no code). No
build/lint/test/typecheck tooling applies. Verified via `git status` / `git diff --stat`
that the only change in the branch is the addition of `docs/design/products.md`.
Technical facts (git blame format, CLF, crontab syntax, TCP handshake sequence, HTTP
403/404/200 semantics, Unix exit code 0) were checked against known-correct real-world
usage before writing; none are invented or approximated, per D1's Rule 1 — this is a
manual accuracy check, not an automated one, since there's no tooling in this repo that
verifies prose against protocol specs.

## Status

Ready for Architect review. Not pushed, no PR opened — the lead handles the remote side
after Architect review. D5 (easter-egg specs) can start once this merges, since it
depends on D3 for the hidden 13th product's identity.

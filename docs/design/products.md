# ZeroJance — Product Concepts and Copy (D3)

Owner: creative-director. Branch: `feat/design-products`. Depends on: D1
(`docs/design/concept.md`). Read D1 first — every line of copy below follows its voice
guide (deadpan, technically accurate, terse, in on the joke, peer-to-peer) and its three
anti-generic rules (real technical facts only; the joke lives in the object's structure,
not just a slogan; curated and specific, not the most-memed references).

---

## 0. Count and structure — read this first

**12 products in the main catalog** (within the brief's 6–12 range) **+ 1 hidden 13th
product, in addition to those 12, reachable only through the Konami-code easter egg**
picked in D1 Section 4.

- The 12 main-catalog products are what the Engineer builds the typed product-data
  module from for the grid, detail pages, and cart (E2/E3).
- The 13th product (Section 3 below) is **not** part of the 6–12 count, **must not**
  appear in the catalog grid, product-listing data, sitemap, or any "all products" loop,
  and must not be reachable by direct navigation from ordinary browsing. It exists only
  as a target the Konami-code trigger can reveal. Its exact trigger mechanics
  (keys, where the listener lives, what "reveal" means in the UI) are D5's job, once this
  doc exists — this doc only defines the product itself and restates the constraint so
  E2 doesn't accidentally wire it into the grid.

Category split across the 12: **5 shirts, 4 sweatshirts, 3 hats**. The hidden 13th
product is also a shirt, making **6 shirts total across the whole site (5 visible + 1
hidden)**. No accessories anywhere.

---

## 1. Curation notes

Every in-joke below is pulled from D1 Section 3's curated reference list (cron,
`git blame`, TCP's three-way handshake, off-by-one errors, `localhost`, the
403-vs-404 distinction, `sudo`, staging-vs-prod, rubber-duck debugging, technical debt,
exit codes, HTTP status codes) — the unglamorous, specific end of tech culture, not the
movie-poster end.

**Deliberately left out of this batch, and why:**
- **Yak-shaving, the whiteboard interview, `ping`/packet loss.** Real, on-list
  references that didn't make the cut only because 12 slots is a hard limit and these
  didn't pair as cleanly with a garment category as the picks below. Flagged as strong
  candidates if the catalog ever grows past MVP.
- **The `sudo make me a sandwich` xkcd bit specifically.** `sudo` itself is used (product
  10) because the concept — privilege elevation, nothing else about the command changes —
  is genuinely specific and correct. But the sandwich joke is one of the single
  most-reused `sudo` references in existing tech-streetwear/merch (this is exactly D1
  Rule 3's "most-memed references" trap), so the description avoids it and states the
  real mechanic instead.
- **Any specific programming language, framework, or version number.** Naming e.g. a
  particular framework dates the catalog and invites a "well, actually" about version
  specifics that has nothing to do with the joke. Everything here is protocol- or
  Unix-level, which doesn't go stale.
- **Matrix rain, hoodie-hacker silhouettes, "someone else's computer."** Excluded per
  D1 Rule 3 directly; not reconsidered here.

**On the structural-copy rule (D1 Section 3, Rule 2):** 8 of the 13 products (including
the hidden one) carry a structural joke — a care label, hangtag, or size note formatted
as a real technical artifact (a config file, a crontab listing, an access-log excerpt, a
`git blame` line, a TCP handshake trace) — rather than a printed slogan. The other 5 are
intentionally plain-copy: not every product needs the gimmick, and repeating the same
"config.yaml" trick on all 13 would itself become the generic-streetwear failure mode
D1 warns against. Five different real formats are used across the 8 (config file,
crontab, INI-style two-block config, Common Log Format access log, `git blame`'s default
output, a handshake trace) — deliberately varied, not one joke copy-pasted.

---

## 2. Main catalog — 12 products

Prices are mock USD display values only; no real commerce is implied anywhere on the
site (per D1's cart/checkout rule, which also governs any cart-adjacent copy pulled from
this doc later).

### 1. Exit Code 0 Tee
- **Category:** Shirt · **Price:** $36
- **Tags:** `exit-codes`, `shell`, `core`
- **Description:** "Ran clean. No errors, no warnings, no output — which is the point."
- **Special copy — care label, styled as a config file:**
  ```
  # care.cfg
  wash: cold
  dry: tumble_low
  iron: false
  bleach: never
  exit_code: 0
  ```

### 2. git blame Tee
- **Category:** Shirt · **Price:** $36
- **Tags:** `git`, `version-control`
- **Description:** "Every line has an author. This one's on you now."
- **Special copy — hangtag, styled as `git blame`'s default output** (real format:
  abbreviated hash, author, date, time, UTC offset, line number, then the line):
  ```
  a3f9c21 (you  2026-01-01 09:14:02 -0500  1) sized true. no exceptions.
  ```

### 3. localhost Tee
- **Category:** Shirt · **Price:** $34
- **Tags:** `networking`, `unix`
- **Description:** "127.0.0.1. Always home, never far."
- **Special copy:** none — plain copy by design (see Section 1).

### 4. 403 / 404 Tee
- **Category:** Shirt · **Price:** $36
- **Tags:** `http`, `status-codes`
- **Description:** "One means it exists and you can't have it. The other won't even
  confirm that much."
- **Special copy — hangtag, styled as an access log excerpt** (Common Log Format:
  host, ident, authuser, timestamp, request line, status, bytes — `-` for unavailable
  fields is standard CLF convention, used correctly here, not invented):
  ```
  10.0.0.4 - - [24/Sep/2026:00:00:00 +0000] "GET /this-shirt HTTP/1.1"  403 -
  10.0.0.4 - - [24/Sep/2026:00:00:00 +0000] "GET /that-shirt HTTP/1.1"  404 -
  ```

### 5. Works on My Machine Tee
- **Category:** Shirt · **Price:** $34
- **Tags:** `debugging`, `classics`
- **Description:** "A true statement. Not a warranty."
- **Special copy:** none — plain copy by design.

### 6. cron Crewneck
- **Category:** Sweatshirt · **Price:** $64
- **Tags:** `unix`, `automation`
- **Description:** "Scheduled to run whether or not anyone remembers writing it."
- **Special copy — care label, styled as a `crontab -l` listing** (real 5-field cron
  syntax: minute, hour, day-of-month, month, day-of-week, then the command; `*` means
  "every"):
  ```
  # crontab -l
  0  6  *  *  *   wash --cycle=cold
  0  6  *  *  *   dry --tumble=low
  *  *  *  *  *   iron --enabled=false
  ```

### 7. Staging vs Prod Crewneck
- **Category:** Sweatshirt · **Price:** $68
- **Tags:** `environments`, `deployment`
- **Description:** "Same shirt. Different consequences."
- **Special copy — care label, styled as an INI-style two-environment config:**
  ```
  [staging]
  wash = cold
  dry = tumble_low
  risk = low

  [production]
  wash = cold
  dry = tumble_low
  risk = someone is wearing this to a client meeting
  ```

### 8. Rubber Duck Hoodie
- **Category:** Sweatshirt · **Price:** $72
- **Tags:** `debugging`, `classics`
- **Description:** "Explain the bug out loud. The hoodie doesn't interrupt either."
- **Special copy:** none — plain copy by design.

### 9. Technical Debt Hoodie
- **Category:** Sweatshirt · **Price:** $72
- **Tags:** `technical-debt`, `metaphor`
- **Description:** "Interest accrues whether or not you check the statement."
- **Special copy — hangtag, styled as a config file:**
  ```
  # balance.cfg
  principal: unpaid_refactor
  interest: compounding
  due: eventually
  ```

### 10. sudo Cap
- **Category:** Hat · **Price:** $30
- **Tags:** `unix`, `permissions`
- **Description:** "Elevated privileges. Everything else about you stays the same."
- **Special copy:** none — plain copy by design. (See Section 1 on why the obvious
  `sudo` joke was avoided.)

### 11. TCP Handshake Cap
- **Category:** Hat · **Price:** $32
- **Tags:** `networking`, `protocols`
- **Description:** "Nothing gets sent until both sides agree to talk."
- **Special copy — hangtag, styled as a handshake trace** (real TCP three-way
  handshake sequence: SYN from client, SYN/ACK from server, ACK from client):
  ```
  client  -> server   SYN
  server  -> client   SYN/ACK
  client  -> server   ACK
  connection established. true to size.
  ```

### 12. Off-by-One Cap
- **Category:** Hat · **Price:** $28
- **Tags:** `debugging`, `classics`
- **Description:** "Counted from zero. Still came up one short."
- **Special copy:** none — plain copy by design.

---

## 3. Hidden 13th product — Konami-code only

**This product is not part of the 6–12 count. Engineer: do not add it to the catalog
grid, the product-listing data used by the grid/sitemap, or any route reachable by
normal navigation or a guessed URL pattern from the other 12. It is a distinct data
entry the Konami-code trigger (D5) points to — treat it as excluded from every "all
products" loop by construction, not filtered out at render time.**

### 13. 200 OK Tee
- **Category:** Shirt · **Price:** $38
- **Tags:** `http`, `status-codes`, `hidden`
- **Description:** "Everything you asked for, nothing you didn't."
- **Special copy — care label, styled as a config file:**
  ```
  # status.cfg
  code: 200
  message: OK
  wash: cold
  dry: tumble_low
  retry: not_needed
  ```
- **Note on tone:** this is the payoff for a visitor who entered a 30-year-old cheat
  code, not a shopper who needs convincing — the copy stays exactly as deadpan as
  everything else. No "you found it!", no congratulatory language, no exclamation
  points. Discovering it is its own reward; the product doesn't editorialize about that.
- **Cross-reference:** this line ("Everything you asked for, nothing you didn't")
  deliberately reuses the HTTP-200 example from D1's do/don't table verbatim, so the
  hidden product reads as the concrete payoff of a voice example the brand already
  committed to, not a new line invented just for the egg.
- D5 (not this doc) will specify: the exact key sequence and where it's listened for,
  what "reveal" means in the UI (e.g. a toast, a route becoming reachable, a modal),
  and the discoverability hint. This doc only fixes the product identity so D5 has a
  real target.

---

## 4. Summary table (for quick reference)

| # | Name | Category | Price | Tags | Structural copy |
|---|---|---|---|---|---|
| 1 | Exit Code 0 Tee | Shirt | $36 | exit-codes, shell, core | config file |
| 2 | git blame Tee | Shirt | $36 | git, version-control | `git blame` output |
| 3 | localhost Tee | Shirt | $34 | networking, unix | — |
| 4 | 403 / 404 Tee | Shirt | $36 | http, status-codes | access log |
| 5 | Works on My Machine Tee | Shirt | $34 | debugging, classics | — |
| 6 | cron Crewneck | Sweatshirt | $64 | unix, automation | crontab listing |
| 7 | Staging vs Prod Crewneck | Sweatshirt | $68 | environments, deployment | two-block config |
| 8 | Rubber Duck Hoodie | Sweatshirt | $72 | debugging, classics | — |
| 9 | Technical Debt Hoodie | Sweatshirt | $72 | technical-debt, metaphor | config file |
| 10 | sudo Cap | Hat | $30 | unix, permissions | — |
| 11 | TCP Handshake Cap | Hat | $32 | networking, protocols | handshake trace |
| 12 | Off-by-One Cap | Hat | $28 | debugging, classics | — |
| 13 | **200 OK Tee (hidden — Konami code only, not in grid)** | Shirt | $38 | http, status-codes, hidden | config file |

Category totals (visible catalog, 12): 5 shirts, 4 sweatshirts, 3 hats. Including the
hidden product: 6 shirts, 4 sweatshirts, 3 hats, 13 total. No accessories anywhere on
the site.

---

## 5. Notes for the Engineer (E2/E3)

- Build the typed product-data module (per ADR 0003, e.g.
  `apps/web/src/data/products.ts`) from Section 2's 12 products only. Add the hidden
  product as a separate export or a separate record explicitly excluded from whatever
  array/loop feeds the grid — see Section 3's bolded constraint.
- "Special copy" blocks are meant to render close to verbatim, in a monospace/code-block
  treatment on the product detail page (styling is D2's call, not specified here) — they
  are not paraphrase targets. Keep field names, spacing, and command syntax exactly as
  written; they're real formats, not decorative text.
- Tags are a flat, lowercase, hyphenated vocabulary (`exit-codes`, `git`, `http`,
  `status-codes`, `networking`, `unix`, `shell`, `debugging`, `classics`, `automation`,
  `environments`, `deployment`, `technical-debt`, `metaphor`, `permissions`, `protocols`,
  `version-control`, `core`, `hidden`) — reuse this exact set if a tag-filter UI gets
  built later rather than inventing new tag strings ad hoc.
- No product references the owner or the brand's founding story — none of this copy
  required a placeholder.

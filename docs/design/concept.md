# ZeroJance — Brand Concept (D1)

Owner: creative-director. Branch: `feat/design-brand`. Depends on: none.

This is the brand-identity foundation everything else (`tokens.css`, `products.md`,
`lookbook.md`, `about.md`, `easter-eggs.md`) builds on. It does not carry forward any
palette, voice, or easter-egg content from the old cybersecurity-terminal project
(ADR 0003) — this is written from zero.

---

## 1. Premise

**ZeroJance makes workwear for people who live inside terminals, tickets, and on-call
rotations.**

The point of view: software work has its own folklore — not the sci-fi, hacker-movie
kind, but the specific, unglamorous rituals anyone who ships code or runs a network
recognizes instantly. A stack trace at 2am. A `git blame` that only ever finds your own
name. A `ping` with 100% packet loss. A cron job nobody on the team remembers writing. A
whiteboard interview. The gap between "works on my machine" and "works in prod."
ZeroJance treats that folklore the way skate and surf brands treat their own inside
jokes: worn with pride by people who were actually there, not licensed out as a costume
for people who weren't.

That's the differentiator from every other "coding" streetwear template: **this is
workplace humor, not futurism.** No cyberpunk cityscapes, no neon hacker-in-a-hoodie
silhouettes, no "hack the mainframe." The reference point is the office, the terminal,
the incident channel — not a sci-fi movie set. It's dry, specific, and a little tired,
because that's what the source material actually feels like.

**On the name.** For design purposes, treat "ZeroJance" as landing near "zero" —
exit code 0, index 0, zero-downtime, a null result — read against something that sounds
like "riddance" or "chance." That's a design frame for tone (dry, terse, a little
self-mocking), not a claimed etymology. `[PLACEHOLDER: real meaning/origin of the name,
if the owner has one — do not guess further or present the above as fact in any
customer-facing copy]`.

`[PLACEHOLDER: brand founding story — who started it, when, why, where]`. No founding
year, location, headcount, or backstory appears anywhere in this or later design docs
until the owner supplies it.

---

## 2. Voice guide

**Tone in one line:** a senior engineer explaining something true and slightly
embarrassing about the job, without raising their voice.

Properties:
- **Deadpan.** No exclamation points. No "you'll love this." Understate, don't hype.
- **Technically accurate.** Every reference (HTTP status code, git/unix command, exit
  code, protocol detail) has to be *actually correct*. A wrong status code or a made-up
  command breaks the joke and breaks trust with the one audience that will notice
  immediately. Never invent a fake-sounding technical detail for the sake of a pun
  (e.g. no "Error 606") — if a joke needs a fabricated code to work, cut the joke.
- **Terse.** Copy reads like a commit message, a log line, or a code comment — short,
  declarative, no filler adjectives ("premium," "elevated," "must-have").
- **In on the joke, not explaining it.** Never follow a joke with an explanation of the
  joke. If it needs a footnote for a general audience, it's not specific enough.
- **Peer-to-peer.** Talk to the reader like a colleague, not a shopper. No "level up,"
  no "drip," no startup-pitch language.

### Do / Don't

| Do | Don't | Why |
|---|---|---|
| "Sized true. Unlike your estimates." | "Level up your drip with our exclusive fit!" | Deadpan + specific dev-culture reference vs. generic hype |
| "404: this shirt, this size. Try another size below." | "404 ERROR!! SYSTEM BREACH!! ACCESS DENIED!!" | Real, correct usage of a real status code vs. meaningless glitch-speak |
| "Runs in prod. Also runs in the wash — cold, tumble low." | "Hack the mainframe in this cyber-tactical hoodie." | Grounded in real work vocabulary vs. hacker-movie cosplay |
| "Ships when it ships. No ETA promises here either." | "Get it FAST — don't miss out on this drop!!" | Self-aware honesty vs. urgency-marketing pressure |
| "Comments included. Judgment not." | "This design speaks for itself. Iconic." | Dry, specific joke vs. vague self-congratulation |
| "Exit code 0. Nothing to report, nothing to fix." | "Flawless. Perfection. The ultimate piece." | Uses a real, correct technical fact as the compliment vs. empty superlatives |
| "Two hundred okay. Everything you asked for, nothing you didn't." | "200% satisfaction guaranteed!" | Correct HTTP semantics as wordplay vs. a made-up, meaningless stat |

### Cart / checkout copy — hard rule

Any cart, "Add to Cart," or checkout-flavored line must read as real UI copy but never
claim a real transaction happened. Acceptable pattern: confident, ordinary retail
phrasing ("Added to bag," "Review your bag," "This is a mockup checkout — no order is
placed and no payment is processed.") — the *last* line on any checkout-style screen
should say plainly that nothing was sent or charged. Never write "Order confirmed,"
"Confirmation emailed," "Payment processed," or anything implying the order left the
browser. (Full checkout copy is Engineer's E4 + a later CD pass if needed; this rule
governs any cart-adjacent copy written in D3/D4/D5 too.)

---

## 3. Three things that keep this from reading as generic streetwear

1. **Every joke has to be technically correct, or it doesn't ship.** Status codes,
   git commands, unix flags, protocol behavior — all real, checkable facts, not
   approximated for rhythm. This is a constraint the Engineer and I both hold copy to:
   if a reviewer who does this for a living would wince at the technical detail, the
   line gets cut or fixed, not shipped. (Concretely: `products.md` and `easter-eggs.md`
   will only use real HTTP codes, real command syntax, real semver/git semantics.)

2. **The joke lives in the object's structure, not just a printed slogan.** A slogan
   tee is the generic-streetwear default. ZeroJance's move is to put the joke in the
   *format*: a care label written as a config file (key/value pairs — `wash: cold`,
   `dry: tumble_low`, `iron: false`), a size chart formatted like CLI output, a hangtag
   that reads like a diff. The garment becomes the artifact, not a billboard for a
   caption. (Full spec for this is D3's job; this doc sets the rule that D3 must
   follow it.)

3. **Curated, specific, and deliberately not the most-memed references.** Tech culture
   has a short list of references every "coding" product already uses to exhaustion —
   Matrix green rain, "there is no cloud, it's just someone else's computer,"
   hoodie-and-balaclava hacker silhouettes. ZeroJance avoids all three and pulls instead
   from the *unglamorous, specific* end of the culture: cron, `git blame`, TCP's
   three-way handshake, off-by-one errors, `localhost`, the 403-vs-404 distinction,
   `sudo`, yak-shaving, staging-vs-prod, rubber-duck debugging, technical debt, exit
   codes. None of these need a movie reference to land — they land because the reader
   has personally lived them.

These three rules, plus the palette/type direction set in D2 (explicitly not the old
project's cyberpunk-terminal look), are what later docs (`products.md`, `lookbook.md`,
`about.md`, `easter-eggs.md`) are built to satisfy.

---

## 4. Easter-egg selection

The brief's list, all six considered:

| # | Idea | Status | Reasoning |
|---|---|---|---|
| 1 | Hidden/13th product (Konami code, scroll-to-bottom, buried link) | **Picked for D5** | This is the marquee "secret" the owner specifically wants a standout version of. A keyboard-trigger easter egg (Konami code is the most dev-culture-native trigger available — it's itself a decades-old in-joke about people who know a cheat code) fits the brand's whole premise: reward the visitor who behaves like the audience we're speaking to. |
| 2 | Dev-console / view-source message | **Picked for D5** | Near-zero engineering cost, directly on-theme (it rewards a visitor for literally doing what a developer does — opening the console), and it's a distinct surface from the other two picks (browser tooling vs. a hidden route vs. an error page), so the three don't overlap or compete for the same moment of discovery. |
| 3 | Changelog page styled like `git log` | **Deferred** | This is closer to a full content page than a "secret" — it's reachable from ordinary navigation, not discovered. It's a strong idea and fits the voice well, but it competes with D4 (lookbook/about) for engineering and content budget in this MVP pass. Flagging it as a strong v2 candidate, not a rejected one. |
| 4 | Joke 404 page (stack trace / "not found in catalog") | **Picked for D5** | The site needs a 404 page regardless of whether it's styled as an egg, so this is close to zero marginal cost and guaranteed high visibility (every visitor who mistypes a URL or follows a dead link sees it). Styling the mandatory error page in-voice is the cheapest, highest-leverage pick on the list. |
| 5 | Discount code that's a programming pun | **Deferred** | Risk of blurring mock-commerce discipline: a "working" discount code implies functioning checkout logic (validation, applied-discount state) that has to visibly do something without ever implying a real transaction, which adds interaction surface to the part of the site (E4, checkout) that already carries the heaviest honesty burden. The pun itself is worth keeping — it will live as static flavor copy on a product tag or hangtag instead of as an interactive coupon field. |
| 6 | Product copy/tags styled like a config file (care label, etc.) | **Reclassified, not an egg** | This isn't a discoverable secret — it's visible standard copy on every product page. Folding it into D3 as a baseline copy rule (see Section 3, point 2) rather than treating it as one of the 2-3 curated "eggs." It still ships; it's just not counted against the egg budget. |

**Picked for D5 (in order of build simplicity): dev-console message, joke 404 page,
hidden 13th product via Konami code.** All three are: client-side only, harmless, no
external calls or assets, and each targets a different discovery surface (browser
tooling, an error page every visitor might hit, a deliberate hidden interaction) so they
read as a layered system rather than three variations on the same trick. Exact
trigger/output/discoverability-hint specs are D5's job, once D3's product list exists
(the hidden 13th product needs a real product to reveal).

---

## 5. Open placeholders

- `[PLACEHOLDER: real meaning/origin of the name "ZeroJance"]`
- `[PLACEHOLDER: brand founding story — who, when, why, where]`
- No other owner-specific facts are referenced in this document.

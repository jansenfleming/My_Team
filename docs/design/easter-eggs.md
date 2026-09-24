# ZeroJance — Easter-Egg Specs (D5)

Owner: creative-director. Branch: `feat/design-eggs`. Depends on: D1
(`docs/design/concept.md`) and D3 (`docs/design/products.md`). Read both first — this
doc doesn't repeat the voice guide or the product's identity, it only adds the exact
trigger/output mechanics D1 deferred to D5. Style values below cite D2's real tokens
(`docs/design/tokens.css`, `docs/design/style-guide.md`), which merged after D1 was
written but before this doc — so unlike D1's own placeholder note about D2, this spec
uses the real `--zjc-*` variable names throughout, not guesses.

**No new eggs are picked here.** D1 §4 already chose the three: dev-console/view-source
message, joke 404 page, hidden 13th product via Konami code. This doc specs those three
only. The two D1 deferred (a `git log`-styled changelog page, a programming-pun discount
code) stay deferred — not reconsidered, not partially built in here as a shortcut.

---

## 1. Dev-console / view-source message

Two complementary, static surfaces — a comment in the raw HTML (found by "View Page
Source") and a console log (found by opening dev tools). Both fire unconditionally, no
interaction required, matching the task instruction that console-open detection isn't
reliably scriptable so this is "always present," not a trigger in the interactive sense.

### 1a. View-source surface

**Trigger:** always present in `apps/web/index.html`'s raw markup — no script needed,
survives even if JS fails to load. **Page(s):** the single static `index.html` is served
for every route (client-side routing SPA), so this is global by construction.

**Exact content** — insert as an HTML comment, directly after the `<title>` line and
before `</head>`:

```html
<!--
  view-source: 200 OK.
  Nothing else is hidden in the markup — try the console.
-->
```

Nothing else changes in `index.html`. This is a real, correct usage of the 200 status
(a successful `GET` of the document is exactly what a "View Page Source" request is) —
per D1 Rule 1, not a status code invented for the pun.

### 1b. Console surface

**Trigger:** fires exactly once per full browser page load (i.e., once at app
bootstrap/module evaluation — not once per client-side route change, so navigating
catalog → product → about doesn't reprint it three times). Recommended location:
top-level code in `apps/web/src/main.tsx`, or a `useEffect(() => { ... }, [])` in `App`
— either satisfies "once per load," engineer's call. **Page(s):** global — every route,
since the whole call happens before/at the point the SPA shell mounts.

**Exact content** — three separate `console.log` calls, in this order:

```js
console.log(
  "%cZeroJance",
  "font-weight:700;font-size:16px;font-family:monospace;letter-spacing:0.02em;"
);
console.log("console.log is still the most common debugger. No shame in it.");
console.log("Not everything here is in the catalog.");
```

(The inline style intentionally reuses D2's real values in spirit — `font-weight:700`
matches `--zjc-weight-bold`, `monospace` matches `--zjc-font-mono` — but this is a
`console.log` string, not CSS in the page, so it can't reference the custom properties
directly; hardcoding the matching literal values is correct here, not a token violation.)

Line 2 is a true, checkable claim about how developers actually debug — not a movie
reference, satisfying D1 Rule 3. Line 3 is the only discoverability hint anywhere on the
site for egg 3 (the hidden product) — see §3's "Discoverability hint." It names that
something is hidden without naming the mechanism (no mention of Konami code, arrow keys,
or "13th product" anywhere in shipped copy).

### Suggested test coverage
- A render/mount test asserts `console.log` (spied/mocked) was called exactly 3 times
  with these exact strings on initial app mount, and not again on a simulated route
  change.
- A build or static-content check confirms the HTML comment string is present verbatim
  in the built `index.html` (or the source file, if no build-time HTML processing runs).

---

## 2. Joke 404 page

**Trigger:** any pathname `matchRoute()` (`apps/web/src/router/matchRoute.ts`) doesn't
match — already wired to `NotFoundPage` in `App.tsx`'s route switch. No new routing
work. This also covers the hidden product's slug (`/product/200-ok`) whenever it isn't
unlocked — see §3; `NotFoundPage` doesn't need any special-case for that, it's just
another unmatched-at-render-time product lookup rendering the same page.

**Angle chosen: "item not found in catalog," not a fake stack trace.** ADR 0003
explicitly drops the old project's terminal/hacker aesthetic; a fabricated stack trace
(fake file paths, fake line numbers) risks reading as either a return to that look or as
an invented technical detail with no real referent, which D1 Rule 1 rules out. A real,
correctly-used HTTP status line does the same joke — "the thing you asked for doesn't
exist" — with zero invented facts.

**Exact content** — replaces the current placeholder body in
`apps/web/src/pages/NotFoundPage.tsx`:

- **Heading:** `404`
- **Status line** (monospace, one line, built from the actual `pathname` the router
  already exposes via `useRouter()` — do not hardcode a sample path):
  `GET {pathname} → 404 Not Found`
  If `pathname` (excluding the leading `/`) is longer than 60 characters, truncate to 57
  characters and append `…` so the line can't force horizontal scroll or overflow on
  mobile; also set `overflow-wrap: anywhere` on the line as a second line of defense.
- **Body copy:** `Not in the catalog. Try the catalog instead.`
- **Interactive elements** — two real links, not one:
  - `Back to catalog` → `/catalog`
  - `Back home` → `/`

Render `pathname` as ordinary JSX text (`{pathname}`), never via
`dangerouslySetInnerHTML` — React escapes it automatically, so an unusual or malformed
path in the URL bar can't inject markup.

**Styling (D2 tokens, for the Engineer building this against real values):**
- Page background: `--zjc-bg`, with the grid-motif background from
  `style-guide.md` §3 applied directly (the style guide names "the 404 page background"
  as one of the sanctioned places for this motif).
- `404` heading: `--zjc-alert` color (style guide row 11: "Error/sold-out text, **404
  copy** on page bg" — this is the token the D2 contrast table already earmarked for
  this exact use), `--zjc-text-2xl` or `--zjc-text-3xl`, `--zjc-weight-black` or
  `--zjc-weight-bold`.
- Status line: `--zjc-font-mono`, `--zjc-text-sm` or `--zjc-text-base`, `--zjc-fg-muted`
  on `--zjc-bg` (row 3, 5.52:1 — passes the 4.5:1 body floor).
- Body copy and links: `--zjc-fg` (row 1) and `--zjc-link`/`--zjc-signal` (row 5,
  6.71:1), links underlined per the standing component rule.
- No motion required or expected on this page; if the Engineer adds an entrance
  transition it must sit inside `@media (prefers-reduced-motion: no-preference)` per
  style-guide.md §5 (tokens.css already collapses durations to 0ms under `reduce` as a
  fallback either way).

### Suggested test coverage
- Render `NotFoundPage` (or navigate to an unmatched path) and assert the heading `404`,
  the literal status line with the actual pathname substituted, the body copy, and both
  links (`href`/route target) are present.
- A truncation test: navigate to a path longer than 60 characters and assert the
  rendered status line is truncated with a trailing `…` and does not overflow (a
  snapshot or a `scrollWidth`-vs-`clientWidth` check, engineer's call).

---

## 3. Hidden 13th product — Konami code

Target product: **200 OK Tee** (`docs/design/products.md` §3). This doc fixes the one
detail D3 left open — the exact slug — and the full trigger/reveal mechanics.

**Fixed slug: `200-ok`.** Route: `/product/200-ok`. This already matches the existing
`/^\/product\/([^/]+)$/` pattern in `matchRoute.ts` with zero router changes — the only
new logic is in what `ProductPage` does when it looks that slug up (see "Reveal," below).

### Trigger — exact sequence and context

**Keys, in order** (compare against `event.key`, case-insensitive for the two letters):
```
ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, b, a
```
This is the unmodified, classic 30-key-era Konami code — no variant, no Start/Select
substitution (there's nothing on this site those would map to).

**Context — global, every page**, via a single `window`-level `keydown` listener
mounted once (e.g. a small component or hook rendered inside `Layout`, so it's alive for
every route without remounting on navigation — `Layout` itself doesn't remount when the
route changes in the current shell, only `Pages` does). Not restricted to the catalog
page: D1's own reasoning for this egg is "reward the visitor who behaves like the
audience we're speaking to," and that visitor might land first on `/about` or
`/lookbook`, not the catalog.

**Matching logic** (a pure, testable state machine — keep it separate from the DOM
listener so it's unit-testable without simulating `keydown` events):
- Track a progress index, starting at 0.
- On each `keydown`, if the key matches `SEQUENCE[progress]`, increment progress. If
  progress reaches `SEQUENCE.length`, the code is complete — reset progress to 0 and
  fire the reveal (§ below).
- On a mismatch, reset progress to 0, **then** re-check the just-pressed key against
  `SEQUENCE[0]` — if it matches, set progress to 1 instead of 0. (Standard Konami-code
  implementation detail: without this, a visitor who fumbles partway through can't
  retry without an accidental extra keystroke absorbing the restart.)
- **Do not fire while focus is in an editable element** — check
  `document.activeElement` and bail out (don't advance or reset progress on that
  keystroke) if it's an `<input>`, `<textarea>`, `<select>`, or has
  `isContentEditable === true`. There's no text field on the current shell (no
  newsletter form, no search box), but this guards against a future one silently
  breaking on every "b" or "a" keystroke a visitor types.
- **Never call `preventDefault()`** on any of these keys, matched or not — arrow-key
  page scroll and normal typing must behave identically whether or not a sequence is in
  progress.
- Re-entering the full sequence after it's already unlocked (see below) is harmless and
  simply re-shows the confirmation banner; no special-casing needed.

### Result — exact reveal mechanism

**On a completed sequence:**

1. **Set an unlock flag:** `localStorage.setItem("zj_unlocked_200ok", "1")`. Wrap the
   read and write in `try/catch` — if `localStorage` throws or isn't available (private
   browsing, blocked storage), fall back to an in-memory flag (a module-level variable
   or React state) scoped to the current page session. The reveal still works for that
   visit either way; only the "stays unlocked next visit" behavior is lost in the
   fallback case. This is the "usable fallback if any effect fails" the brief asks for —
   the egg degrades to session-only rather than breaking.
2. **Show a persistent confirmation banner** (not a timed toast — no auto-dismiss
   timer, so a visitor using a screen reader or navigating slowly can't have it vanish
   before they act on it). Exact copy:
   - Text: `Item unlocked.`
   - A real link: `View 200 OK Tee` → `/product/200-ok`
   - A dismiss control: a small `×` button, `aria-label="Dismiss"`
   - The banner is wrapped in an `aria-live="polite"` region so screen readers announce
     it without stealing focus.
   - Per D3 §3's explicit tone note: no "you found it," no exclamation point, no
     congratulatory language — `Item unlocked.` is deliberately as flat as "Added to
     bag" elsewhere on the site.
   - Dismissed by: clicking `×`, clicking the link (which navigates away), or a route
     change. No fixed timer.
   - Non-modal: doesn't block the rest of the page, doesn't trap focus, doesn't require
     dismissal to keep browsing.
   - Styling: `--zjc-bg-surface` card, `--zjc-z-toast` (60 — the same layer already
     named for the "added to bag" toast; this is the same category of ephemeral
     confirmation UI, not a new z-index tier), `--zjc-fg` body text (row 2, 17.77:1),
     `--zjc-ok` as an accent (left border or icon only — it's the token style-guide.md
     names for exactly this register: "in-stock / confirmed / 'exit code 0'"), link in
     `--zjc-link`, dismiss control gets the standard focus-ring rule. Entrance
     transition (if any) at `--zjc-dur-moderate` / `--zjc-ease-out`, wrapped in
     `@media (prefers-reduced-motion: no-preference)` — a static appear/disappear with
     no transition at all is an equally acceptable, simpler baseline.
   - **The banner does not auto-navigate.** Navigation is user-initiated (the visitor
     clicks the link) rather than the page redirecting itself the instant the sequence
     completes — an unrequested context change on keystroke is the kind of surprise
     WCAG's "change on request" guidance flags, and it's avoidable here with no loss of
     payoff: the code already unlocked the product; clicking through is a small, normal
     action.

3. **`ProductPage` gating** (for E3/E6, once the real product-data module and
   `ProductPage` lookup exist): for slug `200-ok` specifically, render the hidden
   product's detail page (identical treatment to any of the other 12 — name, price,
   description, tags, the config-file-styled care label from `products.md` §3, size
   picker, Add to Cart, all functioning normally) **only if**
   `localStorage.getItem("zj_unlocked_200ok") === "1"`. If that check fails — including
   a visitor who guesses or types the URL directly without ever entering the code —
   render the exact same `NotFoundPage` any other unmatched slug gets. This is what
   satisfies D3 §3's "must not be reachable by direct navigation from ordinary
   browsing": the gate is a runtime check inside the lookup, not a route that simply
   doesn't exist until unlocked (which would be identical in effect but this phrasing
   avoids any ambiguity about whether the route itself needs to be conditionally
   registered — it doesn't; `matchRoute.ts` needs no changes).
   No prop or context needs to pass from the Konami listener to `ProductPage` — they're
   decoupled through `localStorage`, so the listener can live anywhere and `ProductPage`
   just reads the flag fresh on each render/mount.

### Discoverability hint

**Deliberately undocumented — pure discovery, with one indirect breadcrumb.** No text
anywhere on the site (nav, footer, about page, product pages) mentions the Konami code,
arrow keys, or a "13th product." The only hint in the entire system is §1b's third
console line, `"Not everything here is in the catalog."` — which confirms something is
hidden without naming the mechanism. Finding the trigger itself is left entirely to a
visitor either knowing the Konami code as cultural knowledge (the whole point: D1's
reasoning for this pick is rewarding the audience who'd recognize it unprompted) or
stumbling onto it by chance. This is a deliberate design choice, not an oversight — flag
it to the Architect/lead only if the owner later wants a more visible hint; nothing here
should be read as "a hint is still needed."

### Suggested test coverage
- A pure unit test for the sequence-matching state machine: full correct sequence
  completes; a wrong key at any position resets progress (and correctly restarts at 1
  if the wrong key happens to be `ArrowUp`); keystrokes while a mock "focused" editable
  element is active never advance or complete the sequence.
- An integration test: simulate the 10 keydowns on `window`, assert
  `localStorage.getItem("zj_unlocked_200ok")` becomes `"1"` and the confirmation banner
  renders with the exact copy and a working link to `/product/200-ok`.
- A `ProductPage` test (once E3 exists): with the flag unset, navigating to
  `/product/200-ok` renders `NotFoundPage`; with the flag set, it renders the hidden
  product's real detail content.
- A `localStorage`-throws test: mock `localStorage.setItem` to throw, confirm the
  banner still renders and the in-memory fallback still lets `/product/200-ok` render
  correctly for that render pass.

---

## 4. Cross-cutting constraints (all three eggs)

- **Client-side only, no network calls, no third-party assets.** Every string above is
  static or derived from `window.location`/`localStorage`; nothing fetches, posts, or
  loads an external resource.
- **Harmless.** Nothing here can corrupt cart state, block navigation, or trap a user —
  the console/view-source surfaces are read-only by nature, the 404 page is a normal
  page with normal links, and the Konami banner is dismissible and non-modal.
- **`prefers-reduced-motion` respected** wherever any of the three specs mentions
  motion (only the optional Konami-banner entrance) — and even an engineer who forgets
  the media query gets a safe instant fallback for free, because `tokens.css` already
  collapses every `--zjc-dur-*` value to `0ms` under `prefers-reduced-motion: reduce`
  (style-guide.md §5).
- **Contrast:** every color pairing cited above (§2, §3) is a real row already computed
  in `style-guide.md` §2, not a new pairing invented for this doc — no new contrast
  computation was needed.
- **No fabricated facts.** The one new piece of "technical content" this doc adds beyond
  what D1/D3 already established is the view-source comment's `200 OK` framing, which is
  a real, correct use of the status code (a successful page-source `GET`), and the
  console's "`console.log` is still the most common debugger" line, which is a true,
  checkable claim about developer practice, not an invented statistic.
- **Fallback if JS fails entirely:** none of the three eggs work without JavaScript, but
  that's not a new failure mode — the whole site is a client-rendered SPA (a single
  `<div id="root">` in `index.html`) that already requires JS to render anything at all,
  per E1's shell. No additional no-JS fallback is needed for these three specifically.

---

## 5. Buildability check

| Egg | Engineering surface | Estimate |
|---|---|---|
| Dev-console / view-source | 1 static HTML comment + 3 `console.log` calls fired once on mount | well under an hour |
| Joke 404 | Rewrite one existing placeholder component (copy + `useRouter()` pathname + 2 links + truncation guard) | under an hour |
| Konami code | New keydown listener/hook (pure sequence-matcher + DOM wiring), a small dismissible banner component, one `localStorage` flag, one conditional branch in `ProductPage`'s future lookup | a few hours, comfortably under a day |

All three fit well under a day of engineer work individually and combined (board task
E6). None needed simplifying from a bigger first draft — the reveal mechanism (banner +
user-initiated link, not an auto-redirecting toast) was chosen specifically because it's
*both* the simplest implementation and the more accessible one, not as a scope cut.

---

## 6. Notes for the Engineer (E6, and the ProductPage-lookup part of E3)

- Files this touches once implemented: `apps/web/index.html` (comment), a new small
  module for the console log (e.g. inline in `main.tsx`, engineer's call), a rewrite of
  `apps/web/src/pages/NotFoundPage.tsx`, a new Konami-listener component/hook mounted in
  `apps/web/src/layout/Layout.tsx`, and — once E3's real product-data module and
  `ProductPage` lookup exist — the one conditional branch described in §3 "Reveal," step
  3. This doc doesn't touch or restate `docs/design/products.md`'s product content;
  it only fixes the slug (`200-ok`) that document left open.
- The `localStorage` key name (`zj_unlocked_200ok`) and its value (`"1"`) are exact —
  reuse them verbatim if a test or another component needs to check the flag, rather
  than inventing a second name for the same thing.
- If the Engineer finds a reason any of the above needs to change (e.g. `Layout` turns
  out to remount on route change after all, or a future form field needs the editable-
  element guard to behave differently), message the Creative Director rather than
  guessing — per the kickoff brief's "implementation-feasibility questions go to the
  Engineer; anything that changes the spec comes back here" working agreement.

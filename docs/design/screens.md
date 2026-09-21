# ZeroJance Screens: Boot, Layout, Motion (D3)

Owner: Creative Director. Task D3 (`feat/design-screens`). Builds on `concept.md` (world and rules), `style-guide.md` and `tokens.css` (all values), and `terminal-commands.md` (strings, session states). For the Frontend Engineer (F5, and F6 for the a11y polish).

Everything is exact. Values come from `tokens.css` tokens unless a number is stated here; the few app constants (boot timeout, poll interval, thresholds) are listed in section 12 and belong in `apps/web/src/content/` or a config module, not in CSS. No external requests, no inline scripts or styles, system fonts only.

Rule that governs this whole file (concept rule 1): **every line that looks like a reading is a real reading.** Section 2 says which things are real, which are pacing, and which are fiction.

---

## 1. The screen

One screen: a status rail on top and a full-height terminal under it. There are no other pages, no modals, no overlays. Boot is printed inline into the terminal log (not an overlay), so it becomes ordinary scrollback and `clear` can remove it. The unused `--zj-z-boot` token stays reserved for a later overlay.

## 2. Real, pacing, or fiction

| Thing on screen | Class | Source |
|---|---|---|
| Boot line values: display size, motion preference, clock, uplink version/contract/latency, session | **Real** | Browser (`innerWidth`, `matchMedia`, `Date`) and the real `GET /api/health` and `GET /api/auth/me` calls |
| Latency numbers (`{ms}`) | **Real** | `performance.now()` delta around the actual request |
| Boot typing speed and the 60 ms gaps | Pacing | Design choice only. Values stay real; only the moment they appear is staged |
| `[ .. ]` resolving to `[ ok ]` / `[warn]` / `[fail]` | **Real** | The check's actual outcome |
| Rail: uplink word and sweep color/speed | **Real** | Latest health result (boot, `status`, any server command, and a 30 s poll while the tab is visible) |
| Rail: `T+` clock | **Real** | Time since page load |
| Rail: clearance | **Real** | Session state from `auth/me`, login, logout, or a 401 |
| `TRANSIENT-{id}` | Label | Random, client-side, per page load. A name tag, not a measurement |
| `// neighbors: picket-01 to picket-06 do not answer.` and every other `// ` line | Fiction | Commentary voice, always marked by `// ` |
| Hazard tape, tag colors, sweep rotation | Semantic style | Shown only when the state it represents is true |
| Cursor blink | Decorative | The only purely decorative motion, first paint only (E1) |

If a value is not available, show the fail form, never a plausible number.

## 3. Landmarks and DOM

```
<body>
  <a class="skip-link" href="#terminal-input">Skip to the command line</a>
  <header class="rail">                         <!-- banner landmark -->
    <svg class="rail-sweep" aria-hidden="true">...sweep-glyph.svg inline...</svg>
    <span class="rail-name">ZEROJANCE</span>
    <span class="rail-uplink" role="status">uplink ok</span>
    <span class="rail-clock" aria-hidden="true">T+00:41</span>
    <span class="rail-clearance">clearance: none</span>
  </header>
  <main id="main">                              <!-- main landmark -->
    <div class="terminal" role="region" aria-label="ZEROJANCE terminal">
      <div class="terminal-log" role="log" aria-live="polite" tabindex="0">...</div>
      <nav class="chips" aria-label="Quick commands">...buttons...</nav>
      <form class="terminal-form">...prompt + <input id="terminal-input">...</form>
    </div>
  </main>
  <div class="sr-only" role="status" id="boot-status"></div>   <!-- one-shot announcements -->
</body>
```
- The terminal region, log, and input are the engine's (`apps/web/src/terminal`). F5 places the chips `<nav>` between the log and the input row and adds `tabindex="0"` to the log so keyboard users can scroll it.
- No footer, no `contentinfo`. Exactly one `banner`, one `main`, one `navigation`.
- `.sr-only` = visually hidden but readable (position absolute, 1px clip). Not `display: none`.
- The rail's clock is `aria-hidden` (a ticking clock read aloud is noise). The uplink segment is `role="status"` so a change (`uplink ok` to `uplink down`) is announced once. The rail name is plain text, not a heading (the page has no headings).

### 3.1 First-paint HTML (`apps/web/index.html`)
The document must show the station name before any JavaScript runs. Exact:
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
    <meta name="color-scheme" content="dark" />
    <meta name="theme-color" content="#0B0D10" />
    <meta name="description" content="ZEROJANCE: an interactive terminal, built by five AI agents." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>ZEROJANCE</title>
  </head>
  <body>
    <div id="root"><pre class="boot-static" aria-hidden="true">ZEROJANCE <span class="boot-cursor">█</span></pre></div>
    <noscript><pre class="boot-static">ZEROJANCE
// this station needs javascript to talk.</pre></noscript>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
- `favicon.svg` is a copy of `docs/design/assets/favicon.svg` in `apps/web/public/`. The stylesheet (tokens plus base) is a linked file that Vite injects into `<head>`, so `.boot-static` is styled with ink background, `--zj-fg` text, `--zj-text-xl`, and padding `--zj-gutter` before JS runs.
- React replaces `#root` content on mount. No layout jump: `.boot-static` and the rail occupy the same top-left origin (padding `--zj-gutter`).
- The document `<title>` stays `ZEROJANCE` at all times (no unread counters or state changes).

## 4. Layout

Breakpoints (em, so they follow the user's font size): compact `max-width: 36em` (576px), regular `min-width: 36em`, wide `min-width: 48em` (768px). Test at 320, 390, 768, 1280 CSS px, and at 200% zoom.

- Page: `background: var(--zj-bg)`, `color: var(--zj-fg)`, `min-height: 100dvh`, grid rows `auto 1fr` (rail, main). No page-level scroll: the log scrolls inside `main`. Under 200% zoom the layout must still reflow with no horizontal scroll.
- Column: terminal content max width `var(--zj-measure)` (80ch), centered with `margin-inline: auto`. The rail's background and bottom border are full-bleed; its content uses the same column width.
- Gutters: `--zj-gutter` (16px) on compact and regular; `--zj-space-6` (32px) from wide. Add `env(safe-area-inset-*)` to the gutters (`viewport-fit=cover`).
- Rail: height `--zj-rail-height` (36px), `background: var(--zj-bg-raised)`, `border-bottom: var(--zj-border-width) solid var(--zj-border)`, text `--zj-text-xs` (name in `--zj-text-sm`, bold, tracked `--zj-tracking-tag`), items vertically centered, gap `--zj-space-4`. Rail items in this order: sweep glyph (20px), `ZEROJANCE`, then a flexible space, then uplink, clock, clearance (right aligned).
- Terminal: `display: flex; flex-direction: column;` fills `main`. The log gets `flex: 1 1 auto; min-height: 0; overflow-y: auto` (replace the engine's `--terminal-log-max-height: 70vh` with the flex fill). Log bottom padding `--zj-space-3`.
- Input row: pinned under the log. Prompt in `--zj-prompt`, typed text `--zj-fg`, input font 16px (`--zj-text-md`, prevents iOS zoom), caret `caret-color: var(--zj-cursor)` and `caret-shape: block` where supported (progressive enhancement; a thin caret is fine). The input row bottom padding is `max(var(--zj-space-3), env(safe-area-inset-bottom))`.
- Compact rail: the clearance segment is shown only when it is not `none` (so a transient sees `ZEROJANCE  uplink ok  T+00:41`, an operator sees the same plus `clearance: operator`). From regular width up, always shown.
- Compact prompt (`max-width: 26em`, 416px): the prompt drops the host: `4f2a ~ $` and `operator ~ #` (the rail carries the name). Scrollback lines keep the prompt they were run with.

### 4.1 Wireframe, wide (1280 x 800)
```
+--------------------------------------------------------------------------------+
| (o) ZEROJANCE                    uplink ok     T+00:41    clearance: none       |  rail 36px, bg-raised
+--------------------------------------------------------------------------------+
|                                                                                |
|      [ ok ] display   1280x800                    <- column: max 80ch, centered |
|      [ ok ] motion    full                                                     |
|      [ ok ] clock     2026-09-21 17:00Z                                        |
|      [ ok ] uplink    v0.1.0, contract 1.0, 38 ms                              |
|      [ ok ] session   transient                                                |
|      transient 4F2A registered. clearance: none. type help.                    |
|      // neighbors: picket-01 to picket-06 do not answer.                       |
|      4f2a@zerojance ~ $ help                                                   |
|      commands                                                                  |
|        help [command]       list commands, or explain one                      |
|      ...                                                                       |
|                                                                                |
|      4f2a@zerojance ~ $ |                     <- input row, focus outline 2px   |
+--------------------------------------------------------------------------------+
```

### 4.2 Wireframe, compact (390 x 844)
```
+--------------------------------+
| (o) ZEROJANCE  uplink ok T+00:41|  rail 36px
+--------------------------------+
| [ ok ] display   390x844       |
| [ ok ] motion    full          |
| [ ok ] clock     2026-09-21 17:|
|        00Z                     |
| [ ok ] uplink    v0.1.0, contra|
|        ct 1.0, 38 ms           |
| ...                            |
| 4f2a@zerojance ~ $ help        |
| ...                            |
|                                |
| [help] [about] [agents]        |  chips, 44px tall, only on touch or compact
| [guestbook] [status]           |
| 4f2a@zerojance ~ $ |           |  input row
+--------------------------------+
```
(Wrapping is `pre-wrap` with `overflow-wrap: anywhere`; the example shows how long lines break, it is not a design of its own.)

### 4.3 Chips
- Present when `(pointer: coarse)` or compact width; absent (not just hidden) otherwise, so keyboard users never tab through them on desktop.
- Five buttons in this order: `help`, `about`, `agents`, `guestbook`, `status`. Each is `<button type="button">`; its visible text is the command; pressing it does exactly what typing that command and pressing Enter does (the echo line appears in the log, the command runs). No new capability.
- Style: `--zj-fg-accent` text on `--zj-bg-raised`, 1px `--zj-border-control`, radius `--zj-radius`, min height `--zj-tap-min`, min width 44px, padding `0 --zj-space-3`, gap `--zj-space-2`, `flex-wrap: wrap`. Pressed: `--zj-fg-on-accent` on `--zj-fg-accent`.
- On touch devices, pressing a chip must not focus the input (that would open the keyboard). On desktop (fine pointer) chips are absent.

## 5. Boot sequence (first visit in this browser session)

### 5.1 Steps
At mount (t = 0 ms, measured from React mounting the terminal):
1. Start both requests in parallel: `GET /api/health` and `GET /api/auth/me`, each with a 3000 ms timeout (boot only; commands use the client's 8 s). Record start with `performance.now()` for each.
2. Print the boot lines in order, one at a time, by the schedule in 5.3.
3. When both requests have settled and all lines are printed, print the registration banner (5.4). Mark boot done, store the "seen" flag (5.6), enable `aria-live="polite"` on the log, and announce once in `#boot-status`: `ZEROJANCE ready. Type help.`
- The input is live from t = 0 (the engine's `autoFocus` on fine pointers; none on coarse pointers). Boot never blocks typing.

### 5.2 Lines (exact)
Format: `{tag} {label}{value}` with the tag as in D4 2.2, then one space, the label padded to 10 characters (label plus spaces), then the value. Each line is first shown in its `[ .. ]` form, then rewritten in place to its result.

| # | Pending text (`[ .. ]`, typed) | Ok text |
|---|---|---|
| 1 | `[ .. ] display   {w}x{h}` | `[ ok ] display   {w}x{h}` |
| 2 | `[ .. ] motion    {full\|reduced}` | `[ ok ] motion    {full\|reduced}` |
| 3 | `[ .. ] clock     {YYYY-MM-DD HH:MMZ}` | `[ ok ] clock     {YYYY-MM-DD HH:MMZ}` |
| 4 | `[ .. ] uplink    asking /api/health` | `[ ok ] uplink    v{version}, contract {contract}, {ms} ms` |
| 5 | `[ .. ] session   asking /api/auth/me` | `[ ok ] session   {transient\|operator}` |

Variables: `{w}x{h}` is `innerWidth` by `innerHeight` rounded; `motion` is `reduced` when `prefers-reduced-motion: reduce` matches, else `full`; the clock is the client clock formatted like D4's `{stamp}` (ISO string characters 0-9 and 11-15, then `Z`); `{ms}` as in D4 2.3. `version` and `contract` are the health response values, capped at 32 characters.

Non-ok forms for lines 4 and 5:
| Condition | Line |
|---|---|
| Health `status` ok, `{ms}` under 1000 | ok form above |
| Health ok, `{ms}` 1000 or more | `[warn] uplink    v{version}, contract {contract}, {ms} ms (slow)` |
| HTTP 503 (`unavailable`) | `[warn] uplink    up, but its database is not (503)` |
| Network error | `[fail] uplink    no route` |
| Timeout at 3000 ms | `[fail] uplink    no answer in 3 s` |
| Any other HTTP error, or a response that is not the contract's JSON | `[fail] uplink    noise` |
| `auth/me` ok with `user` null | `[ ok ] session   transient` |
| `auth/me` ok with `user` | `[ ok ] session   operator` |
| `auth/me` any failure (same forms as the uplink) | `[fail] session   unknown` |

`[ .. ]` is `--zj-fg-dim`, `[ ok ]` `--zj-fg-ok`, `[warn]` `--zj-fg-warn`, `[fail]` `--zj-fg-fault`. Boot lines are plain `output` lines (no fault block); only the tag is colored. Values stay `--zj-fg`. A failed line still prints; boot always completes.

### 5.3 Schedule (typical first visit, times after mount)
| Time | Event |
|---|---|
| 0 ms | Requests start. `ZEROJANCE` is already on screen from first paint (3.1); the static `pre` is replaced by the terminal with the title line `ZEROJANCE` (`--zj-text-xl`, bold, tracked) in the same place, so nothing moves |
| 200 ms | Line 1 begins typing at `--zj-dur-type-char` (14 ms per character) |
| after each line finishes typing | Wait `--zj-dur-boot-line` (60 ms), then start the next line. A line is rewritten to its result at the moment its own typing ends if its check is settled (lines 1 to 3 always; 4 and 5 if the response is in), otherwise as soon as the response arrives |
| about 2.5 s | Line 5 finishes typing (about 2114 ms of typing plus 240 ms of gaps plus the 200 ms lead-in) |
| line 5 resolved | Wait 200 ms, then print the banner lines (5.4), one per 60 ms |
| typical total | About 2.9 s |
| worst case | The 3000 ms request timeout settles both checks by 3.0 s of wall time; the banner follows. Hard ceiling `--zj-dur-boot-max` (5000 ms): at 5000 ms after mount everything not yet shown is shown in its final form, immediately |

### 5.4 Banner (exact)
Printed after the boot lines, following one blank line:
| Situation | Lines |
|---|---|
| Uplink and session ok, transient | `transient {ID} registered. clearance: none. type help.` then `// neighbors: picket-01 to picket-06 do not answer.` |
| Session `operator` (cookie still valid) | `operator session resumed. clearance: operator. type help.` then `// neighbors: picket-01 to picket-06 do not answer.` |
| Uplink failed | `transient {ID} registered offline. clearance: unknown.` then `// operating on cached self. the ledger is out of reach.` |
| Uplink ok, session failed | `transient {ID} registered. clearance: unknown. type help.` then `// neighbors: picket-01 to picket-06 do not answer.` |
`{ID}` is the 4-character uppercase id from D4 2.3. The first banner line is `output`, the second `system` (commentary). The prompt after boot is per D4 2.4 (operator prompt when session is `operator`).

### 5.5 Skip
- **Any key** (except a lone Shift, Ctrl, Alt, or Meta press) or **any pointer press or tap** on the page finalizes the boot immediately: all typed lines are shown in their final text, no waiting on pacing.
- The skipping key is not consumed: if it is printable and the input has focus, it lands in the input as usual. Nothing typed is ever lost.
- Network results keep updating in place: a line whose response has not arrived stays `[ .. ]` and is rewritten when it settles (or fails at 3000 ms). The banner prints when both requests have settled, because it states clearance. Until then the session state is `unknown` (D4 2.6: unknown state sends `diagnostics` and `guestbook rm` to the server).
- Skipping is not a mode: there is no "skipped" line and no penalty.

### 5.6 Returning visitor (same browser session)
- The flag is a single `sessionStorage` entry: key `zj.boot`, value `1`, set when boot finishes or is skipped. Wrap every read and write in try/catch; if storage is blocked or throws, behave as a first visit every time.
- Short boot: only lines 4 and 5 (uplink, session), printed whole (no typing) 60 ms apart, starting at 60 ms, followed by the banner from 5.4 once both have settled. Animation budget `--zj-dur-reconnect` (1200 ms); network time is not part of it.
- Any key or tap skips it exactly as in 5.5.

### 5.7 Reduced motion
When `prefers-reduced-motion: reduce` matches (evaluated once at mount and on change):
- No typing and no pacing delays: lines 1 to 3 appear in final form at once. Lines 4 and 5 appear as `[ .. ]` immediately and are rewritten the instant their responses arrive (that is a state update, not an animation). The banner prints when both settle.
- The title line, cursor, and sweep are static (E1, E4). Nothing waits on a timer except the network.
- The same content is printed, in the same order, so a screen reader and a sighted user see the same log.

### 5.8 Accessibility of boot
- While boot animates, the log has `aria-live="off"` and `aria-busy="true"`. When boot is done (or skipped and settled) the log switches to `aria-live="polite"` and `#boot-status` announces `ZEROJANCE ready. Type help.` once (or `ZEROJANCE ready offline. Type help.` when the uplink failed).
- Boot content is real text in the log, so it can be read by navigating the log; it is just not announced line by line.

## 6. Rail

Exact strings (text nodes):
| Segment | Values |
|---|---|
| Name | `ZEROJANCE` |
| Uplink | `uplink ...` (before the first health result), `uplink ok`, `uplink slow`, `uplink degraded`, `uplink down` |
| Clock | `T+MM:SS` (`T+H:MM:SS` from one hour); with reduced motion `T+{m} min` |
| Clearance | `clearance: none`, `clearance: operator`, `clearance: unknown` |

Uplink state from the latest health signal (boot, `status`, any server-backed command's outcome, and the poll in 12):
| State | When | Word | Sweep color | Sweep motion |
|---|---|---|---|---|
| ok | 2xx `status: ok` under 1000 ms | `uplink ok` | `--zj-sweep-ok` | turns, `--zj-sweep-period-ok` |
| slow | 2xx ok but 1000 ms or more | `uplink slow` | `--zj-sweep-slow` | turns, `--zj-sweep-period-slow` |
| degraded | 503 `unavailable` | `uplink degraded` | `--zj-sweep-slow` | turns, `--zj-sweep-period-slow` |
| down | network error, timeout, or non-contract response | `uplink down` | `--zj-sweep-down` | stopped |
| unknown | no result yet | `uplink ...` | `--zj-fg-dim` | stopped |
The rail's uplink word takes the same color as the sweep (`--zj-fg-ok`, `--zj-fg-warn`, `--zj-fg-fault`, `--zj-fg-dim`). Operator: clearance segment text is `--zj-fg-accent` and a 4px `--zj-hazard-tape` strip runs along the rail's bottom edge and above the input row (D2 rule: never behind text).
The concept's "stutters when slow" is implemented as "turns slower" (the 9 s period); it is cheaper and unambiguous.

## 7. Session and prompt changes
| Event | Change |
|---|---|
| Login `200` | Prompt to `operator@zerojance ~ #`; rail clearance to `clearance: operator`; hazard strips appear (instant, or `--zj-dur-base` opacity fade when motion is allowed) |
| Logout `204`, or any 401 | Prompt to `{id}@zerojance ~ $`; clearance to `none`; strips removed instantly |
| Command in flight (engine `busy`) | The prompt's last character (`$` or `#`) is replaced by `…`; if it is still busy after 1500 ms, print once `// waiting on the uplink. ctrl+c cancels.` |
| Slow or failed server command | Update the uplink state as in section 6 from that call's outcome |

## 8. States
| State | What the visitor sees |
|---|---|
| Before JS | `ZEROJANCE` and a blinking block (or the `noscript` text) on ink |
| Booting | Lines typing; rail shows `uplink ...`; input live |
| Ready | Banner, prompt, cursor |
| Empty log (after `clear`) | Empty log, then D4's `// screen cleared. the ledger is untouched.`; prompt stays |
| Loading | Section 7, in-flight row |
| API offline | Rail `uplink down` (vermilion, sweep stopped); boot fail lines; server commands print D4 section 4 lines; static commands (`help`, `about`, `agents`, `build`, `clear`, `whoami` local block) still work |
| Error output | D4 fault blocks; arrival effect E5 |
| Operator | Section 7 |

## 9. Keyboard and focus
- Focus starts in the command input on fine-pointer devices. On coarse-pointer devices nothing is focused on load (the keyboard opens when the visitor taps the prompt row).
- Tab order: skip link, log (`tabindex="0"`, arrow and page keys scroll it), input, then chips if present. The skip link is off-screen until focused, then shown top-left (`--zj-fg-on-accent` on `--zj-fg-accent`, `--zj-z-skiplink`), and moves focus to the input.
- In the input: Enter runs; Up/Down history; Ctrl+L clear; Ctrl+C cancel a running command or masked prompt; Escape cancels a masked prompt; PageUp/PageDown scroll the log by a screen (the engine's F6 addition). Any key skips boot (5.5).
- Click or tap anywhere in the terminal focuses the input, unless text is selected or the device is coarse-pointer and the tap was on the log (do not pop the keyboard when scrolling).
- Focus is never lost: after a command finishes focus stays in the input; after the masked prompt closes focus returns to the command input (the engine does this).
- Focus indicator: 2px solid `--zj-focus-ring` with `--zj-focus-offset` 2px on every focusable element, including the input row via `:focus-within`. No `outline: none` without this replacement. Focus rings do not animate.
- Mobile keyboard: the viewport meta has `interactive-widget=resizes-content`; also listen to `visualViewport` `resize` while the input is focused and call `scrollIntoView({block: "end"})` on the input row (instant) so it stays above the keyboard on iOS.
- Screen readers: log announces new output politely once boot is done; the uplink segment announces changes; `TRANSIENT-{id}` and the clock are not announced.
- Zoom: 200% zoom and 320px width must not scroll horizontally.

## 10. Effects catalog

Every effect: trigger, values, reduced-motion fallback, cost. Only `transform`, `opacity`, and `color` animate. Nothing else animates. Every CSS animation is inside `@media (prefers-reduced-motion: no-preference)`; the JS-driven ones check `matchMedia`.

| ID | Effect | Trigger | Duration and easing | Reduced-motion fallback | CPU cost |
|---|---|---|---|---|---|
| E1 | First-paint cursor blink (`█` in the static HTML) | Page load, until React mounts | `--zj-cursor-period` (1060 ms) `--zj-ease-step`, infinite, `visibility` toggle | Solid block, no blink | Negligible; one element, ends at mount |
| E2 | Boot typing | Boot lines 1 to 5 (first visit) | 14 ms per char (`--zj-dur-type-char`), 60 ms line gap (`--zj-dur-boot-line`), ceiling 5000 ms | Final text immediately (5.7) | Low; batched timer, about 150 characters total; use one timer, not one per line |
| E3 | Tag resolve `[ .. ]` to `[ ok ]`/`[warn]`/`[fail]` | The check settles | Instant text swap; tag color changes with `--zj-dur-fast` `--zj-ease-in-out` | Instant | Negligible |
| E4 | Rail sweep rotation | Always, driven by uplink state (section 6) | `transform: rotate(360deg)` on `#sweep`, `--zj-sweep-period-ok` (4 s) or `-slow` (9 s), `--zj-ease-linear`, infinite; color change `--zj-dur-slow` `--zj-ease-in-out`; `will-change: transform` on this element only | No rotation: static glyph at 0 degrees, color still shows state; rail text carries the same info | Low; one 20px composited layer; pauses with the tab |
| E5 | Fault block arrival | An `error`-kind `[fail]` line is inserted | Background from `--zj-bg` to `--zj-bg-fault` and left border from transparent to `--zj-fg-fault`, `--zj-dur-slow` `--zj-ease-out`, once | Instant final state | Negligible; paint only |
| E6 | Chip press | `:active` on a chip | Fill flips to amber, `--zj-dur-fast` `--zj-ease-out` | Fill flips instantly (state change, not motion) | Negligible |
| E7 | Operator strip and clearance change | Login | Strip opacity 0 to 1, `--zj-dur-base` `--zj-ease-out`, once | Instant | Negligible |
| E8 | Clock tick | Every second | Text change only, `aria-hidden` | Updates once a minute as `T+{m} min` | Negligible; one interval, cleared on unmount |

Deliberately absent: scanlines, CRT curvature or vignette, noise, glow, `text-shadow`, chromatic aberration, screen shake, ambient glitch, parallax, character rain, particles, audio. New output lines appear instantly (no fade). Scrolling to new output is instant (`scroll-behavior: auto`).
Total animated elements in steady state: one (the sweep). No canvas, no `requestAnimationFrame` loop, no work while the tab is hidden other than the poll.

## 11. Acceptance checks for F5 (each should be a test where feasible)
1. `index.html` has the exact first-paint markup (3.1), a real `<title>ZEROJANCE</title>`, no inline `<script>` or `style=""`, and `dist/index.html` still has no inline script.
2. Landmarks: exactly one `banner`, one `main`, one `navigation` (when chips render); log has `role="log"`; skip link moves focus to the input.
3. Boot: with mocked fetch, lines 1 to 5 appear with the exact strings in 5.2 for ok, slow, 503, network error, timeout, and noise; banner strings match 5.4 for each situation.
4. Any keydown (not lone modifier) and any pointerdown finalize the boot; the pressed printable character reaches the input.
5. Reduced motion: with `matchMedia` mocked to `reduce`, lines 1 to 3 are present immediately, no timers are used for typing, the sweep has no animation class, the clock shows `T+{m} min`.
6. `sessionStorage` throwing does not break boot (treated as first visit).
7. Rail strings and states match section 6; uplink `role="status"` text changes on a failed `status` command.
8. Login and logout change the prompt, clearance segment, and strips per section 7.
9. No network requests other than same-origin `/api/*`; no external fonts or images; JS under the 250 kB gzip budget.
10. Manual: 320, 390, 768, 1280 px and 200% zoom show no horizontal scroll; the input row stays above the mobile keyboard.

## 12. App constants (not tokens)
| Constant | Value |
|---|---|
| Boot request timeout | 3000 ms |
| Command request timeout | 8000 ms (client API layer) |
| Slow threshold (uplink) | 1000 ms |
| Health poll | every 30 s while `document.visibilityState === "visible"`; none when hidden; first poll 30 s after boot. It updates only the rail's uplink state (a real reading). If the Architect judges this not worth its complexity, drop it: the rail then updates only on boot, `status`, and command outcomes, with no other change to this spec |
| Slow-command notice | 1500 ms |
| Boot flag | `sessionStorage` key `zj.boot`, value `1` |
| Boot animation ceiling | 5000 ms (`--zj-dur-boot-max`); reconnect 1200 ms (`--zj-dur-reconnect`) |

## 13. Not covered here
Command text and errors (D4), the easter eggs (D5), review of the built site (D6). Verification: docs only. Not verified: rendered appearance and timing in a browser (D6); the typing-time arithmetic in 5.3 (150 characters at 14 ms plus gaps) was computed by hand from the exact strings.

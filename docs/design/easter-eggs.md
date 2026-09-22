# ZeroJance Easter Eggs and Guessed-Command Quips (D5, MVP)

Owner: Creative Director. Task D5 (`feat/design-eggs`). Builds on `concept.md` (world, session zero), `terminal-commands.md` (D4: the 11 visible commands, the 3 hidden slots, and the unknown-command path), and `screens.md` (D3: effects, fault styling). See `backlog.md` for everything deferred past the MVP.

All content here is client-side only: no API calls, no new endpoints, no external assets, nothing that could be mistaken for a real system capability. Both eggs are marked fiction (`// `) wherever they touch session zero, per concept rule 5 ("withheld beats pretending") and rule 1 ("the station does not lie about readings").

---

## 1. Inventory against the 3 hidden slots

`terminal-commands.md` section 1 reserves up to 3 hidden command slots and a small quip table inside the unknown-command path. This spec uses:

| Slot | Use | Registered command? | Counts toward the 14-command cap? |
|---|---|---|---|
| 1 | `ask` — Egg 1 | Yes, hidden (omitted from `help` and the registry's public listing surface) | Yes (12th command) |
| 2 | `whoami --deep` — Egg 2 (a flag on the existing `whoami`, not a new command) | No, it's a flag on an existing command | No |
| 3 | Reserved, unused in the MVP | — | — |

Total registered commands after D5: 12 of 14. One hidden slot is deliberately left unused (see 6 "What I left out").

## 2. Rules for both eggs (concept rules 1, 3, 5, 7)

1. **Harmless.** Neither egg mutates state, sends anything to the server, or affects any other visitor. Neither can be used to spam, deface, or annoy (no repeatable side effect, nothing that fills the log).
2. **No fake capability.** Neither claims to hack, scan, or access anything real. Both stay inside the "report, don't perform" voice (concept 4.2).
3. **Discoverable without being advertised.** Neither appears in `help` output or the chip bar. Both are reachable by a visitor who explores, and by anyone who reads this file or the site's future changelog.
4. **Marked fiction where it is fiction.** Any claim about session zero, the name, or the station's inner life is a `// ` line. The one real reading inside Egg 2 (`activeSessions`, already public in this form? — no, checked below) stays real or is dropped.
5. **A day of frontend work each.** Both are pure string/output logic reusing the existing command and output pipeline; neither needs new UI, new styling beyond existing tags, or new state beyond a counter already needed elsewhere.

## 3. Egg 1: `ask` (a question, answered once)

### 3.1 Why this egg
`concept.md` 2.1 frames session zero as "the station has never told anyone about it directly." The natural discovery action for a mystery framed as an untold thing is to ask about it directly — most visitors try `whoami`, `sudo`, or typing questions at some point (concept 5, the 55-60s window). `ask` rewards that instinct with the station's one and only direct word on the subject, then closes the door again. This is the fragment concept.md 2.5 calls for: "each reveals one small fragment; neither explains it."

### 3.2 Command
- Name: `ask`. Hidden: not in `help`, not in the chip bar, not in `terminal-commands.md` section 5.13's registry table (it is registered separately in a small `easterEggs` module per section 5 below, not the main command list).
- Usage: `ask <anything>`. The argument text is read but never echoed, never sent anywhere, and never validated — it exists only so the visitor feels heard. (Concept rule 6, visitor text inert: since the argument is discarded rather than displayed, there is nothing to sanitize or render; this is stricter than "inert," it is "unused.")
- With no argument (`ask` alone): `[fail] usage: ask <anything>` then `       for example: ask what happened`. This line only appears once discovery starts (see 3.4); it does not leak the command's existence to a visitor who has not tried it.

### 3.3 Output (exact, first successful use in this session)
```
// a question, logged.
// session zero does not answer questions. it never has.
// the closest thing to an answer: the log for that session
// opens and does not close. every other session on this
// station closes. that is the only fact.
```
All four lines are `system` kind (`// `, `--zj-fg-dim`), matching the fault-free, ordinary commentary style — no `[fail]`/`[warn]` tag, no fault block, because nothing failed. This keeps it from reading as an error or a secret unlocked with fanfare (concept: no "Access Granted!" theatrics).

### 3.4 Repeat use (same page load)
Second and later `ask` in the same session:
```
// asked and answered. the log does not repeat itself.
```
One line, `system`. This uses a counter already needed for nothing else new: a single boolean in the terminal's existing session-scoped state (not `sessionStorage`; resets on reload, same lifetime as the transient id). No visible side effect beyond the line, so it cannot be farmed or spammed for effect.

### 3.5 Discoverability hint
No hint is placed in any visible copy (that would make it not-hidden). The discovery path is organic, matching concept 5's 55-60s window ("visitor tries something... the station has a dry answer for a few likely guesses"): a visitor who types `ask` because they are frustrated at the mystery, or who tries it after reading `status`'s neighbor line or `diagnostics`'s "session zero: not counted" line, finds it on the first try. `help` output plants the only in-product nudge indirectly, by never mentioning it: the gap between "eleven commands are documented" and "the mystery is never explained" is the hint.
For a public but still-soft hint outside the product (site changelog, resume talking point, or a future `about`/`build` line), the suggested one-liner is: `// some questions are answered here. some aren't.` (D4/D3 owners may add this to `about` in a later, additive change; not part of this MVP).

## 4. Egg 2: `whoami --deep`

### 4.1 Why this egg
`whoami` (D4 5.8) already prints an honest "seen from here" block and ends with "the station does not send or store any of it." That line is a promise. `--deep` is the reward for a visitor who doubts the promise and wants to see the station push further, while proving the promise still holds: it adds two more locally-read facts and repeats the closing line unchanged. This uses the concept's honesty rule (1) and the security-awareness point already noted in `concept.md` 8.1 ("it shows the picket's honesty and makes a security-awareness point").

### 4.2 Command
- A hidden flag on the existing `whoami` command, not a new registry entry, so it costs nothing against the 14-command cap. `whoami --deep` (also accepts `whoami -d` as a short form).
- Not listed in `help whoami` (D4 5.12's `help whoami` block is unchanged).
- All values are read the same way as the base `whoami` block: `try { ... } catch { return "[unavailable]" }` around each read, matching D3/D4's existing pattern.

### 4.3 Output (exact)
Runs the ordinary `whoami` block first (D4 5.8, unchanged, including the six "seen from here" lines and its closing `// ` line), then two more lines appended under the same "seen from here" heading, before the existing closing line:
```
  pointer    {coarse|fine}
  storage    {available|blocked}
```
Full block for a transient with `--deep`, ok case:
```
TRANSIENT-{id}
  clearance  none
  session    none
seen from here
  language   {navigator.language}
  timezone   {Intl.DateTimeFormat().resolvedOptions().timeZone}
  viewport   {innerWidth}x{innerHeight}
  color      {dark|light}
  motion     {full|reduced}
  contrast   {standard|more}
  pointer    {coarse|fine}
  storage    {available|blocked}
// read in this browser. the station does not send or store any of it.
```
Then one more line, `system`, only with `--deep`:
```
// deeper, not different. a page can always read this much.
```
Mapping: `pointer` from `matchMedia("(pointer: coarse)")`; `storage` from attempting a `sessionStorage` write/read/remove of a throwaway key inside try/catch (`available` on success, `blocked` on any throw — this doubles as the same probe `screens.md` 5.6 already needs for the boot flag, so it is not new logic, just a value the visitor can also ask to see).
No new claim beyond what plain `whoami` already promised: the closing "does not send or store" line is unchanged, and it stays true because these two extra reads are local-only exactly like the other six.

### 4.4 Failure / edge cases
- `whoami --deep` while the uplink is down: identical to plain `whoami`'s "uplink lost" case (D4 5.8), with the two extra lines and the `--deep` closing line still appended after the transient block, since they never touch the network.
- Unknown flag other than `--deep`/`-d`: treated as an unrecognized flag on `whoami`, which D4 does not otherwise define; the simplest consistent behavior is to ignore unknown flags and run plain `whoami` (no error), so a curious visitor never gets punished for guessing wrong. This matches concept rule 3 ("nothing is aimed at anyone") in spirit: exploration is never penalized.

## 5. Guessed-command quips (unknown-command path, D4 section 1 and section 3)

`terminal-commands.md` reserves a "small quip table owned by D5 inside the unknown-command path" for common shell commands a visitor might reasonably try. These are not commands (no entry in the registry, not counted against the cap, never listed anywhere) — they are alternate replies from the same `unknownCommand(name)` message, matched by exact lowercase name before falling back to the generic D4 3 string. Match is case-insensitive on the command word only (first token), ignoring any arguments.

| Typed | Reply (kind `error`, same styling as `unknownCommand`) |
|---|---|
| `sudo` | `[fail] this station has one operator, and you are not it. login <username> if you have a key.` |
| `ls` | `[fail] nothing to list here. try help.` |
| `pwd` | `[fail] you are at zerojance, watching the net. try status.` |
| `cat` | `[fail] there is nothing to read that guestbook and about do not already show you.` |
| `rm` | `[fail] the only thing you can remove here is your own mark, and only the operator can. try guestbook.` |
| `hack` | `[fail] this station does not hack anything. try status.` |
| `exit` / `quit` | `[fail] there is no session to end here except your own. try logout.` |
| `man` | `[fail] no manual. try help.` |

Every reply ends with a real, working suggestion (a command that exists), so a visitor who guesses wrong is always handed a next step, never just told "no" (concept: withhold beats pretending, and the station is "on the visitor's side"). None of these lines break the D4 rule that visitor input never starts a line as itself (the typed word never appears verbatim in the reply, so there is no risk of it imitating a tag).
This table lives beside `unknownCommand` in the same content module (`apps/web/src/content/`), not inside the terminal engine, matching the engine's existing "no site copy in the engine" rule (`terminal/types.ts`).

## 6. What I left out, and why

- **The third hidden slot.** Two eggs plus the quip table already meet the board's "two MVP easter eggs" requirement and the one-hidden-command budget is enough; adding a third now would be decoration for its own sake rather than serving session zero, and would eat into the 14-command cap for no clear payoff. It stays reserved for Phase 2 (see `backlog.md`).
- **Any egg that changes what other visitors see.** A "wall" of past questions asked via `ask`, or a public counter of how many people tried it, needs server state and a new endpoint; that is Phase 2 territory (backlog), not an MVP easter egg.
- **A visual/animated reveal for either egg.** Both use only existing tag/line styling from D2/D3 (plain `system` lines, the `[fail]` tag already defined). No new effect, no new token, no new CSS: this keeps each egg inside "a day of frontend work" and inside D3's effects catalog (no new row needed).
- **Tying the eggs to `guestbook` content.** Letting a visitor's guestbook message trigger an egg (e.g. a signed mark containing "session zero") was considered and rejected: guestbook text is public, stored, and machine-read (contract section 1's prompt-injection note), so building egg logic that reacts to arbitrary stored visitor text is a bad precedent even if harmless today. Session-zero content stays entirely in commands, never in data.

## 7. Acceptance checks for F4/F6

1. `ask` with no argument prints the usage line; with any argument prints the 4-line fragment (3.3) once, then the repeat line (3.4) on every later call in the same page load; a reload resets it to first-use.
2. `ask` never appears in `help` output, the registry's public command list, or the chip bar.
3. `whoami --deep` and `whoami -d` both print the 8-line "seen from here" block plus the `--deep` closing line; plain `whoami` is byte-for-byte unchanged from D4 5.8.
4. `whoami --deep` makes no network request beyond what plain `whoami` already makes (none) — a test can assert the mocked `fetch`/api client sees no extra calls for the two new fields.
5. Each quip in section 5 matches only its exact first token (case-insensitive) and falls through to the generic `unknownCommand` string for anything else, including `sudo rm` (matches `sudo`, since match is on the first token) and `lsblk` (does NOT match `ls`, since match is exact, not prefix).
6. No test or code prints the raw argument text passed to `ask`.

## 8. Not covered here
Ranked Phase 2+ backlog: `backlog.md`. Review of the built site: D6.

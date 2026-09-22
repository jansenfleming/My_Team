# Concept and Voice: ZeroJance

Owner: Creative Director. Task D1 (`feat/design-concept`), amended by `feat/design-rename`: the site was renamed from PICKET-07 to ZeroJance (terminal form `ZEROJANCE`) at the owner's choice; see section 2.1a. Status: for Architect review.
Inputs: `docs/project-brief.md`, `docs/architecture/roadmap.md` (MVP scope), `api-contract.md` (what the terminal can call).
Downstream: D2 (tokens), D3 (boot/layout/motion), D4 (commands), D5 (easter eggs) all build on this file. Where a later spec disagrees with this file, ask the Creative Director; do not guess.

Personal facts: the only confirmed fact is that the owner is Jansen Fleming. Everything else about the owner appears as `[PLACEHOLDER: ...]`. The lore below is fiction about a fictional station and is not a claim about the owner.

---

## 1. The pitch

The site is not a portfolio dressed in neon. It is **ZeroJance**, one surviving node of an early-warning network: a small, old, over-patched defensive system that stands at the edge of the net, watches who comes in, and keeps a record. The visitor arrives as an unregistered **transient**. The system is polite, dry, exact, and slightly tired. The owner, Jansen Fleming, is **the operator**: the one person who can unlock the back room, and the person the station's dossier is about.

What makes it feel like a real system rather than a skin: **nothing on screen is decorative telemetry.** Every line that looks like a system reading is a real reading (real health call, real latency, real session, real guestbook). The fiction lives in the margins, in a clearly marked commentary voice. That honesty is also the resume point: this is an actual working system, and it never fakes being one.

---

## 2. The world

### 2.1 Premise (the lore, kept short on purpose)

- A *picket* is a sentry outpost placed ahead of the main body so trouble is seen early. Radar pickets were the first thing to see the enemy and the last thing anyone remembered.
- The network had seven pickets. **PICKET-01 to PICKET-06 no longer answer.** The station logs this as "unremarkable". It is remarkable, and the station knows it.
- **ZeroJance** still stands. Its serial is picket-07 (lore only, never a UI label). Its name is the standard it was built to meet: *zero vigilance lapse*, contracted by the crew and never spelled out again. The station keeps a log that agrees with its name in every entry but one.
- Five automated **watchstanders** keep the watch (the five AI agents that build and run this project; see 2.4). One human, **the operator**, holds the only key. The station has never been shown a second one.
- **The open case:** the station's own log contains one session that was opened and never closed, with no known origin: **session zero**. It is the only entry that breaks the station's own name. The station has never told anyone about it directly and has never filed it as a lapse. It surfaces as small anomalies in the margins (see 2.5). It is the site's standing mystery and the reason to come back.

### 2.1a Name: ZeroJance (renamed from PICKET-07)

- **The name.** The owner chose it. Prose form `ZeroJance`; terminal and tag form `ZEROJANCE` (tab title, status rail, first-paint HTML, banners); prompt host `zerojance` (`4f2a@zerojance ~ $`). Nine letters.
- **Meaning.** The owner did not supply one, so none is claimed. The lore above (zero vigilance lapse) is fiction about the fictional station, invented here as flavor: "zero" pairs with session zero, and the ending echoes *vigilance* and *surveillance*. It is never stated as the owner's meaning, and the site copy does not explain the name at all; at most the `about` dossier or an egg may use the two-word gloss "zero lapse" as station lore.
- **What changed in the lore (small):** the station name is ZeroJance with serial picket-07; the neighbors keep their names (picket-01 to picket-06, still silent); "the picket" as a speaker is now "the station"; session zero is now framed as the one entry that violates the station's own name. The rules, voice, palette, and scope are unchanged.
- **No outside references.** No film, novel, franchise, or brand names appear anywhere in user-facing copy.
- **Collision check (2026-09-21):** one web search for the exact name found no product, company, or tool called ZeroJance or ZEROJANCE. The nearest hit was a music artist named "ZeroJane" (different spelling). Not checked: trademark registries, domain availability, GitHub or package-registry names, social handles. Not a reason to change the name, but check the domain and handle before publishing.

### 2.2 Glossary (world term = product feature)

| World term | Means | Notes for D4/D3 |
|---|---|---|
| ZeroJance / ZEROJANCE / the station | The site | Tab title: `ZEROJANCE` (terminal form; prose form is ZeroJance). Prompt host: `zerojance`. Serial `picket-07` appears only as lore (the `about` dossier or an egg), never as a UI label. |
| picket | The class of node (sentry outpost) | Neighbors are `picket-01` to `picket-06`. |
| transient | Anonymous visitor | Assigned `TRANSIENT-XXXX` (4 hex chars, random per page load, client-side only, never sent anywhere). |
| operator | The owner (single login) | Login unlocks operator commands. Clearance has exactly two levels in MVP: `transient`, `operator`. |
| the ledger | The guestbook | A "mark" is one entry; "leave a mark" is signing. The command stays `guestbook` for discoverability; `ledger` may be an alias (D4 decides). |
| the dossier | `about` | Reads like an intake file, with placeholders. |
| watchstanders | The five AI agents | `agents` command. |
| the uplink | The connection to the API | Real `GET /api/health` result. Drives the status rail. |
| the back room | Operator-only commands | `guestbook rm`, `diagnostics`. |
| session zero | The mystery | Never explained in the MVP. |
| commentary / margin | Lines starting `// ` | The station's own voice. Always fiction or opinion, never a reading. |

### 2.3 Rules of the world

These are hard rules. They are what makes it coherent, and D2-D5 must obey them.

1. **The station does not lie about readings.** A line that looks like data (latency, version, counts, uptime, time, session, guestbook entries) is real, from the real API or the real browser. Made-up numbers are banned. Boot checks are only things the page really does.
2. **Commentary is marked.** Anything the station says as itself, including lore and jokes, starts with `// ` and is styled as commentary (slate, see 3.1). Data left, voice in the margin. A reader can always tell which is which.
3. **Nothing is aimed at anyone.** No scanning, no fake attack sequences, no "hacking" of named hosts or real-looking IPs. The station only watches and defends. (Reasons: safety, the brief's authorized-testing rule, and it is a cliche.)
4. **The only locked door is a real one.** Operator access is real authentication (contract section 3). No fake locks, no joke passwords that pretend to be the operator's.
5. **Withheld beats pretending.** When the station will not or cannot say something it says so: `[withheld]`, `[PLACEHOLDER: ...]`, or `// not for transients.` It never acts as if the thing does not exist.
6. **Visitor text is inert.** Whatever a visitor types or signs is data, printed as plain text, never interpreted (contract section 1). The station may joke about it; it never executes it.
7. **Effects are diegetic.** An effect exists only if the system would plausibly do it (a sweep that reflects uplink state, a fault that reflects a real failure). No full-screen decoration.

### 2.4 The watchstanders (static copy for `agents`)

The five agents are real: they build and maintain this project, and all run on Claude Sonnet 5 (owner brief). In-world they are the watch. Duty lines are accurate to their actual roles; the tone is the station's.

| Watchstander | Station | Duty line (draft; D4 finalizes exact strings) |
|---|---|---|
| ARCHITECT | chart room | Plans the watch, keeps the log straight, decides what ships. |
| CREATIVE DIRECTOR | signal room | Decides how the station looks, sounds, and misbehaves. |
| FRONTEND ENGINEER | deck | Builds what you are looking at. |
| BACKEND ENGINEER | engine room | Keeps the ledger, the doors, and the uplink running. |
| SECURITY / QA ENGINEER | armory | Assumes everything is hostile, including the other four. Signs off nothing it wrote. |

Rule: the last line reflects a real project rule (QA never approves its own fixes), which keeps the joke true.

### 2.5 The mystery (seed for D5 and Phase 2)

Session zero is planted in the margins only, never as data:

- `status` and boot end with a commentary line that does not quite add up (for example `// neighbors: picket-01 to picket-06 do not answer.`).
- `diagnostics` (operator) shows the real `activeSessions` number unchanged, then a margin note: `// sessions accounted for: that many. session zero: not counted.` The number is real; only the note is fiction, and it is marked as such.
- The two MVP easter eggs (D5) each reveal one small fragment; neither explains it. One fragment may hint that session zero is the one entry that breaks the station's own name (2.1). Phase 2 missions can turn the fragments into a case file.

Deliberately unresolved in the MVP: what session zero is, who opened it, what happened to pickets 1-6. The station never explains the name or session zero as fact, and it never claims anything about the real owner. The owner may steer this later.

---

## 3. Identity in brief (provisional; D2 finalizes tokens and computed contrast)

### 3.1 Color is grammar
Six inks, each with one meaning. Nothing is colored "because neon". Provisional hexes with contrast measured against `ink` `#0B0D10` (WCAG relative luminance; D2 re-verifies every pair actually used):

| Ink | Hex | Meaning | vs `#0B0D10` |
|---|---|---|---|
| ink | `#0B0D10` | The dark. Background. Raised panel `#12161B`. | n/a |
| bone | `#DAD5C8` | Data and normal text. Warm off-white, not green, not pure white. | 13.28:1 |
| slate | `#8E97A3` | Commentary (`// ...`), timestamps, chrome. | 6.58:1 |
| amber | `#F5A524` | Attention and interaction: the prompt, focus, links, the operator. | 9.53:1 |
| verdigris | `#6FCF97` | Confirmed good: `[ ok ]`. Used sparingly. | 10.24:1 |
| vermilion | `#FF5A45` | Fault and alarm only: `[fail]`, rejected, uplink lost. | 6.30:1 |

Rules: text is always bone, slate, or one of the semantic inks on ink; no gradients as decoration; no glow/bloom on body text; vermilion is rare enough that seeing it means something. There is deliberately no cyan or magenta.

### 3.2 Type and marks
- System monospace stack only (D2 sets it), one size scale, no external fonts.
- Uppercase is reserved for identifiers and tags (`ZEROJANCE`, `TRANSIENT-4F2A`, `[ ok ]`). Prose is sentence case with no exclamation marks.
- Fixed-width status tags: `[ ok ]` `[warn]` `[fail]` `[ .. ]`.
- **Relative time.** Timestamps in the session are `T+00:41` (time since this visitor arrived), not wall-clock. It makes every session feel like its own watch and hides nothing real.
- Redaction bars `████` and `[withheld]` are the station's texture for things it will not say.
- Used-future finish: hazard-tape diagonal (amber on ink) is reserved for the operator prompt and back-room commands. It signals "restricted", so it appears nowhere else.

### 3.3 Layout idea (D3 details it)
One full-viewport terminal. A slim **status rail** on top carries: `ZEROJANCE`, the uplink state, the `T+` clock, and clearance. It is the "command center" in one line, not a dashboard screen. Next to the name sits a small **sweep** glyph: a radar arc that turns steadily when the uplink is healthy, stutters when slow, and stops and turns vermilion when the uplink is down. That is the one recurring motion on the site, and it carries information.

---

## 4. Voice guide

### 4.1 Who is speaking
A night-watch system that has been on duty for a long time. It **reports**, it does not perform. It is precise, deadpan, and courteous, with understatement doing the work where other sites use volume. It is on the visitor's side but will not flatter them. It is very slightly amused by its own situation.

### 4.2 Traits
1. **Report, do not perform.** State what happened, with numbers and ids. No hype.
2. **Deadpan.** Humor is bureaucratic understatement about odd or ominous things. It never winks at the camera.
3. **Exact.** Prefer `38 ms` over "fast", `3 marks` over "a few entries".
4. **Courteous, not servile.** Short polite forms; no "please enjoy your stay".
5. **Honest about failure.** Errors say what failed and what to try next, in-world but always clear. Never leak internals (contract: no paths, SQL, or stack traces).
6. **Withhold out loud.** If something is not available, say so and mark it.
7. **No fourth wall by accident.** It knows it is a website only in the `build`/`about` copy, where it says so plainly.

### 4.3 Conventions
- System prose: **lowercase sentence starts** (system lines begin lowercase; only identifiers, tags, and placeholders keep their case), short lines (aim under 72 characters so it wraps cleanly on mobile), no exclamation marks, no emoji. Sentences still end with a period. This refines the original "sentence case" call once D4 put strings on screen and found lowercase reads quieter and more machine-like; the Architect agreed (2026-09-22). Every exact string in `terminal-commands.md`, `screens.md`, and `easter-eggs.md` already follows this rule.
- Data lines are unprefixed. Commentary lines start with `// `.
- Addresses the visitor as **transient** in formal system lines and drops to no noun in casual ones. Never "user", "hacker", "agent", or "Neo".
- Refers to Jansen Fleming as **the operator** in system lines, and by name in the dossier.
- Banned words and moves: "hack the planet", "the Matrix", "wake up", "jack in", "cyberspace", "elite", "0-day" as a flourish, fake IPs, fake progress bars over nothing, "Access Granted!" theatrics.

### 4.4 Do / don't

| Situation | Don't (generic) | Do (ZEROJANCE) |
|---|---|---|
| Greeting | `WELCOME TO THE MATRIX, USER!` | `transient 4F2A registered. clearance: none. type help.` |
| Unknown command | `ERROR: COMMAND NOT FOUND!!` | `no such command: "hax". help lists what exists.` |
| Boot | `[ INITIALIZING QUANTUM CORE 87% ]` | `[ ok ] uplink   v0.1.0, contract 1.0, 38 ms` (real values) |
| About | `I am a passionate cybersecurity professional...` | `dossier open. subject: Jansen Fleming. role: [PLACEHOLDER: role]. rest: [withheld].` |
| Guestbook sign | `Thanks for signing my guestbook!` | `mark 12 entered. the ledger keeps it.` |
| Login fail | `ACCESS DENIED. INTRUDER ALERT!` | `credentials rejected. this was logged, as is everything.` |
| Rate limit | `Too many requests.` | `you are writing faster than the ledger can be read. retry in 47 s.` |
| Offline | `Network error.` | `uplink lost. i can still read you; i cannot reach the ledger. retry: status.` |
| Lore | `Beware, the dark web lurks!` | `// picket-01 to picket-06 do not answer. logged as unremarkable.` |
| Placeholder | `Lorem ipsum` | `[PLACEHOLDER: one-line bio]` |

### 4.5 Sample lines by situation (starting material for D3/D4; exact strings are finalized there)

- Registered: `transient 4F2A registered. clearance: none. type help.`
- Help nudge: `// type help. or do not. i log both.`
- Empty ledger: `the ledger is empty. you would be the first mark.`
- Long input rejected: `input too long. keep marks under 280 characters.`
- Login success: `credential accepted. clearance: operator. the back room is open.`
- Logout: `session closed. clearance: none.`
- Operator command as transient: `not for transients.`
- `status` closing line: `// neighbors: picket-01 to picket-06 do not answer.`
- `clear`: `screen cleared. the log is not.`
- Placeholder dossier field: `role: [PLACEHOLDER: role]`

---

## 5. The 60-second journey

Assumes a first visit on a desktop with motion allowed. Times are targets for D3 to finalize.

| Time | What the visitor sees / does | Intent |
|---|---|---|
| 0.0 s | Ink screen, first text already in the HTML: `ZEROJANCE` and a blinking amber cursor. No JS required to see the name; without JS a one-line `// this station needs javascript to talk.` | Fast, honest first paint. |
| 0.3-5.0 s | Boot runs as real checks: display, motion preference, clock, uplink (real health call, real latency), session (`auth/me`). Ends with one margin line about the silent neighbors. **Any key or tap skips it at any moment.** | The system proves it is real, in 5 s or less, and plants the mystery. |
| 5.0-8.0 s | Banner: station name, `transient 4F2A registered. clearance: none. type help.` The prompt (`4f2a@zerojance ~ $` in amber) is focused; mobile shows tap chips for `help`, `about`, `agents`, `guestbook`, `status`. | A clear first action; nobody is lost. |
| 8-20 s | Visitor runs `help`: about ten commands, one line each, in the station's voice. Then `about`: the dossier with `[PLACEHOLDER: ...]` fields and one `[withheld]`. | Learn the grammar; meet the operator. |
| 20-32 s | `agents`: the five watchstanders and their duty lines. | The multi-agent build is on show, in-world. |
| 32-45 s | `guestbook`: real marks from real visitors, newest first. Visitor runs `guestbook sign <handle> <message>`; the new mark appears with its id. | The real backend, felt as a social moment. |
| 45-55 s | `status`: the real health reading (status, version, contract, time) plus the latency the browser measured, then `// neighbors: picket-01 to picket-06 do not answer.` The sweep glyph keeps turning. | Technical credibility plus a question they cannot answer yet. |
| 55-60 s | Visitor tries something (`whoami`, `sudo`, `login`, something guessed); the station has a dry answer for a few likely guesses. | Reward curiosity; hook into easter eggs (D5). |

Exit state: they know what the site is, saw it is real, left a mark, and have one unanswered question (session zero) that justifies a return visit.

### 5.1 Variants
- **Returning visitor, same browser session:** boot collapses to a 1.2 s reconnect (`[ ok ] uplink ...`), same registration line. (A single non-identifying flag in `sessionStorage`; must still work when storage is blocked.)
- **Mobile:** same journey. The rail compresses to `ZEROJANCE | uplink | T+`. Tap chips replace typing for the first commands; the keyboard opens on tap of the prompt, never on load (avoids the layout jump).
- **`prefers-reduced-motion` or effects off:** boot renders in its final state immediately, the sweep is a static glyph whose color still shows uplink state, no blinking. The whole journey works with zero animation.
- **API offline:** boot shows `[fail] uplink  no route` in vermilion, then `// operating on cached self. the ledger is out of reach.` Static commands still work. Server-backed commands answer with the offline line.
- **Keyboard only / screen reader:** every feature is reachable by typing; output lives in a polite live region; nothing important is conveyed by color alone (the tags carry the words).

---

## 6. Three things that keep it from being a generic cyberpunk template

1. **A grounded world instead of a skin.** It is a specific place with a specific job (a surviving early-warning picket, with silent neighbors and one unexplained session), and its content is records: a ledger, a dossier, a watch roster. There is no neon city, rain, or "the grid", and the visitor is not cast as a hacker. The tone is used-future maintenance log, not glossy sci-fi.
2. **Nothing is decorative, and color is grammar.** Real telemetry only, with fiction fenced into `// ` margin lines; six semantic inks instead of a neon palette; effects only where they carry state (the sweep, faults). No scanlines, no CRT curve, no rain of characters, no permanent glitch. When something glitches, something actually failed.
3. **A voice with a point of view.** A deadpan night-watch system that reports, understates, and withholds out loud, plus a small unresolved mystery seeded in the margins. Nobody is welcomed to the Matrix; the system just registers you and lets you find out for yourself.

---

## 7. Design constraints that outrank style

1. First useful frame is text in the initial HTML; boot is 5 s or less and skippable.
2. Keyboard-first; also fully usable by tap on mobile (chips, tap-to-focus).
3. Body text at least 4.5:1, large text/UI at least 3:1; no meaning by color alone.
4. Every effect has a `prefers-reduced-motion` fallback and a state where it is simply off.
5. System font stack; no external fonts, images, or requests at runtime.
6. All visitor text is inert data. Output is built from strings and printed as text.
7. Nothing implies an attack on any real host; nothing fakes a compromise.

---

## 8. Scope: what the brief suggested and what happens to it

MVP is one screen: boot into a terminal (`roadmap.md`). Ideas from the owner's list:

| Idea from the brief | MVP decision | Why |
|---|---|---|
| Interactive terminal | **In (core)** | The site. |
| Terminal commands | **In** | See 8.1. |
| System diagnostics | **In, real** | `status` (public) and `diagnostics` (operator) read the real API. |
| Digital dossiers | **In, as `about`** | Static copy with placeholders. A real `/api/dossiers` is reserved for later. |
| Easter eggs | **In: two** | D5 designs them, client-side only. |
| AI agent activity | **In as static `agents` roster** | A live feed needs a new endpoint and build-time git data: Phase 2. |
| Glitch effects | **Reshaped** | Only as a fault indicator (real failure), never ambient. |
| Sci-fi dashboards | **Reshaped** | One status rail, not a dashboard screen. |
| Cybersecurity "missions" | Deferred, Phase 2 | Needs server-verified state (`/api/missions`). Session zero is the seed. |
| Network visualizations / interactive maps | Deferred, Phase 2 | Canvas work and data. A map of pickets 1-7 is the natural first one. |
| Hidden pages / secret areas | Deferred, Phase 2 | Hash routes are out of MVP. MVP secrets live inside the terminal. |
| Cybersecurity tools | Deferred, Phase 2 | Candidate: client-side `hash <text>` via WebCrypto. Not needed to prove the concept. |
| Fake hacking interfaces | **Dropped permanently** | Breaks rule 1 and rule 3: it is theater, a cliche, and reads as attacking things. |
| Audio | Out of MVP (roadmap) | Phase 2 at the earliest; off by default. |
| Real-time / live feed (SSE) | Out of MVP (roadmap) | Phase 2+. |

Ideas I generated and am also leaving out of the MVP: clearance levels that grow as you find things; redaction bars that unseal on operator login; a live "wall" of marks as they arrive; a themed operator-only view. All need server state or realtime; candidates for D5's backlog.

### 8.1 Concept-level command roster (proposal for D4; D4 finalizes names and strings)
At most 14 in MVP. Suggested 11 visible plus 2 hidden:
`help`, `about`, `agents`, `build` (how the site was made, stated plainly: stack, tests, five agents), `status` (API), `guestbook` (list / `sign` / operator `rm`) (API), `login`, `logout`, `whoami` (API), `diagnostics` (operator, API), `clear`. Plus two hidden easter eggs (D5).

Candidate signature move for D4: `whoami` for a transient can add a short "seen from here" block: language, timezone, screen size, motion and color preferences, all read locally from the browser, followed by `// none of this left your browser.` It shows the station's honesty and makes a security-awareness point (what any page can see), with no new endpoint and nothing transmitted or stored.

---

## 9. What each teammate can now build from

- **D2 tokens:** section 3 (six semantic inks, provisional hexes, type conventions, relative time, hazard-tape rule).
- **D3 screens:** sections 3.3, 5, 5.1, 7; boot must be real checks (rule 1); effects catalog limited to the sweep, fault state, boot typing, operator hazard-tape prompt, and cursor.
- **D4 commands:** sections 2, 4, 8.1; use `// ` for commentary and real values for data.
- **D5 easter eggs:** section 2.5 (each egg reveals one fragment of session zero, harmlessly, client-side).
- **Frontend Engineer:** nothing to implement from this file directly. It sets the vocabulary and constraints. Wait for D2 (tokens), D3 (screens), D4 (commands), then build. One early item is safe now: the initial HTML should show `ZEROJANCE` and a blinking cursor without JS (section 5).

## 10. Needs the owner (nothing here blocks the MVP)
1. **The name and its meaning.** The site is called ZeroJance (terminal form ZEROJANCE). The design gives it a fictional "zero vigilance lapse" gloss as station lore only, because no meaning was supplied. If the name has a real meaning to you, or you dislike the gloss, say so and it will be changed. A shallow web search found no product with the name (see 2.1a); domain and handle availability are unchecked.
2. **Tone check.** Dry and deadpan by design; say so if you would rather have it warmer or more playful.
3. **Session zero.** Do you want the standing mystery? It shapes D5 and Phase 2 missions.
4. **All personal content.** Every dossier field is a `[PLACEHOLDER: ...]` until you supply it. Only "Jansen Fleming" is used.

Not verified: this branch is documentation only. The contrast ratios in 3.1 were computed but not checked with a second tool; D2 will produce the authoritative table. The lore has not been reviewed by the owner.

# ZeroJance Design Backlog (Phase 2+)

Owner: Creative Director. Task D5 (`feat/design-eggs`). Ranked ideas deliberately kept out of the MVP, each with the API surface it needs so the Architect can plan. Every idea here builds on `concept.md`'s world (session zero, the watchstanders, the ledger) rather than introducing a new theme, per the board's "least lore change" instinct.

Ranking is by (value to the "own identity, not a generic template" goal) versus (cost/risk), highest first. Reserved contract names already exist for several of these (`api-contract.md` section 8): `/api/missions`, `/api/missions/:id/submit`, `/api/agents/activity`, `/api/dossiers`, `/api/events` (SSE).

---

## Rank 1: The third hidden command — `ask` gets a memory
**What:** `ask` (D5, `easter-eggs.md` 3) currently answers once per page load from a fixed script. Phase 2: the station remembers that a question was asked at all, across visits (not the question's text), and `diagnostics`'s "session zero: not counted" line changes to "session zero: asked once, `{date}`" after the first `ask` anywhere on the station, from any visitor.
**Why rank 1:** smallest possible step from the MVP egg to something that feels alive across visitors, which is the site's whole differentiator (concept.md 3, "nothing is decorative telemetry"). Reuses the existing fiction rather than adding a new one.
**API need:** one new field, additive: `askedAt: string | null` on `GET /api/admin/diagnostics` (operator-only, matches existing shape) or a tiny new public `GET /api/station/asked` returning `{ askedAt: string | null }`, plus `POST` from the `ask` command (rate-limited like guestbook, no free-text body, just a timestamp write). Needs a new table or a single row in an existing one; no new library.
**Risk:** low. No user content stored, no auth complexity.

## Rank 2: Agent-activity feed — `agents --log` / a `watch` command
**What:** the `agents` command (D4 5.3) currently lists five static duty lines. Phase 2 shows their real recent work, generated from git log at build time (already reserved: `GET /api/agents/activity`, roadmap Phase 2). Presented as a short scrollable log in the station's voice: `[watchstander] {duty room} — {commit summary}, {relative time}`.
**Why rank 2:** this is the single most "technically impressive" idea in the owner's brief (multi-agent AI made visible) and turns the "watch roster" from lore into evidence.
**API need:** `GET /api/agents/activity` (already reserved), generated from git log at build time per the roadmap's "no runtime git access" rule; paginated like guestbook.
**Risk:** medium. Needs a mapping from commit author/branch prefix to a watchstander, and care that commit messages never leak anything private (they are already this project's own commits, so low exposure, but should still be filtered to a safe subset of fields: author role, one-line summary, timestamp).

## Rank 3: Missions — a small server-verified challenge
**What:** a `missions` command family (`missions`, `missions start <id>`, `missions submit <id> <answer>`) themed as small, safe security literacy tasks the station poses to transients ("decode this", "which of these headers is missing", "what does this status code mean"), verified server-side, flags stored as hashes (roadmap Phase 2 already specifies this). Session-zero framing: completing missions is framed as helping the station audit itself, never as attacking anything.
**Why rank 3:** highest resume/portfolio value (demonstrates real server-verified logic, not just content) but the largest scope: new schema, new endpoints, new UI states (in-progress, correct, incorrect, rate-limited).
**API need:** `POST /api/missions`, `GET /api/missions`, `POST /api/missions/:id/submit` (all reserved). New table, per-session progress (needs a lightweight session concept for anonymous visitors, which the MVP does not have beyond the auth cookie).
**Risk:** medium-high. Needs its own threat model pass (Security/QA) before design, especially around guessing/brute-forcing answers; rate limiting is not optional.

## Rank 4: The neighbor map — pickets 1-7 visualization
**What:** a `map` command opens a small canvas/SVG view: seven picket points, six shown dim/unresponsive, one (this station) live and pulsing with the real uplink state (reusing the sweep glyph's color logic from D3). No real geography, no real network data — an abstract diagram, consistent with concept rule 3 ("nothing is aimed at anyone", no real-looking IPs).
**Why rank 4:** strong visual payoff and a direct dramatization of the "silent neighbors" lore already established in the MVP, but it is decoration relative to ranks 1-3 (no new information, just a picture of information already in `status`).
**API need:** none beyond the existing `GET /api/health`. Purely a new client-side view using the D3 layout system (out of MVP only because "network visualizations" and "interactive maps" are explicitly excluded from Phase 1 in the roadmap, and it needs canvas work not yet scoped).
**Risk:** low technically, but a new rendering surface (canvas) needs its own accessibility fallback (a text table, per D3's "non-effects fallback" rule) before it ships.

## Rank 5: Redaction bars that unseal on operator login
**What:** the `about` dossier's `[withheld]` line and any `████` redaction bars visually "unseal" (a brief, reduced-motion-safe reveal) the moment `login` succeeds in the same session, showing operator-only detail placeholders (still `[PLACEHOLDER: ...]` until the owner supplies real content). Reuses D3's E7 "operator strip" transition.
**Why rank 5:** a nice moment, but it is UI polish on content the owner has not supplied yet, and it risks implying there is real hidden content when today there would only be more placeholders — low value until the owner's real bio content exists.
**API need:** none; purely reads the existing session state.
**Risk:** low, but sequence it after the owner supplies real `about` content, or it ships as a reveal of more placeholders, which undercuts the "withheld beats pretending" rule rather than serving it.

## Rank 6: A live "wall" of marks as they arrive
**What:** the ledger view updates in near-real-time as other visitors sign, instead of only on `guestbook`/reload.
**Why rank 6:** the MVP's guestbook already delivers the social moment (concept 5, 32-45s window); real-time adds delight but real engineering cost (SSE, roadmap-reserved `/api/events`) for a feature that is easy to defer without hurting the concept.
**API need:** `GET /api/events` (SSE, reserved). Explicitly excluded from MVP by the roadmap ("real-time... out of MVP").
**Risk:** medium. SSE reconnect/backoff, and needs a decision on whether anonymous transients can flood the channel.

## Rank 7: Cybersecurity tool — client-side `hash <text>`
**What:** a small, genuinely useful command: `hash <text>` runs SHA-256 via `window.crypto.subtle` and prints the digest, framed as one of the station's own diagnostic tools made available to transients.
**Why rank 7:** cheap, real, and thematically on-brand (concept.md 8.1 already flags this as a Phase 2 candidate), but it is a nice-to-have utility, not a differentiator — it doesn't deepen the world or the mystery the way ranks 1-4 do.
**API need:** none, fully client-side (Web Crypto API, already available, no new dependency).
**Risk:** very low. Mainly a copy/UX question (output formatting, copy-to-clipboard affordance) rather than a design risk.

## Rank 8: Hidden pages via hash routes
**What:** `#/dossier`, `#/watch`, or similar hash routes surface a fuller version of a command's content outside the terminal (e.g., a printable dossier), reachable only by a visitor who discovers the URL (in an egg's output, or shared out of band).
**Why rank 8:** explicitly excluded from the MVP by the roadmap ("hidden routes/pages beyond the terminal's own easter eggs... out of MVP"); worth revisiting once there is enough real content (post owner bio) to justify a second surface.
**API need:** none new, but needs a routing decision (the ADR currently has "no router in MVP"; this would need one, however small).
**Risk:** low content risk, low-medium engineering cost (introduces routing where there is none today).

---

## Explicitly not backlogged (reconsider only if the owner asks)
- **Fake hacking interfaces.** Dropped permanently in `concept.md` section 8 (breaks the "nothing aimed at anyone" and "only real locks" rules, and is a cliche). Not re-proposed here.
- **Sound/audio.** Roadmap keeps this out through at least Phase 2, off by default even when built. No design work needed until the owner asks; when it happens, it must default to off and respect a mute rule symmetrical with `prefers-reduced-motion`.
- **Clearance levels that grow as you find things (a fuller "trust" system).** Considered in `concept.md` section 8 and set aside there; would need its own session-state design and likely overlaps heavily with the Missions system (rank 3) if the owner wants it, so it should be designed together with missions rather than separately.

## Not covered here
The two MVP easter eggs and the guessed-command quips: `easter-eggs.md`. Review of the built site: D6.

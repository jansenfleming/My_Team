# feat/design-eggs: D5 easter eggs and backlog

Author: creative-director. Branch: `feat/design-eggs`. Base: `main` (after PR #11, `feat/design-commands`). Docs only, no code. Review: Architect only (design branch). The lead merges via `gh`.

## What changed
- `docs/design/easter-eggs.md` (new): two MVP easter eggs using D4's reserved hidden slots.
  - **`ask <anything>`** (hidden command, 1 of 3 slots used): rewards a visitor who directly questions session zero with a one-time, four-line fragment, then a short "asked and answered" line on repeat use in the same page load. No network call, no stored state, argument text is read but discarded, never echoed or sent.
  - **`whoami --deep` / `-d`** (a flag on D4's existing `whoami`, uses no extra slot): appends two more locally-read facts (pointer type, storage availability) under the existing "seen from here" block, then repeats the existing "does not send or store" promise unchanged. Plain `whoami` is byte-for-byte unchanged from D4 5.8.
  - A guessed-command quip table (`sudo`, `ls`, `pwd`, `cat`, `rm`, `hack`, `exit`/`quit`, `man`) for the unknown-command path D4 reserved for D5; matched by exact first token, none of it counted against the 14-command cap, every reply ends with a real working suggestion.
  - Rules section ties both eggs to concept rules 1, 3, 5, 7 (real readings only, nothing aimed at anyone, withheld beats pretending, diegetic effects) and states explicitly what was left out and why (the third hidden slot, any egg needing server state, visual effects beyond existing tags, tying eggs to stored guestbook text).
  - Acceptance checks for F4/F6.
- `docs/design/backlog.md` (new): 8 ranked Phase 2+ ideas, each with an explicit API need (several map to contract-reserved names: `/api/missions`, `/api/agents/activity`, `/api/events`) or "none" where it's client-only, plus a short "explicitly not backlogged" section (fake hacking UI stays dropped permanently; audio and a fuller clearance/trust system are named but deferred without a design commitment).
- `docs/design/concept.md`: the voice alignment the Architect asked for after D4 (4.3 now says system lines start lowercase, not "sentence case"), with a one-line note on why and that D4/D3/D5 already followed it.

## Self-check against D1/D4 rules
- **Real-readings-only (concept rule 1):** `ask`'s content is entirely fiction and is entirely `system` (`// `) lines; nothing in either egg claims a fake reading. `whoami --deep`'s two new fields are read the same way as the six existing ones (local browser API, try/catch, `[unavailable]` fallback).
- **Nothing aimed at anyone (rule 3) / no fake hacking (concept section 8):** the `hack` quip explicitly states the station does not hack anything; no egg simulates an attack or references a real host.
- **Visitor text inert (rule 6):** `ask`'s argument is never rendered anywhere, which is stricter than rendering it as inert text.
- **14-command cap:** 11 visible (D4) + 1 hidden (`ask`) = 12. `whoami --deep` is a flag, not a new command. One hidden slot is left unused on purpose (section 6 of `easter-eggs.md`).
- **No fabricated owner facts:** neither egg mentions the owner; both are pure station voice/mechanics.
- **Buildable in under a day each:** both reuse the existing command/output pipeline and existing tag styling (`[fail]`, `system`/`// `); no new component, token, or effect.

## Contract check
No new endpoint or field is used in the MVP eggs. The backlog's rank-1 and rank-2 items name small additive contract changes for the Architect to consider for Phase 2 only (not requested now).

## Not verified
Docs only; no tests apply. The `pointer`/`storage` reads in `whoami --deep` reuse logic `screens.md` 5.6 already specifies (the storage try/catch probe) but that has not been implemented or run anywhere yet.

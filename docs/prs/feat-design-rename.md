# feat/design-rename: rename PICKET-07 to ZeroJance (D1 amendment)

Author: creative-director. Branch: `feat/design-rename`. Base: `main`. Docs only, no code. Review: Architect only (design branch).
Supersedes earlier unmerged name drafts; none of their text is in this branch.

## What changed (`docs/design/concept.md` plus this file)
- **Name:** prose `ZeroJance`, terminal/tag form `ZEROJANCE` (tab title, status rail, first-paint HTML, banners, mobile rail, do/don't table), prompt host `zerojance` (`4f2a@zerojance ~ $`). Serial `picket-07` survives only as lore, never a UI label.
- **Meaning:** the owner gave none, so none is claimed. Two lines of clearly fictional station lore: the name is the standard the station was built to meet, "zero vigilance lapse", and session zero is the one log entry that breaks it. The site copy never explains the name (at most the `about` dossier or an egg uses "zero lapse" as lore). Section 2.1a says so plainly.
- **Least lore change:** seven pickets with 1-6 silent, session zero, transient/operator vocabulary, rules of the world, voice, palette, and scope are unchanged. "The picket" as a speaker is now "the station".
- **No outside references:** no film, novel, franchise, or brand names.
- **Owed fix from D1:** the 45-55 s journey row now says `status` shows the real health reading (status, version, contract, time) plus browser-measured latency, not "uptime-style readings".
- No claims about the owner beyond the name Jansen Fleming.

## Collision check
One web search for the exact name (2026-09-21): no product, company, or tool called ZeroJance/ZEROJANCE. Nearest hit: a music artist "ZeroJane" (different spelling). Not checked: trademark registries, domain availability, GitHub/npm names, social handles. No real collision found, so the name is not flagged as an owner decision, only the meaning question (section 10, item 1).

## How to review
`git diff main -- docs/design/concept.md`. Check `grep -n "PICKET-07" docs/design/concept.md` is history only.

## Not verified
Docs only; no tests apply. Nothing pushed.

# chore/agent-roster-reconcile: reconcile subagent definitions with the ZeroJance roster

Author: lead. Branch: `chore/agent-roster-reconcile`. Base: `main` (c42ae08, after PR
#28, `chore/streetwear-pivot-cleanup`).

## What changed
The Architect's cleanup/plan (PR #28) rewrote `docs/architecture/**` for the new
three-role ZeroJance team but explicitly left `.claude/agents/**` alone, flagging it as
stale and out of its remit. Those subagent definitions still described the old
five-role cybersecurity-terminal team, so spawning `architect` or `creative-director`
today would have loaded contradictory context (old project name, old file ownership,
old process wording). This closes that gap before any Creative Director or Engineer
teammate is spawned.

- `.claude/agents/architect.md` — rewritten for ZeroJance: no more API-contract
  ownership (no API exists), reviews and tells the lead to merge rather than merging
  itself (matches the real-PR-from-day-one flow in `ownership-map.md`), points to ADR
  0003.
- `.claude/agents/creative-director.md` — rewritten for ZeroJance's brand/voice/product-
  concept/easter-egg scope instead of the cyberpunk terminal experience.
- `.claude/agents/engineer.md` — new, combining the old `frontend-engineer.md` and
  `backend-engineer.md` into the single combined role the brief calls for (frontend +
  whatever light data layer is needed; per ADR 0003 that's a local typed product-data
  module, not a real API).
- `.claude/agents/frontend-engineer.md`, `backend-engineer.md`, `security-qa-engineer.md`
  — removed. The old split doesn't match the new roster, and there's no standing QA role
  for this project (kept in git history; not resurrected here since a future QA role, if
  a real backend feature is added later, would need scope specific to that feature
  rather than the old API's threat model).

No application code, design content, or process docs outside `.claude/agents/**`
changed.

## How to test
Not independently testable (Markdown agent-definition files, no build/test target).
Verified by reading each new file against `docs/project-brief.md` and
`docs/architecture/ownership-map.md`/`board.md` for consistency (roster names, file
ownership, branch/merge flow, approval boundaries all match).

## New dependencies
None.

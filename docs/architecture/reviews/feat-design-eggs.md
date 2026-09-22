# Review: feat/design-eggs (D5)

Reviewer: architect, 2026-09-22. Commit reviewed: `82b9c62`. Docs-only design branch: architect review only, no QA gate required.

## Checks
- **Ownership:** `git diff main...feat/design-eggs --stat` touches only `docs/design/easter-eggs.md` (new), `docs/design/backlog.md` (new), `docs/design/concept.md` (one-line voice-convention edit in 4.3), and this branch's own `docs/prs/feat-design-eggs.md`. All within the Creative Director's owned path.
- **Matches D4's reservation exactly:** `terminal-commands.md` line 12 reserves "up to 3 hidden slots... for D5" and hands a "small quip table owned by D5 inside the unknown-command path" to this task. D5 uses 1 of 3 hidden slots (`ask`), leaves 1 flag on an existing command (`whoami --deep`, correctly not counted against the cap), reserves the third slot unused, and supplies the quip table (`sudo`, `ls`, `pwd`, `cat`, `rm`, `hack`, `exit`/`quit`, `man`) exactly where D4 said it would live. No scope invented beyond what D4 already promised.
- **Board's done-when (D5):** "two MVP easter eggs... buildable in under a day of frontend work each" — both eggs reuse the existing command/output pipeline and existing tag styling with no new component, token, or effect; the file's own section 6 explains what was deliberately cut (third slot, server-state eggs, new visuals, guestbook-triggered eggs) and why, which is exactly the kind of scope discipline the board asks for.
- **Real-readings-only (concept rule 1):** `ask`'s content is fiction, entirely `system`/`// ` lines, never presented as a real reading. `whoami --deep`'s two new fields (`pointer`, `storage`) are read the same try/catch, local-browser-API pattern as the six existing `whoami` fields, and the closing "does not send or store" promise is left unchanged rather than re-worded to sound like more than it is.
- **No fake capability / nothing aimed at anyone:** the `hack` quip explicitly denies any hacking capability; no quip or egg claims to scan, access, or perform anything real; every quip ends in a real working suggestion.
- **Visitor input safety:** `ask`'s argument is read but never rendered or sent — stricter than the usual "inert text" rule, so there is nothing to sanitize.
- **No fabricated owner facts:** neither egg nor the backlog mentions personal facts about the owner; all station-voice fiction.
- **Backlog quality:** 8 ranked ideas, each tagged with its API need (several correctly point at contract-reserved-but-unbuilt endpoints: `/api/missions`, `/api/agents/activity`, `/api/events`) or "none" for client-only ideas; nothing here requests a contract change now, it only flags what Phase 2 would need — consistent with A2's change-control process.
- **`concept.md` 4.3 edit:** narrows "sentence case" to "lowercase sentence starts" for system prose. The PR file frames this as a request from the (pre-reset) architect after D4 shipped; I have no direct record of that exchange in this session, but the change is small, purely cosmetic, applied consistently (the PR file states D3/D4/D5 already follow it), and does not touch any hard rule (placeholders, real-readings, ownership). Ratifying it here rather than re-litigating it.

## Verdict
Approved. Ready to merge.

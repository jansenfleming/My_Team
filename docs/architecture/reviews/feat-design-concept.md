# Review: feat/design-concept (D1)

Reviewer: architect. Date: 2026-09-21. Commit reviewed: b246c7f. Docs-only design branch: Architect review only, no QA gate.

## Verdict
Approved and merged `--no-ff`.

## Checked
- Ownership: only `docs/design/concept.md` and `docs/prs/feat-design-concept.md`.
- Scope: everything in the MVP uses existing endpoints (`health`, `auth/me`, guestbook, login/logout, diagnostics). 11 visible commands + 2 hidden is within the 14 cap. Deferred/dropped ideas each have a reason.
- Placeholder rule: only "Jansen Fleming" is stated as fact; all dossier fields are `[PLACEHOLDER: ...]`. Fiction is labelled as fiction.
- Safety: no fake attacks on named hosts, no external requests, visitor text inert, matches the brief's authorized-testing rule.

## Constraints passed to D2-D5 (also messaged)
1. Public `status` can only show what `GET /api/health` returns: status, version, contract, time (plus client-measured latency). **No uptime, counts, or session numbers publicly**; those are operator-only via `diagnostics`.
2. Rule 1 ("real readings only") applies to claims too. "this was logged" on failed login is now true: B4 done-criteria require a structured log line for failed logins (requestId and IP only).
3. `whoami` "seen from here" must stay client-side and read-only, and the closing line ("none of this left your browser") must remain true (no telemetry, no storage of those values).
4. Dossier and boot copy must not state anything about the owner beyond the name.

## For the owner (surfaced to the lead)
Name PICKET-07 (unchecked for collisions), deadpan tone, whether to keep the "session zero" mystery.

# feat/design-concept: D1 Concept and voice

Author: creative-director. Branch: `feat/design-concept`. Base: `main`. Docs only, no code. Review needed: Architect only.

## What changed
- `docs/design/concept.md` (new): the system's identity and voice.
  - **PICKET-07**: one surviving early-warning node; visitor is a `transient`, the owner is `the operator`. Pickets 1-6 are silent; "session zero" is the standing mystery.
  - World: glossary mapping world terms to features (ledger = guestbook, dossier = about, watchstanders = the five agents), seven hard rules (real readings only, `// ` marks all commentary, nothing aimed at anyone, only real locks, withheld beats pretending, visitor text inert, diegetic effects).
  - Identity in brief: six semantic inks with provisional hexes and measured contrast (D2 finalizes), type conventions, relative `T+` time, status rail with a sweep glyph tied to real uplink state.
  - Voice guide: traits, conventions, banned words, do/don't table, sample lines.
  - 60-second visitor journey plus variants (returning, mobile, reduced motion, API offline, keyboard/screen reader).
  - Three anti-generic differentiators, constraints that outrank style, scope map of every idea in the brief (kept / reshaped / deferred / dropped, with reasons), a proposed command roster for D4 (11 visible + 2 hidden), and questions for the owner.
- `docs/prs/feat-design-concept.md` (this file).

## How to review
1. Scope: check section 8 against `docs/architecture/roadmap.md`. Nothing in the MVP needs a new endpoint. Boot uses only `GET /api/health` and `GET /api/auth/me`; `diagnostics` uses the contract's existing fields.
2. Placeholder rule: only "Jansen Fleming" is stated as fact. The agents' roles and "Claude Sonnet 5" come from the brief. Station lore is fiction about a fictional system and is labelled as such.
3. Ownership: only `docs/design/**` and this PR file were touched.

## Decisions for the owner
See section 10 of the concept: confirm or change the name PICKET-07 (not checked for collisions), tone (dry and deadpan), whether to keep the session-zero mystery, and supply all personal content.

## Verified / not verified
- Contrast ratios in section 3.1 were computed with a WCAG relative-luminance script (bone 13.28, slate 6.58, amber 9.53, verdigris 10.24, vermilion 6.30 against `#0B0D10`). Not cross-checked with a second tool; D2 owns the authoritative table.
- No tests apply (no code). Nothing was pushed or sent anywhere.

## Next
D4 (`feat/design-commands`) starts after this merges.

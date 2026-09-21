# Review: fix/qa-001-message-invisible-chars, feat/qa-gate-fix-qa-001, feat/design-rename

Reviewer: architect. Date: 2026-09-21. All three approved; merging is the lead's step (real-PR flow).

## fix/qa-001-message-invisible-chars (backend, head 8d11767)
- Gate PASS names exactly 8d11767 (`qa/reports/gate-fix-qa-001-message-invisible-chars.md`), and the branch head equals it.
- Touches only `packages/shared/{constants,schemas,guestbook.test}.ts` and its PR file. Matches the contract text: forbidden class adds tag characters U+E0000-E007F, U+E0100-E01EF, U+2060-2064, U+FFF9-FFFB, U+00AD; visible-character rule `[^\p{Cf}\p{Z}\p{M}]`; U+200B/200C/200D and U+FE00-FE0F stay allowed.
- Independently run by the Architect in a temporary worktree at 8d11767 (`npm ci`): `npm test -w @site/shared` 243 passed, typecheck clean, root lint exit 0.

## feat/qa-gate-fix-qa-001 (QA, head 7026084)
- Only `qa/**` and its PR file: the gate, QA-001 marked verified, new QA-002, and the updated adversarial test.

## QA-002 decision (Low): cap runs of invisible characters at 3
Same prompt-injection reasoning as QA-001, at low cost. Contract amended on `docs/contract-qa-002`: more than 3 consecutive invisible characters (`\p{Cf}`, U+FE00-FE0F, U+034F) are rejected; real emoji sequences need at most 2 in a row. Also recorded: guestbook text is untrusted data for any AI agent, and England/Scotland/Wales flag emoji (tag sequences) are unsupported. Backend implements on `fix/qa-002-invisible-runs` (after B2); QA retests and gates.

## feat/design-rename (Creative Director, head 5d00479)
- Docs-only; touches `docs/design/concept.md` and its PR file.
- Name is consistent (prose ZeroJance, terminal ZEROJANCE, prompt host `zerojance`); `picket-07` remains only as lore, never a UI label. No etymology or claim about the owner is asserted: the "zero vigilance lapse" gloss is labelled fictional lore and the meaning question goes to the owner. Collision search is stated with what was and was not checked. No outside film or novel references. Status wording fixed to real health fields plus client-measured latency.

# docs/contract-qa-002: contract clarification for QA-002

Author: architect. Branch: `docs/contract-qa-002`. Base: `main` (b7227a9). Docs only.

## What changed
- `docs/architecture/api-contract.md`: guestbook `message` also rejects more than 3 consecutive invisible characters (`\p{Cf}`, U+FE00-FE0F, U+034F); states that England/Scotland/Wales flag emoji are unsupported; states that guestbook text is untrusted data for AI agents; changelog line.
- `docs/architecture/reviews/fix-qa-001-and-design-rename.md`: review notes for the three branches approved in this round, and the QA-002 decision.

## How to review
Read the diff. Implementation follows in `fix/qa-002-invisible-runs` (backend), then QA retest.

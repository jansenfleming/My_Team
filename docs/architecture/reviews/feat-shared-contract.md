# Review: feat/shared-contract (B1)

Reviewer: architect. Date: 2026-09-21. Commits reviewed: f4bac86, 6c6d112 (merge of main), 9d8f515.

## Verdict
Architect review: **approved**. Merge: **held until `qa/reports/gate-feat-shared-contract.md` says `Verdict: PASS`** (ownership-map rule 6).

## Checked
- Ownership: only `packages/shared/**`, `docs/prs/feat-shared-contract.md`, `package-lock.json` (allowed lockfile diff).
- Contract match (sections 2, 5, 6 and the c7895f4 clarification): every request, query, params and response has a schema; handle `2..24 [A-Za-z0-9_-]`; message runs the forbidden-character check on the raw input, then trims, then length 1..280; forbidden set is `\p{Cc}`, `\p{Cs}`, U+2028/2029, U+202A-202E, U+2066-2069, U+200E/200F/061C; zero-width joiners allowed; `details` only with `validation_error`; ERROR_HTTP_STATUS covers all 11 codes with the contract's statuses; RATE_LIMITS and cookie constants match sections 3-4.
- URL numbers (`limit`, `before`, `:id`) are strict digit strings, no coercion.
- `toValidationDetails` never echoes input and caps output at 10 entries.
- No zod import in `constants.ts`; `@site/shared/constants` subpath lets the web app avoid bundling zod.
- Dependencies: `zod ^4.6.5`, `vitest ^5.0.1` only, both per ADR.
- Independently run by the Architect in `.worktrees/api` at 9d8f515: `npm test -w @site/shared` = 5 files, 187 tests passed; `npm run typecheck -w @site/shared` exit 0; root `npm run lint` exit 0.

## Notes (non-blocking)
- Zod 4 `.min()/.max()` count code points, not UTF-16 units; B1 uses explicit `.length` refines and pins this with a test. Recorded in ADR 0001 conventions; the frontend must count with `.length` for any client-side limit.
- `limit=51` returns `validation_error` (not clamped). That matches the contract wording "1..50".

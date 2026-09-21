# feat/shared-contract (B1): shared contract package

Branch `feat/shared-contract` (worktree `.worktrees/api`), author backend-engineer. Implements `docs/architecture/api-contract.md` v1.0 (including the 2026-09-21 clarification, main `c7895f4`, merged into this branch) as zod 4 schemas, inferred types and constants in `packages/shared` (`@site/shared`).

## What changed
- `packages/shared/src/constants.ts`: all seven section 5 constants plus `CONTRACT_VERSION`, `API_BASE_PATH`, `HANDLE_PATTERN`, `MESSAGE_FORBIDDEN_PATTERN`, `BODY_LIMIT_BYTES`, `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_SECONDS`, `RATE_LIMITS`, `ROLES`/`Role`, `ERROR_CODES`/`ErrorCode`, `ERROR_HTTP_STATUS`. No imports, so the web app can use the `@site/shared/constants` subpath without pulling in zod.
- `packages/shared/src/schemas.ts`: schemas for every request, query, path param and response in sections 2, 5, 6 (`HandleSchema`, `MessageSchema`, `GuestbookEntrySchema`, `ApiErrorSchema`, `HealthResponseSchema`, `LoginRequestSchema`/`LoginResponseSchema`, `MeResponseSchema`, `GuestbookQuerySchema`, `GuestbookListResponseSchema`, `CreateGuestbookRequestSchema`/`ResponseSchema`, `GuestbookIdParamsSchema`, `DiagnosticsResponseSchema`), inferred types (`User`, `GuestbookEntry`, `ApiError`, `ErrorCode`, ...) and `toValidationDetails(zodError)` which builds the contract `details` array from fixed messages only (never echoes input, capped at 10).
- `packages/shared/src/index.ts`, `package.json` (`exports`: `.` and `./constants`, both TS source, `sideEffects: false`, scripts `test`, `typecheck`), `tsconfig.json`, `vitest.config.ts`, `README.md`.
- Tests (187): `guestbook.test.ts`, `query.test.ts`, `responses.test.ts`, `constants.test.ts`, `types.test.ts` (compile-time type equality against the contract shapes, enforced by `typecheck`).

## Contract interpretations (approved by architect, contract clarified in main `c7895f4`)
- Message: forbidden-character check on the RAW input, then trim, then 1..280. Forbidden: `\p{Cc}` (C0, DEL, C1), `\p{Cs}` lone surrogates, U+2028/2029, U+202A-202E, U+2066-2069, U+200E/200F/061C. Zero-width chars (U+200B, U+200D) allowed. Parsed output is the trimmed string.
- All text lengths count UTF-16 code units. **Trap found:** zod 4's `.min()/.max()` on strings count Unicode code points, so text fields use an explicit `.length` refine; a test pins it (141 emoji = 282 units is rejected).
- Request and response objects strip unknown keys. Query/path ints (`limit`, `before`, `:id`) are strict digit strings (max 16 digits, safe integer), no coercion: `""`, `" 5"`, `"+5"`, `"1e1"`, `"0x10"`, `"-1"`, `"1.5"`, repeated params all rejected.
- `health.contract` is any non-empty string; `diagnostics.db` is the literal `"ok"`; `ApiError.details` is only allowed for `validation_error`; timestamps must be ISO-8601 UTC with exactly 3 fractional digits and `Z`.
- Login `username`/`password` are never trimmed.

## Dependencies added (`@site/shared` only; lockfile changes come from `npm install -w`)
- `zod@^4.6.5` (dependency, in the ADR stack)
- `vitest@^5.0.1` (devDependency, in the ADR stack)

## Not covered / limits
- Types are inferred from the schemas and compile-checked against the contract shapes; there is no JSON Schema or OpenAPI generation.
- Zero-width characters (U+200B/U+200D) are accepted by design; a message made only of them passes trimming.
- Nothing here runs against a real server (B2+). Frontend has not yet consumed the package (the consumer check below is a `tsc` compile of a throwaway file, deleted afterwards).

## How to test
```
cd .worktrees/api && npm install
npm test -w @site/shared
npm run typecheck -w @site/shared
```

## Real command output (run 2026-09-21 in `.worktrees/api`; `npm warn EBADENGINE`/deprecation lines filtered out)
```
$ npm test -w @site/shared

> @site/shared@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/packages/shared

 Test Files  5 passed (5)
      Tests  187 passed (187)
   Start at  17:42:14
   Duration  184ms (transform 48%, import 41%, tests 9%, worker 3%)
exit: 0

$ npm run typecheck -w @site/shared

> @site/shared@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json
exit: 0

$ npm run lint

> my-team-site@0.0.0 lint
> eslint .
exit: 0

$ npm run typecheck

> my-team-site@0.0.0 typecheck
> npm run typecheck --workspaces --if-present

> @site/shared@0.0.0 typecheck
> tsc --noEmit -p tsconfig.json
exit: 0

$ npm test

> my-team-site@0.0.0 test
> npm run test --workspaces --if-present

> @site/shared@0.0.0 test
> vitest run

 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/api/packages/shared

 Test Files  5 passed (5)
      Tests  187 passed (187)
   Start at  17:42:17
   Duration  181ms (transform 46%, import 42%, tests 9%, worker 3%)
exit: 0

$ npm run build

> my-team-site@0.0.0 build
> npm run build --workspaces --if-present
exit: 0
```

Boundary tests seen passing (`npx vitest run --reporter=verbose`): handle length 1 (rejected), 2, 24 (accepted), 25 (rejected); message length 0 (rejected), 1, 280 (accepted), 281 (rejected); message containing newline, tab, NUL, DEL, U+2028, U+202E, lone surrogate (each rejected in the middle, alone and at the ends).

Extra checks run by hand and not kept in the repo:
- Consumer compile: a temporary `apps/api/tmp-consumer/a.ts` doing `import type { User, GuestbookEntry, ApiError, ErrorCode } from "@site/shared"`, `import { HANDLE_MAX, ERROR_CODES } from "@site/shared/constants"` and `MessageSchema.parse` compiled with `tsc --noEmit`: OK, then deleted.
- Mutation check: narrowing the bidi range in `MESSAGE_FORBIDDEN_PATTERN` from U+202A-U+202E to U+202A-U+202D made 2 tests fail (RLO U+202E); reverted.

## Review notes
- Ownership: only `packages/shared/**`, `package-lock.json` (generated by `npm install -w`, per ownership map) and this file changed.
- For the Architect: the web app should import constants from `@site/shared/constants` and types with `import type`.
- QA: `qa/` can reuse the schemas for conformance checks; `toValidationDetails` shows the exact `details` shape the API should emit.

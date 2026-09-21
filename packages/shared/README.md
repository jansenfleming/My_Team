# @site/shared

Owner: Backend Engineer. API contract v1.0 (`docs/architecture/api-contract.md`) as constants, zod 4 schemas and inferred types. The contract file wins; change it only through the Architect.

- `@site/shared`: schemas, types, constants, `toValidationDetails(zodError)`.
- `@site/shared/constants`: constants only, no imports (so the web app keeps zod out of its bundle).
- Web: `import type { User } from "@site/shared"` and `import { HANDLE_MAX } from "@site/shared/constants"`.
- No build step; `exports` point at TypeScript source.
- Gotcha: zod 4's `.min()/.max()` count code points; the contract counts UTF-16 code units, so text fields use an explicit `.length` check.

```
npm test -w @site/shared
npm run typecheck -w @site/shared
```

// @site/shared: API contract v1.0 (docs/architecture/api-contract.md) as constants, zod schemas
// and inferred types. Frontend: prefer `import type { ... } from "@site/shared"` for types and
// `import { ... } from "@site/shared/constants"` for constants, so zod stays out of the bundle.
export * from "./constants";
export * from "./schemas";

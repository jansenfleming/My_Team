# ADR 0001: Stack

Status: accepted (Architect, 2026-09-21). Change only through a new ADR.

## Context
Node 22.12 + npm only. No Docker, pnpm, or `gh`. Everything must run locally after `npm install`. Local git only. MVP must be small and working, and demonstrate full-stack, API, auth, tests, CI/CD files, security, and agent collaboration. Sonnet 5 agents write the code, so favor mainstream tools they know well.

## Decisions

| Area | Choice | Reason (one line) | Rejected |
|---|---|---|---|
| Language | TypeScript 5.9 (`strict`), ESM everywhere | Shared types between web and api is the cheapest way to keep the contract honest | Plain JS (contract drift), TS 6/7 (too new for the tooling) |
| Monorepo | npm workspaces: `apps/web`, `apps/api`, `packages/shared`, `qa` | Only npm is available; one `npm install` | pnpm/turborepo/nx (not installed, unnecessary) |
| Web | Vite 7 + React 19 + `@vitejs/plugin-react` 5, plain CSS driven by the Creative Director's `tokens.css` | Fast dev loop, static build, no server rendering needed for a terminal UI | Next.js (SSR/deploy weight, no benefit here), Svelte/Solid (fewer agent-known idioms), Tailwind/UI kits (fight a custom visual identity) |
| Web state/routing | React hooks only, no router in MVP | One screen: a terminal. Hidden pages come later via hash routes | Redux/Zustand/React Router (not needed yet) |
| API | Fastify 5 + `zod` 4 for validation | Built-in `inject()` gives fast tests with no ports; first-party helmet/rate-limit/cookie plugins | Express (more manual security wiring, slower tests), NestJS (heavy), Hono (fewer security plugins) |
| API runtime | `tsx` runs TypeScript directly (dev and MVP `start`); `tsc --noEmit` for typecheck | No build pipeline to maintain in MVP | tsup/esbuild bundling (Phase 3, with deploy) |
| Database | SQLite via `better-sqlite3` **`^12`**, raw parameterized SQL, numbered `.sql` migrations run at startup | Zero setup, file DB, sync API is simple to test | Postgres/MySQL (needs a server), Prisma/Drizzle (extra layer, codegen), `node:sqlite` (flagged/experimental on Node 22.12) |
| Auth | One operator account. Password hashed with `node:crypto` scrypt. Server-side session: opaque random id in an `HttpOnly; SameSite=Strict` cookie, sha256 of it stored in SQLite | Simple, revocable, no token-in-JS-storage, no native deps | JWT (hard to revoke, tempts localStorage), OAuth/social login (external service), argon2/bcrypt (native builds) |
| CSRF | `SameSite=Strict` cookie plus `Origin` check on every mutating request | Two independent layers, no token plumbing | CSRF token library (extra moving parts) |
| Tests | Vitest 5 everywhere. Web: `@testing-library/react` + `jsdom` 28. API: `fastify.inject` against a temp/in-memory DB. QA: black-box HTTP tests against a spawned local API | One runner for all workspaces, TS-native | Jest (slower TS/ESM setup), Playwright/Cypress (browser download needs network; deferred to Phase 2) |
| Lint | ESLint 9 flat config + `typescript-eslint`, at the root | Standard | ESLint 10 (needs Node >=22.13), Prettier (skip; `.editorconfig` only, less noise) |
| Dev runner | `concurrently` at the root | One `npm run dev` for both processes | Manual two terminals |
| CI/CD | GitHub Actions workflow files in `.github/workflows/` (target branch `main`; they cannot run until the owner approves a push, and nothing is pushed by agents) | Requirement of the brief | Other CI systems |

## Verified on this machine (Node 22.12.0, npm 11.6.1, 2026-09-21)
- Installed and smoke-tested together: vite 7.3, react 19.3, vitest 5.0, jsdom 28.1, @testing-library/react 16, fastify 5.12, zod 4.6, better-sqlite3 12.11, typescript 5.9, eslint 9.39, tsx 4.
- **`better-sqlite3@13.0.3` segfaults (exit 139) on Node 22.12.0 here; `12.11.1` works.** Pin `^12`. Do not upgrade to 13 without re-testing on the CI Node version.
- **Version traps for Node 22.12:** `jsdom` 29/30 and `eslint` 10 require a newer Node 22 minor. Stay on `jsdom ^28`, `eslint ^9`, `vite ^7` with `@vitejs/plugin-react ^5` (plugin-react 6 needs Vite 8). Use caret ranges within these majors. Root `engines` and `.nvmrc` say Node 22. `npm install` prints `eslint@9.x is no longer supported` as a deprecation warning; it is expected and harmless until the Node baseline moves to >=22.13 (then adopt ESLint 10 via a new ADR). It also prints `EBADENGINE` for `eslint-visitor-keys@5` (needs Node ^22.13, pulled in by `typescript-eslint`); warning only, lint passes on 22.12.
- **Vite is pinned at the root (`devDependencies`: `vite ^7.3.6`).** `packages/shared` has vitest 5 and no vite of its own, so npm auto-installed the peer `vite@8.3.0` at the root and hoisted it; `@vitejs/plugin-react@5` then resolved vite 8 while `apps/web` used vite 7, and `npm run dev` returned 500 for every module (`Missing field moduleType`) while `npm test` and `npm run build` still passed. Found by the frontend engineer 2026-09-21. Rule: any workspace that adds vitest without vite relies on the root pin; check `npm ls vite` shows only 7.x after dependency changes.
- `better-sqlite3@12` ships prebuilt binaries inside the package (no compile step, no download at install time).

## Conventions every workspace follows
- Package names: `@site/web`, `@site/api`, `@site/shared`, `@site/qa`. Each is `"private": true, "type": "module"`, extends `tsconfig.base.json`.
- Script names (only define what applies): `dev`, `build`, `test`, `typecheck`. Root scripts fan out with `--workspaces --if-present`.
- `packages/shared` (`@site/shared`) exports TypeScript source directly (`exports` points to `src/index.ts`); no build step. The web app uses `import type` only, so zod is not bundled into the browser.
- Text length limits count UTF-16 code units (`.length`), matching HTML `maxlength`. Zod 4's `.min()/.max()` on strings count code points, so `@site/shared` uses explicit `.length` refines; do not "simplify" them.
- Ports: web dev server `5173`, API `3001`, bound to `127.0.0.1`. Vite proxies `/api` to the API, so the browser sees one origin (no CORS, cookies work with `SameSite=Strict`). The API sends no CORS headers.
- Web must be CSP-clean so a strict production policy is possible: no inline `<script>`, no `eval`, no third-party requests (fonts and assets are self-hosted or system fonts).
- All user-supplied text (guestbook, terminal input) is treated as data: rendered as text nodes, never `innerHTML`/`dangerouslySetInnerHTML`.
- Config through environment variables only; `apps/api/.env.example` lists every variable with placeholders. `.env` is gitignored.
- Branch and PR flow: see `ownership-map.md` ("Working agreements").

## Consequences
- MVP `start` runs via `tsx`, not a compiled bundle. Acceptable locally; revisit in Phase 3 (deploy).
- Static hosting of the web build by the API (single-process production) is out of MVP; decided in Phase 3.
- SQLite is single-writer. Fine for a personal site; a Postgres move would be a new ADR.

# feat/web-shell: web app shell (task F1)

Author: frontend-engineer. Branch: `feat/web-shell`. Base: `main` at 08e589b. Worktree: `.worktrees/web`.

## What changed
`apps/web` only, plus the lockfile entries produced by `npm install -w @site/web`. A neutral, working shell: no terminal, no API calls, no visual identity (Creative Director specs are not merged yet; F5 adds tokens).
- `package.json`: scripts `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`.
- `vite.config.ts`: dev server `127.0.0.1:5173` (`strictPort`), preview `127.0.0.1:4173`, both proxy `/api` to `http://127.0.0.1:3001`; Vitest config (jsdom, setup file) lives in the same file.
- `tsconfig.json` extends `../../tsconfig.base.json` (strict; adds DOM lib, `jsx: react-jsx`, `vite/client` types).
- `index.html` (no inline script, no external URLs, `data:,` favicon so the browser makes no favicon request), `src/main.tsx`, `src/App.tsx` (placeholder `<main>` + `<h1>`), `src/index.css` (neutral dark, system monospace stack).
- Tests: `src/App.test.tsx`, `src/index-html.test.ts`, `src/config.test.ts`; `src/test/setup.ts` (jest-dom matchers, explicit RTL cleanup because Vitest globals are off).
- `apps/web/README.md` updated with the scripts.

## New dependencies (all in `apps/web`, all as the ADR / kickoff specify)
| Package | Type | Why |
|---|---|---|
| `react`, `react-dom` `^19` | runtime | UI (ADR). Only runtime deps. |
| `vite` `^7` (7.3.6) | dev | Dev server and build (ADR; not upgraded past 7, Node 22.12) |
| `@vitejs/plugin-react` `^5` (5.2.0) | dev | JSX/Fast Refresh (plugin-react 6 needs Vite 8) |
| `vitest` `^5` (5.0.1) | dev | Test runner (ADR) |
| `jsdom` `^28` (28.1.0) | dev | DOM for tests (29+ needs newer Node 22) |
| `@testing-library/react` `^16`, `@testing-library/dom` `^10` | dev | Component tests; `dom` is RTL's peer dependency |
| `@testing-library/jest-dom` `^7` | dev | `toBeInTheDocument` etc. matchers |
| `@types/react`, `@types/react-dom` `^19` | dev | Types |

`@testing-library/user-event` was installed and removed again (not used yet; F2 adds it if needed). No router, state library, Tailwind, or UI kit.

## How to test
```
npm install
npm test -w @site/web
npm run typecheck -w @site/web
npm run build -w @site/web
npm run lint                      # root ESLint, covers apps/web
npm run dev -w @site/web          # http://127.0.0.1:5173
```

## Output seen (2026-09-21, Node v22.12.0, npm 11.6.1), all from this branch's worktree

`npm test -w @site/web` (exit 0):
```
 RUN  v5.0.1 /Users/jansenfleming/Documents/My_Team/.worktrees/web/apps/web

 Test Files  3 passed (3)
      Tests  7 passed (7)
   Duration  680ms
```
Tests: App renders a `main` landmark and level-1 heading, and no script/iframe/img nodes; `index.html` has only external-`src` module scripts, no inline handlers, no external origins, and a `#root`; the Vite config binds `127.0.0.1:5173` with `strictPort` and proxies `/api` to `127.0.0.1:3001` for dev and preview. `config.test.ts` runs under `@vitest-environment node` because esbuild (loaded by the config) does not run under jsdom.

Negative check that the inline-script test is live: I temporarily added `<script>alert(1)</script>` to `index.html`; the run failed (`× has no inline script ... AssertionError: expected null to be truthy`, `Tests 1 failed | 6 passed`, exit 1). File restored; it is not in the commit.

`npm run typecheck -w @site/web` (`tsc --noEmit -p tsconfig.json`): exit 0, no output.

`npm run build -w @site/web` (exit 0):
```
vite v7.3.6 building client environment for production...
✓ 29 modules transformed.
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-B25urSPA.css    0.19 kB │ gzip:  0.17 kB
dist/assets/index-BPUhLTGv.js   222.77 kB │ gzip: 69.43 kB
✓ built in 445ms
```
JS is 69.4 kB gzipped against the 250 kB budget. `dist/index.html` (whole `<head>` script/link lines): `<script type="module" crossorigin src="/assets/index-BPUhLTGv.js"></script>` and one stylesheet link; `grep -c "<script"` returns 1, and that one has a `src` (no inline script).

`npm run lint` (root, `eslint .`): exit 0, no output. `npm audit --audit-level=high`: `found 0 vulnerabilities`. Root `npm run typecheck`, `npm test`, `npm run build` fan out to `@site/web` and pass with the same output as above (the other workspaces define no scripts yet).

`npm run dev -w @site/web` (run in the background, then stopped):
```
  VITE v7.3.6  ready in 152 ms
  ➜  Local:   http://127.0.0.1:5173/
```
`curl -i http://127.0.0.1:5173/` returned `HTTP/1.1 200 OK` with the HTML; `curl http://127.0.0.1:5173/src/main.tsx` returned 200.

Proxy check: the real API does not exist yet, so I ran a throwaway 3-line Node stub on `127.0.0.1:3001` (kept in the session scratchpad, not in the repo) that echoes the path. `curl -i http://127.0.0.1:5173/api/health` returned `HTTP/1.1 200 OK` with `{"stub":true,"url":"/api/health"}`, so the `/api` proxy path works. Both processes were stopped afterwards (`lsof` on 5173 and 3001 shows nothing).

## Not verified / notes for reviewers
- **No browser was opened.** I did not look at the page or the console in a browser and did not run `npm run preview`; jsdom tests, `curl`, and the build output are the only evidence. The React tree mounting in a real browser is untested.
- **Proxy tested against a stub**, not the real API (B2 is not merged). Cookies and the real `/api/health` body are untested.
- **Dev-only inline script:** in `npm run dev`, `@vitejs/plugin-react` injects an inline React-refresh `<script type="module">` into the served HTML. That is dev-server behavior and is not in the production build (`dist/index.html` has none). QA's `check-dist` should target `dist/`, not the dev server.
- `npm install` prints `EBADENGINE` for `eslint-visitor-keys@5.0.1` (needs Node ^22.13, pulled in by the root's `typescript-eslint`, not by `apps/web`). It is a warning only and lint passes; Architect may want to note it next to the ESLint deprecation in the ADR.
- `apps/web/dist/` is gitignored and not committed. `package-lock.json` changes are only those produced by `npm install -w @site/web`; if it conflicts on merge, take `main`'s and re-run `npm install` (per ownership map).
- No `@site/shared` import yet (B1 not merged). No design tokens or content files (F5 / F4).

## Status
Ready for QA gate. Nothing pushed; `origin` untouched.

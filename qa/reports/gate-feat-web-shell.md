# Gate: feat/web-shell (F1)

- Verdict: PASS
- Branch: `feat/web-shell` at commit `7346c34c74ba35295985db267051e57600aabd6a` (this gate covers this commit only)
- Author: frontend-engineer
- Gated by: security-qa-engineer, 2026-09-21
- Worktree used: `.worktrees/qa-check-web-shell` (detached at the commit, read-only, removed afterward)
- PR file reviewed: `docs/prs/feat-web-shell.md`
- Node v22.12.0, npm 11.6.1. All traffic was to `127.0.0.1` only.

## Verdict rule
FAIL on any open Critical or High finding, a failing test, a failing hygiene tool, or edits outside the author's owned paths. None of these occurred. No findings were filed against this branch.

## Commands run and real output
| Command (from the check worktree) | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `found 0 vulnerabilities` |
| `npm test` | 0 | `Test Files 3 passed (3)`, `Tests 7 passed (7)` |
| `npm run typecheck` | 0 | `tsc --noEmit -p tsconfig.json`, no output |
| `npm run lint` | 0 | `eslint .`, no output |
| `npm run build` | 0 | see below |
| `node qa/tools/scan-secrets.mjs --root <check worktree>` | 0 | `47 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS` |
| `npm audit --audit-level=high` | 0 | `found 0 vulnerabilities` |

```
vite v7.3.6 building client environment for production...
✓ 29 modules transformed.
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-B25urSPA.css    0.19 kB │ gzip:  0.17 kB
dist/assets/index-BPUhLTGv.js   222.77 kB │ gzip: 69.43 kB
✓ built in 431ms
```

## Build output (`apps/web/dist/`), inspected with a script, not just the author's test
```
inline scripts: none
event handler attrs: none
external URLs in html: none
apps/web/dist/index.html                 480 bytes; http(s) URLs: none
apps/web/dist/assets/index-B25urSPA.css  191 bytes; http(s) URLs: none
apps/web/dist/assets/index-BPUhLTGv.js   222767 bytes; http(s) URLs: react.dev/errors/ (React error-message text, never fetched) and the w3.org XML namespace strings (MathML, SVG, XLink, XML) that React uses to create elements
```
`dist/index.html` contains exactly one `<script type="module" crossorigin src="/assets/index-BPUhLTGv.js">` and one stylesheet link, both same-origin. No `.map` files. No `.env` or secret-shaped strings (scanner over the tree passed).

## Servers (localhost only)
- `npx vite --port 5173` and `npx vite preview` were started from the check worktree. `lsof -nP -iTCP:5173 -iTCP:4173 -sTCP:LISTEN` showed only `127.0.0.1:4173` and `127.0.0.1:5173` (IPv4 loopback, not `*` or `0.0.0.0`).
- `curl -i http://127.0.0.1:4173/` returned `200`, `Content-Type: text/html`, `Cache-Control: no-cache`. The preview server sends no security headers (no CSP, `X-Content-Type-Options`, `X-Frame-Options`). That is expected for a Vite static preview; production headers are Phase 3 (threat T13, roadmap) and not this branch's job.
- `curl -i http://127.0.0.1:4173/api/health` with no API running returned `500 Internal Server Error`, `text/plain`, empty body: Vite's proxy failing to reach `127.0.0.1:3001`. Informational: when the API is down, the client will see a bare 500 that is not in the contract's `ApiError` format, so the F3 client must tolerate non-JSON error bodies (a test for it belongs in F3).
- Dev server HTML (`curl http://127.0.0.1:5173/ | grep -c '<script'`) shows 3 script lines: the React-refresh inline preamble and the Vite client, as the author said. Dev-only; `dist/` is what counts and is clean.
- Both servers were killed afterward; no listeners left on 5173/4173.

## Source review (static)
- `grep -rnE "innerHTML|dangerouslySetInnerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|localStorage|sessionStorage" apps/web/src apps/web/index.html`: no matches.
- `App.tsx` is static placeholder text; no user input, no API calls yet.
- `vite.config.ts`: dev and preview bind `127.0.0.1`, `strictPort: true`, proxy `/api` to `http://127.0.0.1:3001`, `sourcemap: false`. Matches ADR 0001.
- New dependencies match the PR file and ADR pins (`react`/`react-dom` 19, vite 7, plugin-react 5, vitest 5, jsdom 28, testing-library). Only `esbuild` 0.28.2 (a transitive dependency of vite) has an install script; it is the standard binary check, no finding. `npm audit`: 0 vulnerabilities.

## Ownership check
`git log --no-merges --name-only 08e589b..7346c34`: only `apps/web/**`, `docs/prs/feat-web-shell.md`, `package-lock.json`, plus one architect-authored review/board/ADR file that arrived through a merge from `main` (not authored by this branch). No edits to `apps/api`, `packages`, `qa`, `.github`, or root config. OK.

## QA cases run
W-DIST-1 (no inline script, no third-party hosts): PASS. W-DIST-2 (no maps/secrets in dist): PASS. W3 (dangerous sink grep): PASS, nothing to find yet. A-HDR-6 analogue for the web servers (loopback bind): PASS. H-SEC-1, H-DEP-1: PASS. W1, W2, W4 to W9: not applicable yet (no guestbook or terminal UI exists).

## Findings
None.

## Not verified
- **No browser was available.** Nothing was loaded in a real browser: no check that the React tree mounts, no console errors, no CSP or cookie behavior, no responsive or accessibility check (W-A11Y-M is a manual checklist and is not run at this stage). Evidence is jsdom tests, `curl`, `lsof`, and inspection of `dist/`.
- The `/api` proxy was not tested against the real API (B2 not merged); only the failure case (API down) was observed.
- Production response headers and CSP do not exist yet.

## Recommendation to Architect
Merge. Small, contract-neutral shell; `dist/` is CSP-clean and every hygiene tool is green. Carry two notes into later gates: F3 must handle non-JSON proxy errors, and re-run the `dist/` inspection at F5 (bundle size, no external requests).

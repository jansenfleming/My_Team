# ADR 0002: Hosting (GitHub Pages, frontend only)

Status: accepted (owner decision relayed by the lead, 2026-09-21). Change only through a new ADR.

## Context
The owner wants the site public as a resume piece. The stack (ADR 0001) is a static React app plus a Fastify + SQLite API with cookie sessions. Only GitHub is available and approved; the repo is `jansenfleming/My_Team`.

## Decision
Publish **only the static web build** on GitHub Pages as a project page: `https://jansenfleming.github.io/My_Team/` (no custom domain). **The API is not deployed.** The full stack keeps running locally (`npm run dev`).

The published site is therefore a **static demo**: the terminal, boot sequence, static commands (`help`, `about`, `agents`, `build`, `clear`, `whoami`'s local block, easter eggs) all work; every API-backed command shows the honest offline lines from `docs/design/terminal-commands.md` (section 4). "Uplink offline" is a real reading, not a fake one, because the build genuinely has no backend.

## Why
- Zero cost, no new accounts, no secrets to manage, and it fits "local-first, owner approves every external step".
- Keeps the security surface small: a static site has no auth, no database, no user-writable data.

## Rejected
- **Pages + API on another host.** Needs cross-origin auth: `github.io` is on the public suffix list, so a separate API host is cross-site and `SameSite=Strict` cookies would not be sent. It would require `SameSite=None; Secure`, CORS with credentials, a new Origin allow-list and CSRF design, TLS and a host account. The contract currently says "no CORS headers". This is a Phase 2 option and needs a threat-model review and a new contract version first.
- **Netlify / Vercel / Cloudflare Pages / a VPS:** new accounts, more moving parts, not needed for a static demo.
- **Serving the API from the same origin on a VPS:** requires infrastructure the owner has not approved.

## Requirements this creates
Frontend (apps/web):
1. **Base path.** Vite `base` is configurable through `VITE_BASE`. Build default is `/My_Team/`; dev stays `/`. No root-absolute asset URLs (`/assets/...` in source or `src="/..."` in output); everything is relative to `base`.
2. **No server-side routing.** Single view; any future page uses hash routes (`#/...`), because Pages cannot rewrite unknown paths to `index.html`.
3. **Static flag.** `VITE_UPLINK=off` at build time. In that build the API client never calls `/api` (no `fetch` at all, tested with a spy), the boot check reports the uplink as offline, `status` prints the offline reading, and every API-backed command prints the D4 error lines. Default (flag unset) is the normal full-stack behavior. Script: `npm run build:static -w @site/web`.
4. **CSP meta.** Pages cannot set response headers, so the production build injects `<meta http-equiv="Content-Security-Policy">` into `dist/index.html` (not in dev: Vite's dev server needs an inline preamble). The no-inline-script rule stays. Suggested policy: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'`; the Frontend Engineer confirms it with the built output. `frame-ancestors`, `sandbox` and `report-uri` are ignored in a meta tag.
5. Nothing personal in the build except `[PLACEHOLDER: ...]` values and the name; the whole build is public.

Backend (`.github/**`):
6. `.github/workflows/deploy-pages.yml`: trigger **`workflow_dispatch` only** (no push, no schedule); job-level minimal permissions (build job `contents: read`; deploy job `pages: write` and `id-token: write`); `environment: github-pages`; official `actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`, each **pinned to a full 40-character commit SHA with the version tag in a comment**; builds with `npm ci` and `npm run build:static -w @site/web`; uploads `apps/web/dist`. Agents cannot query GitHub, so the lead supplies the SHAs (see board B7). Nothing publishes automatically.

QA:
7. The threat model records what Pages cannot provide: no `X-Frame-Options` / CSP `frame-ancestors` (clickjacking cannot be prevented, only meta CSP is available), no `X-Content-Type-Options`, no `Referrer-Policy` header (use `<meta name="referrer" content="no-referrer">`), 10-minute CDN caching of deploys, a public repo and build, and the deploy workflow as a supply-chain surface.

## Owner and lead steps (agents do none of these)
1. The owner approves the first publish. 2. The lead sets Settings > Pages > Source to "GitHub Actions". 3. The lead runs the workflow (`workflow_dispatch`) once QA has gated B7 and F7 and the Architect has approved. Until then the site keeps showing the README.

## Consequences
- The live site cannot demonstrate login, the guestbook, or diagnostics. Screens or a recorded local session can show the full stack (the owner's call).
- The API's security work still matters: it is demonstrated locally and by CI.
- Phase 2 option "hosted API" is recorded in the roadmap; it starts with a threat-model review, a contract v2 for cross-origin, and an ADR.

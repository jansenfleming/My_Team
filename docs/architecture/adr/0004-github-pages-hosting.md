# ADR 0004: GitHub Pages hosting — Actions-based deploy, base path, and SPA fallback

Status: accepted (Architect, 2026-09-27). Change only through a new ADR.

## Context
ADR 0003 (streetwear pivot) named GitHub Pages as the likely host for ZeroJance — same
static, free, no-backend reasoning ADR 0002 used for the old terminal project — but
explicitly deferred the actual decision "to a fresh ADR once the build is close to
shippable, not guessed now." `docs/architecture/mvp-readiness.md` (A3, 2026-09-25)
recommended **go**: D1-D5, E1-E7, and A1-A3 are done, plus a follow-up (`chore/web-
founder-story`) replacing the founder-story placeholders with the owner's real content.
That point has arrived; this is Phase 2 backlog Rank 3.

The lead independently confirmed GitHub Pages is already **enabled** on this repo, but
misconfigured for this project: it's set to the legacy "Deploy from a branch" source,
Jekyll-processing `main`'s root. Curling `https://jansenfleming.github.io/My_Team/`
directly returns Jekyll's default-theme rendering of the repo's `README.md`, not the
built app. The repo is `jansenfleming/My_Team`, so the live URL is necessarily a
**project page** — `https://jansenfleming.github.io/My_Team/` — not a user page. There
is no separate `jansenfleming.github.io` repo to make it a bare-domain user page. This
is the same URL shape ADR 0002 used for the old project, but it matters concretely here
because it means the deployed app needs a `/My_Team/` base path baked into every built
asset URL, not root-relative paths — the exact requirement ADR 0002 §"Requirements this
creates" already specified once, for a different app.

Three things need deciding: (1) confirm the host, (2) how the Pages source builds and
serves the site, (3) how the Vite build and the app's own client-side router agree on
where `/My_Team/` sits, so direct hits and hard refreshes on deep routes (e.g.
`/My_Team/product/exit-code-0-tee`) don't 404 for real.

## Decision

### 1. Confirm GitHub Pages as the host
Static-only, free, no new account, no secrets to manage — same reasoning ADR 0002 used
for the old project and ADR 0003 anticipated for this one. ZeroJance has no backend to
expose (ADR 0003), so nothing about a static host is a compromise here. Accepted.

### 2. Switch the Pages source from the legacy Jekyll branch-builder to Actions
The current "Deploy from a branch" source runs GitHub's Jekyll build over the whole
repo root on every push to `main` — it has no concept of "build `apps/web`, deploy its
`dist/`," and actively mis-renders this repo (a Vite SPA, not a Jekyll site) via the
default theme. It cannot be pointed at a build step at all; the only lever it exposes is
"which branch/folder to serve raw."

Decision: **switch Settings > Pages > Source to "GitHub Actions."** A new
`.github/workflows/deploy-pages.yml` (Engineer to write, see the kickoff note in
§5) builds `apps/web` with `npm ci && npm run build` and deploys only
`apps/web/dist/` via the official `actions/upload-pages-artifact` +
`actions/deploy-pages` actions — the same pattern ADR 0002 specified for the old
project's (never-triggered) deploy workflow.

**`.nojekyll`, researched and confirmed**: yes, the built output still needs an empty
`.nojekyll` file even under the Actions-based deploy path. Two independent reasons,
confirmed via GitHub's own documentation and the `actions/deploy-pages`/`upload-pages-
artifact` project pages (not assumed from the old, branch-builder-era default):
- GitHub's Pages *serving* layer (not just the branch-builder's build step) treats a
  missing `.nojekyll` as license to apply Jekyll-era conventions to how it serves the
  artifact, including skipping/mishandling underscore-prefixed files or directories
  (Jekyll's own `_`-prefix-means-special-directory convention, e.g. `_layouts`,
  `_includes`). Vite's default output (`assets/*.js`, `assets/*.css`, `index.html`)
  doesn't currently emit underscore-prefixed paths, so this is low-probability today,
  but it's a zero-cost, standard-practice guard against a real, documented class of
  silent-404/wrong-content-type failures if that ever changes (a new dependency, a
  different chunking strategy, etc.) — cheaper to ship now than to debug later.
  GitHub's own blog post on this ("Bypassing Jekyll on GitHub Pages") and the widespread
  convention of static-site generators (VitePress, Astro, Next static export, etc.)
  shipping a `.nojekyll` file in their official GitHub Pages deploy guides confirm this
  is still standard practice under Actions-based deploys, not just the old branch
  builder.
- A separate, sharper gotcha found during this research and worth flagging directly to
  the Engineer: **`actions/upload-pages-artifact` v4+ excludes dotfiles from the
  uploaded artifact by default.** If the workflow relies on a `.nojekyll` file sitting
  in `apps/web/dist/` at upload time, it will be silently dropped unless the upload step
  passes `include-hidden-files: true`. The workflow must either set that input, or
  create `.nojekyll` as a post-upload/pre-upload step that the pinned artifact-action
  version actually preserves — the Engineer must check the pinned version's default
  before assuming either path works.

### 3. Base path: `base: '/My_Team/'` in production, `/` in local dev
Vite bakes the `base` config value into every built asset URL (`<script src="...">`,
`<link href="...">`, dynamic `import()` paths). Left at the default (`/`), the built
`index.html` requests `/assets/index-*.js` — which 404s on a project page, because the
app is actually served under `/My_Team/assets/index-*.js`. This is precisely the
requirement ADR 0002 §"Requirements this creates" #1 specified for the old project's
same project-page shape; the fix here is the same idea, reapplied.

Decision: **`vite.config.ts`'s `base` option is conditioned on an environment
signal, not hardcoded**, so `npm run dev` and a bare local `npm run build` are
unaffected and only the CI build targets the subpath:

```ts
base: process.env.GITHUB_ACTIONS ? "/My_Team/" : "/",
```

`GITHUB_ACTIONS` is a real, always-set environment variable in every GitHub Actions
runner (no new secret, no new config value to keep in sync) — simpler than ADR 0002's
old `VITE_BASE` env-var indirection, and sufficient here because there's exactly one
build target (GitHub Pages under this one repo name), not a general-purpose override.
If a future host ever needs a different subpath, that's a small follow-up, not a reason
to over-engineer this now.

### 4. Client-side routing under a subpath: the SPA-fallback problem
GitHub Pages serves static files with no server-side rewrite rule — a real HTTP request
for any path other than a file that exists in the deployed artifact returns a real 404
from GitHub's edge, before the app's own JavaScript ever loads. Concretely: navigating
*within* the running app (clicking a `<Link>`, which calls `history.pushState`) works
fine, because no new request is made. But a **direct hit or hard refresh** on, say,
`https://jansenfleming.github.io/My_Team/product/exit-code-0-tee` is a real GET request
to GitHub's servers for a file at that exact path, which doesn't exist in `dist/` (only
`index.html`, `assets/*`, and now `.nojekyll` do) — Pages returns its own generic 404,
and the app's own `NotFoundPage`/router never even loads. ADR 0003 flagged this exact
interaction as a known risk to check before choosing Pages again; this confirms it's
real and specifies the fix.

Decision: the standard, well-known **"spa-github-pages" pattern** — a `404.html` in the
deployed output that is a copy of `index.html` (so Pages' fallback-to-404-page behavior
still loads the full app shell and its JS bundle), plus a small redirect script pattern
so the app's router recovers the originally-requested path once it's loaded, and a
matching decode step in the app's own router init. Specifically, for the Engineer to
build (see §5):
- Ship `apps/web/public/404.html` as a copy of `index.html` (Vite's `public/` directory
  is copied byte-for-byte into `dist/`, so this requires no build-step change — just add
  the file).
- Because a straight copy alone would load the app shell but still show whatever route
  the *app's own* router thinks it's on (which, without more, would default to `/` or
  "not found" and lose the originally-requested URL), the app needs the small,
  well-documented "redirect via query string, then decode it back" trick: Pages serves
  `404.html` for the unmatched path, a tiny inline script in `404.html` encodes the
  requested path into a query string and does a client-side redirect to
  `/My_Token/?/product/exit-code-0-tee` (or equivalent), and `Router.tsx`'s
  initialization reads that query string on first load, calls
  `history.replaceState` to restore the real path, and proceeds to `matchRoute` as
  normal. This is a client-side-only trick (no server involved beyond Pages serving a
  static file), consistent with ADR 0003's "no server-side routing" stack decision.
- **Confirmed: `matchRoute.ts`/`Router.tsx` need a basename concept that they don't have
  today.** Both files currently read/write `window.location.pathname` as if the app's
  root were `/` (`matchRoute`'s `normalize()` treats `/` as home; `Router.tsx`'s
  `currentPathname()` returns the raw `pathname`, and `navigate()` calls
  `pushState`/`replaceState` with the caller's `to` value directly, with no prefix
  logic). Under `/My_Team/` in production, `window.location.pathname` for the home page
  is `/My_Team/`, not `/`, and every `<Link to="/catalog">` needs to actually navigate to
  `/My_Team/catalog`, not `/catalog`. This needs a single shared basename constant
  (derived the same way as the Vite `base` value, e.g. from `import.meta.env.BASE_URL`,
  which Vite sets automatically to match its `base` config — no second source of truth
  to keep in sync) applied consistently in exactly three places: stripping it before
  handing a path to `matchRoute`, prepending it in `Link`'s `href` and in
  `navigate()`'s `pushState`/`replaceState` calls, and in the 404-redirect decode step
  above. Local dev is unaffected because `import.meta.env.BASE_URL` is `/` there (per
  the §3 decision), so the basename is a no-op string in dev and only actually prefixes
  paths in the production build.

### 5. Scope of this ADR: decision and specification only
This ADR decides and specifies; it does not implement. No code, config, or workflow YAML
in this repo changes as part of this ADR. The following is a kickoff note for whichever
task picks this up next (an Engineer task, blocked on this ADR merging):

**Engineer task: implement ADR 0004**
- `apps/web/vite.config.ts`: add the conditional `base` per §3.
- `apps/web/src/router/Router.tsx` and `matchRoute.ts`: add the basename handling per
  §4's third bullet — derive it from `import.meta.env.BASE_URL`, strip/prepend it
  consistently in `currentPathname()`, `navigate()`, `Link`, and `matchRoute`'s input.
  Add unit tests for both the `/` (dev) and `/My_Team/` (prod) basename cases, since
  `matchRoute.test.ts` and `Router`'s existing tests currently only exercise the `/`
  case.
- `apps/web/public/404.html`: add the SPA-fallback file per §4's first two bullets (copy
  of `index.html`'s shell plus the redirect-via-querystring script), and the matching
  decode logic in the router's init path (likely `Router.tsx`'s mount effect, or a small
  new module it calls once on startup).
- `.github/workflows/deploy-pages.yml` (new file, `.github/**` is Engineer-owned per
  `docs/architecture/ownership-map.md`): `workflow_dispatch`-only trigger (no push
  trigger — nothing deploys automatically, matching ADR 0002's discipline and this
  project's "owner approves every deploy" boundary), minimal job-level permissions
  (`contents: read` for the build job; `pages: write` and `id-token: write` for the
  deploy job), `environment: github-pages`, official actions
  (`actions/checkout`, `actions/setup-node`, `actions/configure-pages`,
  `actions/upload-pages-artifact`, `actions/deploy-pages`) each pinned to a full
  40-character commit SHA with the version tag in a comment (agents cannot query GitHub
  for current SHAs — the lead supplies them, same process ADR 0002 used). Build step:
  `npm ci && npm run build -w apps/web` (adjust to this repo's actual workspace script
  name). Add the empty `.nojekyll` file to `apps/web/dist/` as a build step (e.g. `touch
  apps/web/dist/.nojekyll` after the Vite build, before the upload step) and set
  `include-hidden-files: true` on the `upload-pages-artifact` step per §2's dotfile
  gotcha — verify against whatever action version the lead pins, since this default
  changed between major versions.
- Verification the Engineer must actually run and paste into the PR file (not just
  assert): a local `npm run build` with `GITHUB_ACTIONS=true` set, serving the resulting
  `dist/` from a local static server mounted at a `/My_Team/` subpath (e.g.
  `npx serve dist -l 4173` reverse-proxied, or any equivalent local reproduction of a
  project-page subpath), confirming (a) the home page loads with no 404s in the network
  tab, (b) a `<Link>` navigation to a product page works, and (c) a hard refresh on that
  product page's URL also works (proving the `404.html` fallback path, not just the
  in-app navigation path).
- Not this task's job: pushing, running `gh`, changing the Pages source setting in
  GitHub's UI, or triggering the workflow. Per the brief's approval boundaries, the lead
  sets Settings > Pages > Source to "GitHub Actions" and runs the workflow only after
  the owner approves the first publish — same two-step gate ADR 0002 specified and this
  ADR does not relax.

## Rejected
- **A custom domain.** Not requested by the owner, adds DNS configuration and a TLS/
  certificate dependency on top of a decision that's already fully solved by the
  existing `github.io` project-page URL. Skip for now; a later ADR can revisit if the
  owner asks for one specifically.
- **A different static host (Netlify, Vercel, Cloudflare Pages).** GitHub Pages is free,
  needs no new account, and is already half-configured (enabled, just pointed at the
  wrong source). None of the other hosts offer a capability this project needs that
  Pages lacks — there is no reason to add a new account and a new deploy surface for a
  decision this well-trodden. Same reasoning ADR 0002 used to reject these for the old
  project.
- **`HashRouter`-style `#/path` routing to sidestep the subpath/refresh problem
  entirely.** A hash fragment is never sent to the server, so a hard refresh on
  `/My_Team/#/product/exit-code-0-tee` always re-serves `index.html` with no fallback
  trick needed — genuinely simpler to host. Rejected anyway: it produces uglier,
  less-shareable URLs (`#/` clutter on every link), the existing hand-rolled router
  (`matchRoute.ts`/`Router.tsx`, chosen deliberately in E1 over a routing library) already
  works correctly today against real paths, and 157/157 tests plus every prior
  Architect review assume path-based routes. Switching routing strategy now to avoid a
  well-understood, standard, one-time hosting fix is worse than just fixing the
  base-path/fallback problem properly (§3-4). If a future host without SPA-fallback
  support ever makes this untenable, that's a reason to revisit then, not now.

## Consequences
- No app code, no `vite.config.ts`, no workflow YAML changes yet — this ADR unblocks a
  new Engineer task, not a re-decision. `apps/web/src/router/**` and `apps/web/vite.
  config.ts` stay Engineer-owned per the ownership map; `.github/**` is also Engineer-
  owned there already (currently empty, "needed only once CI or a Pages deploy is set
  up" — that point has now arrived).
- Local dev workflow (`npm run dev`, a bare local `npm run build`) is unaffected: the
  `GITHUB_ACTIONS`-conditioned `base` and the basename logic are both no-ops outside a
  GitHub Actions runner.
- The site keeps showing the Jekyll-rendered README until the lead completes the two
  manual steps in §5 (flip the Pages source, then run the workflow) after the owner
  approves the first publish. Nothing in this ADR or its follow-up Engineer task
  deploys anything.
- Once live, every internal link and asset URL must be re-verified against the actual
  `/My_Team/` subpath in production (not just in local dev), since dev has historically
  been the only environment exercised — this is exactly the class of bug ("works in dev,
  404s in prod") the conditional `base` and basename work in §3-4 exists to prevent, and
  the Engineer's verification step in §5 is written to catch it before merge, not after
  the owner sees a broken live site.

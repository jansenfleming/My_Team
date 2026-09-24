# Review: `feat/web-shell` (E1 — web shell and routing)

Reviewer: Architect. Date: 2026-09-24. Branch base: `main` at f44f356 (merge-base
confirmed via `git merge-base main feat/web-shell`). Two commits, not pushed. PR file:
`docs/prs/feat-web-shell.md` (rewritten by this branch — the copy that existed on `main`
before this branch was stale content from the old, superseded terminal project that
happened to reuse the same branch/file slug; left alone per the ownership map, now
correctly replaced).

## Verdict: **Changes needed** — one small, specific fix, everything else approved

Everything below passed except §5 (modified-click test coverage). This is not a design
or ownership problem, just a missing test for behavior that's already correctly
implemented. Should be a fast turnaround; happy to re-review as soon as it's pushed.

## 1. Does it deliver E1's board scope?

Board E1: "client-side routing for home/catalog/product-detail/lookbook/about/404 ...
mobile-first responsive layout skeleton, placeholder copy/nav until D1-D4 land." All
present:
- `apps/web/src/router/matchRoute.ts` — pure function, all 6 route shapes, trailing-slash
  normalization, slug decoding, empty-slug fallback to 404. Unit tested
  (`matchRoute.test.ts`, 10 cases).
- `apps/web/src/router/Router.tsx` — `RouterProvider`/`useRouter`/`Link`, History API,
  `popstate` listener.
- `apps/web/src/App.tsx` — wires matcher + router + six page components, sets
  `document.title` per route.
- `apps/web/src/layout/Layout.tsx` — skip link, single `<main id="main-content">`
  landmark, header/nav that collapses behind a real `<button aria-expanded
  aria-controls>` under the 640px breakpoint (CSS-only breakpoint switch, no JS media
  query duplication), `aria-current="page"` on the active nav link,
  `prefers-reduced-motion: reduce` disables the nav transition (confirmed at
  `index.css:196`).
- Six placeholder pages, each honestly labeled with which later board task replaces it;
  `AboutPage`/footer correctly use `[PLACEHOLDER: ...]` rather than inventing brand or
  owner copy.
- `index.css`: mobile-first grid skeleton for the catalog placeholder, dark placeholder
  palette (`#0b0d10` bg / `#d7dde5` text — comfortably >4.5:1, though this is explicitly
  throwaway pending D2 tokens).

Not in scope for E1 and correctly absent: product data, cart, lookbook/about real
content, easter eggs.

## 2. Ownership check

`git diff f44f356..feat/web-shell --stat` (the correct diff — diffing against current
`main` tip is misleading here since `main` has since gained D1's merge and a plain
`main..feat/web-shell` diff shows D1's files as "removed," which they are not; the
branch simply predates them):

```
apps/web/README.md                     |  21 +++-
apps/web/src/App.test.tsx              |  82 +++++++++++--
apps/web/src/App.tsx                   |  59 ++++++++-
apps/web/src/index.css                 | 184 +++++++++++++++++++++++++++-
apps/web/src/layout/Layout.tsx         |  66 ++++++++++
apps/web/src/pages/*.tsx               | (6 new files)
apps/web/src/router/*.ts(x)            | (4 new files)
docs/prs/feat-web-shell.md             | 214 ++++++++++++++++++++++-----------
15 files changed, 821 insertions(+), 89 deletions(-)
```

Only `apps/web/**` and `docs/prs/feat-web-shell.md`. Nothing in `docs/design/**`,
`.claude/**`, `docs/architecture/**`, or any other Architect/Creative-Director path.
Clean.

## 3. Hard-rule check

- **No server/network calls:** `git grep -n -iE "fetch\(|XMLHttpRequest|axios|WebSocket|EventSource"` on the branch's `apps/web/src` — no hits. `index.css` has no `url()`/`@import`/external `http` references (system monospace stack only, no third-party font requests). `dist/index.html` after build references only its own hashed local assets.
- **No real payment logic:** none present, none expected at E1 (cart is E3/E4).
- **Dependencies stayed minimal:** `git diff f44f356..feat/web-shell -- apps/web/package.json package-lock.json` is empty. Zero new dependencies, matching the PR's claim exactly.

## 4. Real command output (reproduced myself, not taken from the PR file)

Ran from this worktree, `git checkout --detach f378388` (the branch tip), Node
v22.12.0, npm 11.6.1, 2026-09-24:

```
$ npm install
npm warn EBADENGINE eslint-visitor-keys@5.0.1 (needs Node ^22.13/^20.19/>=24; pre-existing, unrelated to this branch)
npm warn deprecated eslint@9.39.5 (pre-existing)
added 307 packages, and audited 309 packages in 2s
found 0 vulnerabilities

$ npm run typecheck    -> exit 0, no output (tsc --noEmit clean)
$ npm run lint         -> exit 0, no output (eslint . clean)

$ npm test
 Test Files  4 passed (4)
      Tests  25 passed (25)
   Duration  1.14s
 (tools/*.test.mjs scan-secrets self-test: 9/9 pass, unrelated to this branch)

$ npm run build
vite v7.3.6 building client environment for production...
✓ 38 modules transformed.
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-B8Te94on.css    2.22 kB │ gzip:  0.94 kB
dist/assets/index-IDxxx1Bq.js   227.73 kB │ gzip: 71.07 kB
✓ built in 446ms

$ cat apps/web/dist/index.html
<script type="module" crossorigin src="/assets/index-IDxxx1Bq.js"></script>
(one <script>, external src, type=module — no inline script; matches the pre-existing
index-html.test.ts CSP guard, which is untouched by this branch and still passes as part
of the 25)

$ npm run scan-secrets
scan-secrets [working-tree]: 98 files scanned, 0 skipped, 0 error(s), 0 warning(s) -> PASS

$ npm run audit:ci
found 0 vulnerabilities
```

Everything matches the PR file's claimed output (down to the same bundle hashes and test
counts) — reproduced independently, not taken on faith.

## 5. Router choice and back/forward/modified-click behavior

**Router choice: sound.** Hand-rolled (`matchRoute` pure function + a thin
`RouterProvider`/`Link` over the History API) rather than `react-router-dom`, for ~6
static route shapes on a frontend-only mockup. Reasoning in the PR file and in
`Router.tsx`'s own header comment matches ADR 0003 (routing library choice explicitly
left to the Engineer for this reason). Zero new dependencies, small bundle, and the
matcher is trivially unit-testable in isolation — good call for this scope. If routing
needs grow later (nested layouts, query strings, scroll restoration), the PR correctly
notes that swapping in a library is a contained change.

**Back/forward: actually tested, not just claimed.** `App.test.tsx` — "responds to
browser back/forward navigation" — clicks a nav link, asserts the URL changed, calls
`window.history.back()`, and asserts (via `waitFor`) the app re-rendered the prior route.
Confirmed by reading the test, and it's part of the 25 passing tests I ran myself.

**Modified-click: implemented, but *not* tested — this is the one required fix.**
`Router.tsx`'s `Link` component correctly checks `event.button !== 0 ||
event.metaKey || event.ctrlKey || event.shiftKey || event.altKey` and returns early
(no `preventDefault`, no `navigate`) so ctrl/cmd/shift-click and non-primary-button
clicks (middle-click) fall through to native browser behavior — right idea, and the code
reads correctly. But `git grep -n "ctrlKey|metaKey|shiftKey|button:"` across the branch's
test files returns nothing: no test exercises this path. `App.test.tsx` only covers a
plain left-click and back/forward; `matchRoute.test.ts` doesn't touch `Link` at all. To
be clear, the PR file doesn't misrepresent this — its "Test breakdown" section lists only
click-navigation, back/forward, `aria-current`, and no-injected-script as tested, and
doesn't claim modified-click is covered. But since the behavior exists in shipped code
with zero coverage, and it's exactly the kind of thing ("ctrl-click to open in a new tab
still works") that's easy to silently regress later, I'm asking for one test before
approval:

**Required:** a test asserting that a modified click (e.g. `ctrlKey: true`, or a
non-primary `button`) on a `Link` does *not* call `preventDefault`/does not trigger
`navigate` (i.e., `window.location.pathname` is unchanged and the event's
`defaultPrevented` is `false`), alongside the existing plain-click test. `fireEvent.click`
with a modifier option (rather than `@testing-library/user-event`, which doesn't model
modified clicks well) is the simplest way to do this. Small, scoped, shouldn't take more
than a few minutes.

## Accessibility spot check (Architect hygiene pass)
Skip link (visually hidden until focus), single `<main>` landmark, nav toggle uses a real
`<button>` with `aria-expanded`/`aria-controls`, active link marked `aria-current="page"`,
`prefers-reduced-motion` respected for the nav transition, placeholder color pair is
high-contrast. No images yet (nothing to alt-text). No broken links: all `Link to=` targets
resolve to one of the 6 registered routes. Nothing further to flag — this is a skeleton,
full a11y pass is E7 per the board.

## Summary
Scope, ownership, hard rules, dependencies, and every command I ran myself all check out
clean and match the PR file's claims exactly. The only gap is the missing modified-click
test noted in §5. Once that lands (same branch, new commit, updated PR file test-count),
message me and I'll re-review quickly — expect a fast approval.

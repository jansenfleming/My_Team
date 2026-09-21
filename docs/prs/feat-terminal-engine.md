# feat/terminal-engine: terminal engine (task F2)

Author: frontend-engineer. Branch: `feat/terminal-engine` (the board says `feat/web-terminal-engine`; the lead named this one). Base: `main` at 916c5fc, then `git merge main` (7463816) before the final run. Worktree: `.worktrees/web`.

## What changed
`apps/web` only, plus the lockfile entries from `npm install -D @testing-library/user-event`. No API calls, no design dependencies (the CSS is neutral and themeable through optional `--terminal-*` custom properties).

Engine, in `apps/web/src/terminal/`:
- `parser.ts` `parseInput(raw, maxLength=1024)`: shell-style split with no expansion. Whitespace (Unicode `\s`) separates; `'single'` quotes literal; `"double"` allows `\"` and `\\`; backslash escapes outside quotes; adjacent parts join; `""` is an empty argument. Errors: `too_long` (checked first, so 10 kB is rejected without tokenizing), `unterminated_quote`, `trailing_escape`. Never alters characters (markup, control characters, `\x1b[31m` lookalikes stay text). Iterates by code point; length counts UTF-16 units like the contract.
- `registry.ts` `createRegistry(defs)`: `name`, `aliases`, `usage`, `summary`, `run(ctx, args)`. Case-insensitive lookup in a `Map` (so `constructor`, `__proto__`, `toString` never resolve). Throws at startup on duplicate or invalid names.
- `history.ts` `CommandHistory`: up/down with draft restore, capped (default 100), skips blank lines and immediate repeats, memory only. Masked input never reaches it.
- `dispatch.ts` `dispatch(raw, ctx, {registry, text, maxInputLength})`: parse, resolve, run, never throws. A thrown or rejected command becomes a generic message (the error text is dropped on purpose). Ctrl+C aborts `ctx.signal` and dispatch stops waiting (`interrupted`). Command output is validated: only `output`/`error`/`system` lines with string text are kept.
- `useTerminal.ts`: state for scrollback (cap 500), input, busy, masked prompt; one command at a time; unmount releases a waiting secret prompt and aborts a running command.
- `Terminal.tsx` + `terminal.css`: `role="region"` containing a `role="log"` (`aria-live="polite"`, `aria-busy` while a command runs) and a form with the prompt and input. Keys: Enter, ArrowUp/Down (history), Ctrl+C (cancel masked prompt, else interrupt, else clear input; copy still works when text is selected), Ctrl+L (clear), Escape (cancel masked prompt). Click anywhere focuses the input unless text is selected. Focus stays on the input; it is never disabled while busy.
- **Text-node rendering only.** Nothing sets `innerHTML`/`dangerouslySetInnerHTML`.
- **Masked prompt:** `ctx.readSecret(label)` swaps in an uncontrolled `<input type="password">`. The value is read from the DOM node on submit, cleared, and handed only to the waiting command's promise: it is not in React state, the scrollback (only the label is echoed), history, storage, or any URL. `maxLength` is `maxSecretLength` (default 256; F4 passes the contract's `PASSWORD_MAX`).

Site copy, kept out of components (per the lead): `apps/web/src/content/site.ts` is the one place for `SITE_NAME`, `PAGE_TITLE`, prompt (`PROMPT_USER`/`PROMPT_HOST`), `WELCOME_LINES`, every engine message and accessible label (`terminalText`), and the placeholder command copy. The engine imports no copy; `App.tsx` passes it in. `content/content.test.ts` fails if the old name (`picket`, case-insensitive) appears anywhere in `apps/web`, or if the site name or prompt string is repeated outside `src/content`.
- `SITE_NAME` is `ZeroJance`, the name recorded on `main` (`docs/architecture/board.md`; the lead's brief said the name was not chosen yet, so this is a one-line change in `site.ts` if that is wrong). The prompt host and welcome banner stay `[PLACEHOLDER: ...]` until D3/D4 land.
- `index.html` keeps a neutral `<title>Web shell</title>`; `main.tsx` sets `document.title` from content at runtime. So a rename touches only `site.ts` for the running app; the static fallback title is a second file, not the site name.
- `src/commands/index.ts`: two placeholder commands, `help` and `clear`, so the terminal is usable in dev. F4 replaces this module. `main.tsx`/`App.tsx` now render the terminal inside the F1 shell.

## New dependency
| Package | Type | Why |
|---|---|---|
| `@testing-library/user-event` `^14` (14.6.7) | dev | Realistic typing, Enter, arrows and Ctrl combos in the component tests. I had removed it in F1; it is now used. |

## How to test
```
npm install
npm test -w @site/web
npm run typecheck -w @site/web
npm run lint
npm run build -w @site/web
```

## Output seen (2026-09-21, Node v22.12.0, npm 11.6.1), from this branch after `git merge main`
`npm test -w @site/web` (exit 0):
```
 Test Files  9 passed (9)
      Tests  77 passed (77)
```
By file: `parser.test.ts` (20 tests: empty, whitespace, quotes, escapes, unicode incl. astral/CJK/RTL/combining/NBSP, markup and shell text stays inert, 10 kB rejected by default and parsed quickly when the limit is raised, UTF-16 counting), `registry.test.ts` (5, incl. prototype-name lookups), `history.test.ts` (8), `dispatch.test.ts` (14: args, alias, async, unknown command, parse errors, too-long never runs, throw leaks nothing, malformed lines dropped, abort), `Terminal.test.tsx` (17), `content/content.test.ts` (4), `App.test.tsx` (4), plus the two F1 test files.

The Testing Library XSS test types `<img src=x onerror=alert(1)>` as a command: the log shows `unknown command: <img`, `log.innerHTML` contains `&lt;img`, and `container.querySelector("img, script, [onerror]")` is null. A second test makes a command return `<img src=x onerror=alert(1)>` and `<script>alert(2)</script>`; both render as text.

Masked-prompt test: type `login alice`, the input becomes `type="password"` (focused, labelled `password:`), type a secret; `document.body.innerHTML` does not contain it while typing or after; the command received it; the scrollback echoes only `$login alice` and `password:`; ArrowUp yields `login alice` and never the secret; `localStorage`/`sessionStorage` are empty; Escape and Ctrl+C hand `null` to the command.

Negative checks that these tests are live (temporary edits, reverted, not committed): making the secret echo into the scrollback failed 2 tests; making `submitSecret` call `history.add(secret)` failed 1; adding a file containing the old name failed the content guard.

`npm run typecheck -w @site/web`: exit 0. `npm run lint` (root): exit 0. `npm audit --audit-level=high`: `found 0 vulnerabilities`.
`npm run build -w @site/web` (exit 0):
```
✓ 40 modules transformed.
dist/index.html                   0.48 kB │ gzip:  0.29 kB
dist/assets/index-atvfZETO.css    1.21 kB │ gzip:  0.58 kB
dist/assets/index-DL1Nhcnd.js   230.69 kB │ gzip: 72.54 kB
```
JS is 72.5 kB gzipped against the 250 kB budget. `dist/index.html` has one `<script>` and it has a `src`.

## Not verified / known problems
- **`npm run dev` is broken on `main` (not caused by this branch), so a working dev server was not confirmed on the branch as it stands.** Every module returns HTTP 500 (`Missing field moduleType, Plugin: builtin:vite-react-refresh-wrapper`). Cause: since B1 merged, `packages/shared` has `vitest@5` with no `vite`, so npm installed peer `vite@8.3.0` at the root; the hoisted `@vitejs/plugin-react@5` resolves it while `apps/web` uses `vite@7.3.6`. Tests and build are unaffected. I reproduced it, then confirmed on a scratch change that adding `"vite": "^7.3.6"` to the ROOT `devDependencies` dedupes to vite 7.3.6: `/`, `/src/main.tsx`, `/src/terminal/Terminal.tsx`, `/src/terminal/terminal.css`, `/src/content/site.ts` all returned 200, web tests 77/77 and shared tests 243/243 still pass. I reverted that scratch change. Root `package.json` and the lockfile belong to the Architect; reported to `architect`.
- **No browser check.** I did not open the terminal in a browser: real focus behavior, mobile keyboards, scrolling, the CSS look, and screen readers are untested. jsdom tests and `curl` are the evidence.
- Not built here by design: the login flow and every real command (F4), boot, layout, tokens (F5), easter eggs and the a11y/mobile pass (F6). The `help`/`clear` commands are placeholders.
- The echo of a typed line is a text node inside a `unicode-bidi: isolate` span, so a pasted bidi override cannot reorder text outside its line; it can still reorder within its own line. The parser deliberately does not strip or reject characters (server validation is authoritative).
- F4 note: `login` must take only a username argument; the password comes only from `ctx.readSecret`, otherwise it would land in history.

## Status
Ready for QA gate. Nothing pushed.

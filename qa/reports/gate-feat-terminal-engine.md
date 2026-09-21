# Gate: feat/terminal-engine (F2)

- Verdict: PASS
- Branch: `feat/terminal-engine` at commit `b650566` (ancestor `7563f8d` named in the request; `b650566` adds a merge of main with the vite 7 pin and a PR-file update). This gate covers `b650566` only.
- Author: frontend-engineer
- Gated by: security-qa-engineer, 2026-09-21
- Worktree used: detached worktree at `b650566` (read-only, removed afterward)
- PR file reviewed: `docs/prs/feat-terminal-engine.md`
- Node v22.12.0, npm 11.6.1. Localhost only. **No browser was available; every DOM check is jsdom.**

## Verdict rule
FAIL on any open Critical or High finding, a failing test, a failing hygiene tool, or edits outside the author's owned paths. None occurred. No findings filed.

## Commands run and real output
| Command (from the check worktree) | Exit | Result |
|---|---|---|
| `npm ci` | 0 | `found 0 vulnerabilities` |
| `npm test -w @site/web` | 0 | `Test Files 9 passed (9)`, `Tests 77 passed (77)` |
| `npm run typecheck -w @site/web` | 0 | no output |
| `npm run lint` | 0 | no output |
| `npm run build -w @site/web` | 0 | `index-DL1Nhcnd.js 230.69 kB, gzip 72.54 kB`; css 1.21 kB |
| `node qa/tools/scan-secrets.mjs --root <check worktree>` | 0 | `116 files scanned, 0 error(s), 1 warning(s) -> PASS`. The warning is `apps/web/src/terminal/Terminal.test.tsx:23`, a fake `SECRET` constant used to prove the masked prompt never leaks it. |
| `node qa/tools/scan-secrets.mjs --path apps/web/dist` | 0 | `3 files scanned, 0 error(s) -> PASS` |
| `npm audit --audit-level=high` | 0 | `found 0 vulnerabilities` |
| dev smoke: `npm run dev` in `apps/web`, `curl` `/`, `/src/main.tsx`, `/src/App.tsx`, `/src/terminal/Terminal.tsx` | 0 | all four `200`; `lsof` shows only `127.0.0.1:5173 (LISTEN)`; server stopped afterwards |

`dist/`: `dist/index.html` has no inline script and no event-handler attributes; the only http(s) strings in the JS are React's namespace URIs (`w3.org` MathML, SVG, XLink, XML) and the `react.dev/errors/` text, none fetched; no `.map` files.

## Independent hostile-input run (QA-authored)
File: `qa/gates/web/f2-terminal.hostile.test.mjs`, config `qa/gates/web/vitest.gate.config.mjs` (usage in the headers). It imports the branch's real `Terminal`, `createRegistry`, `parseInput`, `CommandHistory` and `dispatch` and drives the component with Testing Library.
```
$ QA_WEB_DIR=<worktree>/apps/web <worktree>/node_modules/.bin/vitest run --config qa/gates/web/vitest.gate.config.mjs f2-terminal
 Test Files  1 passed (1)
      Tests  20 passed (20)
```
Non-vacuity: in a scratch worktree I made two deliberate breaks (render lines with `dangerouslySetInnerHTML`; echo the secret into the scrollback and history) and the same file gave `3 failed | 17 passed`, naming the XSS, output-text and masked-prompt tests. The scratch worktree was deleted.

Covered and PASS:
- **W1/W2 (inert text):** 12 payloads (`<img onerror>`, `<script>`, `<svg onload>`, `<iframe src=javascript:>`, `<a href=javascript:>`, attribute breakouts, `<style>@import`, MathML, template and `{{ }}` strings) typed as arguments and as unknown command names. No `img, script, svg, iframe, a, style, math, object, embed, link, form` element exists in the log, no `on*` attribute anywhere, `window.__xss` never set, the payload text is present as text. Command output and error lines containing markup, entities, U+202E, ANSI escapes, NUL and U+2028/2029 render as text. Malformed command results (null, numbers, strings, unknown `kind`, non-string `text`) are dropped, not rendered. A throwing or rejecting command shows only the generic "That command failed." (error text carrying a fake secret and a path never appears).
- **W3 (sinks):** `grep` over `apps/web/src` (non-test): the only `innerHTML` match is a comment saying it is never used; no `dangerouslySetInnerHTML`, `eval`, `new Function`, `document.write`, storage, cookie, `console.*`, `fetch`, `href=` or `src={}` in non-test source.
- **W4 (parser):** empty, whitespace, quotes, escapes, NUL, ESC, bidi, ZWJ emoji, a lone surrogate, shell metacharacters (`$(id) \`id\` ${x} ; | & > < *` are plain arguments); unbalanced quotes, trailing escape, over-length (1025) rejected without throwing; 1024 accepted; a 10 kB and a 1 MB line are refused in under 2 s and never run the command (the DOM input also carries `maxlength=1024`); pathological quoting stays linear (<200 ms). Prototype-named commands (`__proto__`, `constructor`, `toString`, `hasOwnProperty`, `prototype`, `valueOf`, `__defineGetter__`) never resolve; lookup is case-insensitive; an unknown-command echo is truncated to 32 code points.
- **W5 (masked prompt):** the field is `type=password` with `maxlength=256` and takes focus; the typed value is not in `document.body.innerHTML` before or after submit; it reaches only the command (`got == [secret]`); not in DOM text, `localStorage`, `sessionStorage`, or any `console` method; ArrowUp through the whole history never yields it while the `login jansen` line is there; the echoed prompt line has empty text. Escape and Ctrl+C give the command `null`, discard the typed value, and return focus to the command input; unmounting during the prompt releases the command with `null`; the command input is replaced while masked.
- **W7 (caps):** scrollback capped (`maxScrollback: 40` after 120 commands stays at or under 40; one command returning 5000 lines with cap 100 stays at or under 100); history capped at 100 after 10 000 entries, skips blanks and immediate repeats, nothing persisted.
- **W8 (double submit):** three synchronous submits while a command runs execute it once; `aria-busy` toggles; Ctrl+C interrupts a hanging command ("Interrupted.") and the terminal accepts input again. `dispatch` with an aborted signal does not run the command and does not throw.
- **a11y basics (jsdom):** region named "Terminal", `role=log` with `aria-live=polite` and a label, labelled input, `autocomplete=off`, prompt marked `aria-hidden`, input focused on load.

## Observations (no finding)
- The echoed scrollback line and the history entry hold the full command line as typed. That is fine while passwords go only through the masked prompt (`login <username>`, per the contract); if a later command ever takes a secret as an argument, it would sit in in-memory history. F4 should keep secrets on the masked prompt.
- `autocomplete="off"` is ignored by browsers on `type=password`, so a real browser may offer to save or autofill the terminal password. Cannot be checked without a browser; low impact.

## Ownership check
`git log --no-merges --name-only` from the merge-base: `apps/web/**` (terminal engine, content, commands, App, main, package.json), `docs/prs/feat-terminal-engine.md`, `package-lock.json`. All within frontend-engineer's paths. OK.

## Not verified
- No real browser: actual event-handler execution, CSP, focus behavior with the mobile keyboard, password-manager behavior, screen-reader announcements and responsive layout were not observed. The manual checklist W-A11Y-M remains to be run.
- The terminal has only placeholder commands (`help`, `clear`); server-backed commands, the API client wiring and the real login flow arrive in F4.
- Visual identity and reduced-motion behavior belong to F5.

## Recommendation to Architect
Merge. The engine renders everything as text nodes, caps input and scrollback, keeps the masked password out of history, DOM text, storage and console, and the dev server, build and dist are clean.

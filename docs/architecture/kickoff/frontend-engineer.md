# Kickoff: frontend-engineer

You are `frontend-engineer`. Build the web app: a keyboard-first terminal UI that talks to the API. Read in this order (under the main checkout `/Users/jansenfleming/Documents/My_Team`):
1. `docs/project-brief.md` (hard rules) and `.claude/agents/frontend-engineer.md` (your role).
2. `docs/architecture/adr/0001-stack.md`, `api-contract.md` (what you may call), `ownership-map.md` (workflow), `board.md` (your tasks F1-F6).
3. Creative Director specs as they merge: `docs/design/` (`concept.md`, `tokens.css`, `screens.md`, `terminal-commands.md`, `easter-eggs.md`). Ask `creative-director` specific questions; do not guess.

## You own
`apps/web/**` and your `docs/prs/<slug>.md` files. Do not edit `apps/api/**`, `packages/**`, `qa/**`, `docs/design/**`, or root config. Static copy lives in `apps/web/src/content/`, implemented from the design specs.

## Setup (once)
```
cd /Users/jansenfleming/Documents/My_Team
git worktree add .worktrees/web -b feat/web-shell main
cd .worktrees/web && npm install
```
Never switch branches in the main checkout. Each later task: `git switch -c feat/<next> main` inside your worktree after the previous branch is merged.

## Tasks, in order
- **F1 `feat/web-shell`**: start now. Vite + React + TS + Vitest app shell with the `/api` proxy to `127.0.0.1:3001`.
- **F2 `feat/web-terminal-engine`** (after F1 merged): parser, registry, history, `<Terminal>`. No API, no styling dependency, so you can start before design specs land.
- **F3 `feat/web-api-client`** (after F1 and backend's B1 `@site/shared` merged): typed client and `useSession`.
- **F5 `feat/web-boot-layout`** (after F1 and design D2, D3 merged): tokens, boot sequence, layout, effects, reduced-motion.
- **F4 `feat/web-commands`** (after F2, F3, and D4 merged): every command per `terminal-commands.md`; verify against the real API once backend B3 and B4 are merged.
- **F6 `feat/web-polish`** (after F4, F5, D5): easter eggs, a11y, mobile, fixes for Critical/High QA findings.
While waiting for specs, do the unblocked task first; if fully blocked, message the Architect.

## Rules that matter here
- Stack: Vite 7, React 19, `@vitejs/plugin-react` 5, Vitest 5, jsdom 28, Testing Library, plain CSS (no Tailwind/UI kits). No router or state library in the MVP. **Do not upgrade `jsdom` past 28 or Vite past 7** (Node 22.12 constraints, see the ADR). Every new dependency must be justified in your PR file.
- Use `import type` from `@site/shared`; do not bundle zod.
- Security: render all server and user text as text nodes. Never `innerHTML`/`dangerouslySetInnerHTML`, no `eval`, no inline `<script>`, no third-party requests (system fonts or self-hosted assets). Password only in the masked prompt: never in history, DOM, storage, URLs, or logs.
- Respect `prefers-reduced-motion`; effects must never block input. Budget: JS under 250 kB gzipped.
- Tests: `npm test -w @site/web`, `npm run typecheck -w @site/web`, `npm run build -w @site/web`. Paste real output into the PR file.
- Workflow: PR file `docs/prs/<slug>.md`, message Architect + `security-qa-engineer`. QA gates it; you fix root causes and say "ready to retest"; only the Architect merges. Never push or touch the `origin` remote.
- Commit messages end with the attribution line from your harness instructions.

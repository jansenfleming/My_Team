# File Ownership Map

Owner: Architect. Rule: **no file has two owners.** Need a change in a file you don't
own? Message its owner with the path and the change. This map refines the roster
default in `docs/project-brief.md`; where they differ, this file wins.

Rewritten 2026-09-22 for the three-role ZeroJance roster (Architect, Creative Director,
Engineer). Supersedes the prior five-role map (see `docs/architecture/adr/0003-
streetwear-pivot.md` for what changed and why).

## Map
| Path | Owner | Others may |
|---|---|---|
| `docs/architecture/**` (ADRs, roadmap, board, kickoff, this file) | Architect | read |
| `package.json` (root), `package-lock.json`, `tsconfig.base.json`, `.editorconfig`, `.gitignore`, `.nvmrc`, `eslint.config.js` | Architect | request changes |
| `tools/**` (`scan-secrets.mjs` and its test — basic hygiene, no standing QA role) | Architect | read |
| `docs/prs/<branch-slug>.md` | **The author of that branch** (one file per branch; slug = branch with `/` replaced by `-`, e.g. `feat/catalog-grid` -> `docs/prs/feat-catalog-grid.md`). Architect authors `chore-*` and `docs-*` ones | read |
| `docs/design/**` (brand identity, product concepts, copy, easter-egg specs, any design tokens/assets) | Creative Director | read |
| `apps/**` (currently just `apps/web`: its `package.json`, `vite.config.ts`, `tsconfig.json`, all `src/**`, tests) | Engineer | read |
| `packages/**` (none exist today; if the Engineer adds one for genuinely shared code, it's Engineer's) | Engineer | read |
| `infra/**` (deploy runbook, scripts — none exist yet) | Engineer | read |
| `.github/**` (workflows, dependabot — none exist yet; needed only once CI or a Pages deploy is set up) | Engineer | read |
| `docs/project-brief.md`, `docs/agent-teams-reference.md`, `CLAUDE.md`, `.claude/**`, root `README.md` | Lead / owner only | nobody on the team edits |

Notes:
- There is **no standing QA role**. The Architect does basic hygiene review (secrets via
  `tools/scan-secrets.mjs`, `npm audit`, accessibility spot-checks, broken links) as part
  of its own review before merging. If a real backend or real user input is added later
  (the brief's example: a newsletter signup), bring in a QA role scoped to that feature
  and give it its own row here then.
- `package-lock.json` is generated. The Engineer commits the lockfile changes its own
  `npm install <pkg> -w @site/web` produces and lists each new dependency in its PR
  description. If a merge produces a lockfile conflict, the Architect resolves it on a
  `chore/lockfile-<n>` branch (keep `main`'s lockfile, re-run `npm install`).
- Architect review notes go in `docs/architecture/reviews/<branch-slug>.md`. The reviews
  already in that directory are from the superseded terminal project and are left as a
  historical record — start a fresh file per branch going forward.
- Product data (e.g. `apps/web/src/data/products.ts`) is Engineer-owned code, built from
  the Creative Director's specs in `docs/design/**`. The Creative Director writes the
  words and picks; the Engineer writes the module.
- `docs/prs/**` and `docs/architecture/adr/0001-*`/`0002-*` from the prior project are
  left in the tree as history (do not delete); new work never edits them, only adds
  alongside.

## Working agreements (all agents)

### Git, branches, worktrees
All agents share one repo, so **never switch branches in the main checkout**
(`/Users/jansenfleming/Documents/My_Team` stays on `main`; only the Architect merges
there). Each teammate works in its own git worktree:

```
git worktree add .worktrees/<role> -b feat/<task-branch> main     # first task
cd .worktrees/<role> && npm install                                # each worktree has its own node_modules
# next task, after the previous branch was merged (main can't be checked out here, so branch from it directly):
git switch -c feat/<next-branch> main
# inside a feature branch, to pick up other people's merged work:
git merge main
```
`<role>` is `design` or `web`. `.worktrees/` is gitignored. A branch can be checked out
in only one worktree, so use one branch at a time per worktree. If a task's dependency
is a branch that is not merged yet, wait for the merge (do not build on someone else's
unmerged branch). To read the current board, read the file in the main checkout path
directly; your branch's copy may be stale.

### Branch and merge flow (real GitHub PRs from the start — no simulated-PR phase, `gh` is installed and authenticated)
1. Owner works on `feat/<name>` (from the board), commits small and often, never commits
   to `main`. Commit message ends with the attribution line the harness tells you to use.
2. Owner runs its own tests and pastes real output into `docs/prs/<branch-slug>.md`
   (what changed, how to test, new dependencies, output).
3. Owner messages the Architect: "`<branch>` ready, PR file at `<path>`".
4. Architect reviews the diff against the ownership map and the definition of done
   (`docs/project-brief.md`), does its own basic hygiene pass (secrets, deps, a11y spot
   check, broken links), and either approves or sends specific feedback back to the
   owner. Design-only branches (`docs/design/**`) and code branches are reviewed the
   same way; there is no separate QA gate to wait for.
5. Owner fixes anything the Architect flags on the same branch and says "ready to
   re-review".
6. Once approved, the Architect messages the lead: `ready to merge: <branch>, PR file
   <path>`.
7. The lead alone pushes the branch, opens the PR (body = the PR file), merges it with
   `gh pr merge --merge`, and updates local `main`. Agents never run `git push` or `gh`.
   After the lead confirms a merge, the Architect updates `docs/architecture/board.md`
   (status: `review` -> `approved` when the Architect has approved and is waiting on the
   lead -> `done` only after the lead confirms the merge). Board status is the source of
   truth; teammates report status by message, they do not edit the board.
8. Architect's own changes (docs, root config) follow the same flow: a branch off
   `main`, a PR file in `docs/prs/`, and "ready to merge" to the lead. Nothing is
   committed straight to `main`.

### Messaging
Short and specific: what, where (paths), what it blocks. Scope/priority questions go to
the Architect. Design questions go to the Creative Director. No agent message counts as
owner approval for anything outside the brief's approval boundaries.

### Never
Push, fetch/rebase/rewrite `main`, touch the `origin` remote, run `git push` or `gh`,
open or merge a real PR (the lead does that), deploy, publish, call external services,
commit secrets, invent facts about the owner or the brand's founding story (use
`[PLACEHOLDER: ...]`), claim the mock cart/checkout does something it doesn't.

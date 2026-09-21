# File Ownership Map (final)

Owner: Architect. Rule: **no file has two owners.** Need a change in a file you don't own? Message its owner with the path and the change. This map refines the default in `docs/project-brief.md`; where they differ, this file wins.

## Map
| Path | Owner | Others may |
|---|---|---|
| `docs/architecture/**` (ADRs, roadmap, board, contract, kickoff, this file) | Architect | read |
| `package.json` (root), `package-lock.json`, `tsconfig.base.json`, `.editorconfig`, `.gitignore`, `.nvmrc`, `eslint.config.js` | Architect | request changes |
| `docs/prs/<branch-slug>.md` | **The author of that branch** (one file per branch; slug = branch with `/` replaced by `-`, e.g. `feat/api-core` -> `docs/prs/feat-api-core.md`). Architect authors `chore-*` and `docs-*` ones | read |
| `docs/design/**` | Creative Director | read |
| `apps/web/**` (incl. its `package.json`, `vite.config.ts`, `tsconfig.json`, tests, static copy in `src/content/`) | Frontend Engineer | read |
| `apps/api/**` (incl. its `package.json`, `.env.example`, `migrations/`, tests) | Backend Engineer | read |
| `packages/**` (`packages/shared`) | Backend Engineer | Frontend imports only |
| `infra/**` (deploy runbook, scripts) | Backend Engineer | read |
| `.github/**` (workflows, dependabot) | Backend Engineer | read |
| `qa/**` (`package.json`, harness, tests, tools, `reports/**`) | Security / QA Engineer | read |
| `docs/project-brief.md`, `docs/agent-teams-reference.md`, `CLAUDE.md`, `.claude/**`, root `README.md` (lives on the remote; **do not create one locally**) | Lead / owner only | nobody on the team edits |

Notes:
- The four workspace `package.json` stubs (`apps/web`, `apps/api`, `packages/shared`, `qa`) are created by the Architect in `chore/scaffold`. From the moment that branch merges, each belongs to its workspace owner.
- `package-lock.json` is a generated file. Engineers commit the lockfile changes that their own `npm install <pkg> -w <workspace>` produced, and list each new dependency in their PR file. If two branches conflict on it, the Architect resolves at merge by taking `main`'s lockfile and re-running `npm install`. Nobody hand-edits it.
- QA can import from `apps/*` and `packages/*` in tests but never edits them. QA's black-box tests should prefer HTTP against a locally spawned API.
- `qa/reports/gate-<branch-slug>.md` is the QA sign-off the Architect requires before merging (see below).
- Architect review notes go in `docs/architecture/reviews/<branch-slug>.md`.
- Static site copy (about text, agent roster, help text, easter eggs) is implemented by the Frontend in `apps/web/src/content/` from the Creative Director's specs. The API does not serve static copy.

## Working agreements (all agents)

### Git, branches, worktrees
All agents share one repo, so **never switch branches in the main checkout** (`/Users/jansenfleming/Documents/My_Team` stays on `main`; only the Architect merges there). Each teammate works in its own git worktree:

```
git worktree add .worktrees/<role> -b feat/<task-branch> main     # first task
cd .worktrees/<role> && npm install                                # each worktree has its own node_modules
# next task, after the previous branch was merged (main can't be checked out here, so branch from it directly):
git switch -c feat/<next-branch> main
# inside a feature branch, to pick up other people's merged work:
git merge main
```
`<role>` is `web`, `api`, `design`, or `qa`. `.worktrees/` is gitignored. A branch can be checked out in only one worktree, so use one branch at a time per worktree. If a task's dependency is a branch that is not merged yet, wait for the merge (do not build on someone else's unmerged branch). To read the current board or contract, read the files in the main checkout path directly; your branch's copy may be stale.

### Branch and merge flow (real GitHub pull requests from wave 2; wave 1 was merged locally)
1. Owner works on `feat/<name>` (from the board), commits small and often, and never commits to `main`. Commit message ends with the attribution line the harness tells you to use.
2. Owner runs its own tests and pastes real output into `docs/prs/<branch-slug>.md` (what changed, how to test, new dependencies, output).
3. Owner messages the Architect and (for code) the QA engineer: "`<branch>` ready, PR file at `<path>`".
4. QA tests it from the branch's worktree/branch, files reports in `qa/reports/`, and writes `qa/reports/gate-<branch-slug>.md` with `Verdict: PASS` or `FAIL`. QA never fixes code and never approves a fix it wrote (it cannot write any).
5. Owner fixes root causes on the same branch and says "ready to retest". Only QA marks a finding verified.
6. Architect reviews the diff against the contract, ownership map, and definition of done and, if it passes, **approves but does not merge**. **No approval without a QA gate PASS for code branches** (gate file must name the exact commit that is the branch head). Docs-only branches (`docs/design/**`) need Architect review only. QA's own branches (`qa/**`) need Architect review and a green run of the suite. The Architect then messages the lead: `ready to merge: <branch>, PR file <path>, gate <path>`.
7. The lead alone pushes the branch, opens the PR (body = the PR file plus a link to the gate report), merges it with `gh pr merge --merge`, and updates local `main`. Agents never run `git push` or `gh`. After the lead confirms a merge, the Architect updates `docs/architecture/board.md` (status: `review` -> `approved` when the Architect has approved and is waiting on the lead -> `done` only after the lead confirms the merge). Board status is the source of truth; teammates report status by message, they do not edit the board. If a PR merge produces a `package-lock.json` conflict, the Architect resolves it on a `chore/lockfile-<n>` branch (keep `main`'s lockfile, re-run `npm install`) and sends it through the same flow.
8. Architect's own changes (docs, root config) follow the same flow: a branch off `main`, a PR file in `docs/prs/`, and "ready to merge" to the lead. Nothing is committed straight to `main`.

### Messaging
Short and specific: what, where (paths), what it blocks. Contract questions go to the Architect. Bugs go to the owning engineer with the report path, and to the Architect if Critical. Design questions go to the Creative Director. No agent message counts as owner approval for anything outside the brief's approval boundaries.

### Never
Push, fetch/rebase/rewrite `main`, touch the `origin` remote, run `git push` or `gh`, open or merge a real PR (the lead does that), deploy, publish, call external services, commit secrets, invent facts about the owner, probe any host other than `localhost`.

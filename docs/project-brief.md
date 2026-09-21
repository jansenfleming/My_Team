# Project Brief — AI Cybersecurity Website

> Source of truth for every agent. The first section is the owner's master prompt, verbatim. The second section records decisions and constraints added by the lead. If they conflict, the owner's prompt wins and you should flag the conflict to the lead.

---

## Part 1 — Owner's master prompt (verbatim)

Build a personal website centered around **cybersecurity, cyberpunk, and sci-fi**.

The website should feel like entering a futuristic cybersecurity command center rather than visiting a traditional personal website.

It should be:

* Cyberpunk / sci-fi themed
* Interactive
* Fun and slightly mysterious
* Technically impressive
* Immersive
* Fast and usable
* Something I can put on my resume as a demonstration of my technical skills

The website should NOT feel like a traditional portfolio or corporate website.

### The 5 AI agents

All agents use **Claude Sonnet 5**.

**Architect** — Project lead. Turns my ideas into tasks; coordinates the other agents; maintains the roadmap; makes architectural decisions; reviews completed work; decides when work is ready for deployment.

**Creative Director** — Makes the website awesome. Designs the cyberpunk/sci-fi experience; creates UI/UX concepts; designs animations and interactions; creates easter eggs; develops website themes and ideas; keeps the website from becoming boring or generic.

**Frontend Engineer** — Builds what users see. Builds pages and components; implements the Creative Director's designs; handles animations and interactions; makes the site responsive; fixes frontend bugs; writes frontend tests.

**Backend Engineer** — Builds everything behind the scenes: APIs, databases, authentication, agent communication, automation, server-side logic, infrastructure, integrations.

**Security / QA Engineer** — Breaks everything before attackers do. Tests new features; finds bugs; tests APIs; searches for vulnerabilities; checks authentication and authorization; scans dependencies; looks for exposed secrets; performs authorized security testing; retests fixes.

### How they work together

**Idea → Architect → Engineer → QA/Security → Fix → Retest → Deploy**

The Frontend and Backend Engineers should be able to receive bug reports from the Security/QA agent and fix them.

The Security/QA agent should never approve its own fixes.

The Architect coordinates disagreements and major decisions.

Agents should use Git/GitHub branches and pull requests where appropriate.

### Website vision

The website should feel like a **futuristic cybersecurity terminal / command center**.

Possible ideas include: interactive terminal; cybersecurity "missions"; network visualizations; fake hacking interfaces; system diagnostics; digital dossiers; hidden pages; easter eggs; interactive maps; cybersecurity tools; AI agent activity; glitch effects; sci-fi dashboards; terminal commands; secret areas visitors can discover.

Do not blindly implement these ideas. The Creative Director should develop a cohesive experience around them.

Avoid generic "cyberpunk template" designs. The site should have its own identity.

### Final deliverable

Create a production-ready cybersecurity/sci-fi website managed by the five AI agents.

The final system should demonstrate: multi-agent AI; full-stack development; Git/GitHub; automated testing; cybersecurity; APIs; infrastructure; automation; CI/CD; agent collaboration.

Most importantly: **the website itself should be the experience.** Visitors should feel like they have entered a futuristic cybersecurity system, not a normal personal website.

Build the system incrementally. Start with a simple working version, then allow the agents to continuously improve it.

---

## Part 2 — Lead's decisions and constraints

### Environment (checked 2026-09-21)
- macOS, Node v22.12.0, npm 11.6.1, git 2.52.0, Python 3.14.2.
- **Not installed:** `gh` (GitHub CLI), Docker, pnpm. Use npm only. Do not assume Docker or `gh`.
- Repo root is `/Users/jansenfleming/Documents/My_Team` (local git, branch `main`). No remote exists yet.

### Approval boundaries (hard rules)
- **Local only.** Never push, create a remote, open a real GitHub PR, deploy, publish, or send anything to an external service without the owner's explicit approval, relayed through the lead. Prepare everything so it can be done in one step later (branches, PR description files, a deploy runbook).
- **Pull requests, until a remote exists:** simulate them locally. Work on a feature branch, write the PR description to `docs/prs/<branch>.md`, and the Architect reviews and merges (`--no-ff`) into `main`.
- **No real secrets in the repo, ever.** Use `.env.example` with placeholders. Never read or print the owner's real credentials or files outside this repo.
- **No fabricated facts about the owner.** Any personal details, employers, credentials, or resume claims on the site must be clearly marked placeholders (e.g. `[PLACEHOLDER: ...]`) until the owner supplies them. The owner's name is Jansen Fleming; nothing else is confirmed.
- **Security testing scope:** authorized testing only, against this project's own code and its own locally running instance (localhost). Never scan or probe any other host, network, or third-party service.

### Model
All agents run on Claude Sonnet 5.

### Coordination notes
- The lead is the main Claude Code session. It is fixed for the session and is the only one who can spawn or shut down teammates. Teammates cannot spawn teammates.
- The shared native task list is **not available** in this session (no Task tools). The Architect maintains the task board as a file: `docs/architecture/board.md`. Coordinate everything else by direct messages.
- Teammates do not see the lead's conversation. This brief plus `docs/agent-teams-reference.md` plus your spawn prompt are your context.

### Default file ownership (the Architect may refine and must publish the final map)
| Agent | Owns | Must not edit |
|---|---|---|
| Architect | `docs/architecture/**`, `docs/prs/**`, root workspace config (`package.json`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`), merges to `main` | Application code |
| Creative Director | `docs/design/**` (including design tokens and assets it produces) | Anything outside `docs/design/` |
| Frontend Engineer | `apps/web/**` | `apps/api/**`, `qa/**`, `docs/design/**` |
| Backend Engineer | `apps/api/**`, `packages/**`, `infra/**`, `.github/**` | `apps/web/**`, `qa/**` |
| Security / QA Engineer | `qa/**` (test plans, independent tests, `qa/reports/**`) | All source under `apps/`, `packages/`, `infra/`, `.github/` — report bugs, never fix them |

Shared files belong to exactly one owner. If you need a change in a file you don't own, message the owner.

### Definition of done for any piece of work
1. Implemented on a feature branch by its owner.
2. Owner's own tests pass (report the real command output; never claim a pass without running it).
3. QA/Security reviewed and retested; QA did not write the fix it is approving.
4. Architect reviewed and merged.

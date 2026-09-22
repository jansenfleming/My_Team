# Project Brief — ZeroJance Streetwear Mockup

> Source of truth for every agent. The first section is the owner's master prompt, verbatim. The second section records decisions and constraints added by the lead. If they conflict, the owner's prompt wins and you should flag the conflict to the lead.
>
> **This supersedes an earlier, unrelated project** that used to live in this repo (a cybersecurity-terminal-themed site, built by a five-agent team, ~26 merged PRs). That project is fully superseded — do not build on it. Its full history is preserved in git; nothing about it needs to be reconstructed or referenced going forward. See "Legacy content" below for what to do with what's still on disk.

---

## Part 1 — Owner's master prompt (verbatim)

Build a mockup lookbook/catalog website for **ZeroJance**, a streetwear brand that makes tech-culture apparel — shirts, sweatshirts, and hats, styled like programming and networking in-jokes made wearable.

This reuses my existing GitHub repo: https://github.com/jansenfleming/My_Team (git remote is already configured, and the `gh` CLI is already installed and authenticated as me — no setup needed there). The repo currently holds a different, unrelated project: a cybersecurity-terminal-themed site that is now fully superseded. You don't need to build on any of it or ask me before removing or replacing it — review what's there as your first task, keep anything genuinely reusable (workspace/tooling scaffolding, the PR/branch workflow, testing setup), and clear out or replace anything specific to the old concept (its design docs, terminal engine, content, contract). Do this through normal branches and PRs like the rest of the work, not a special one-off step.

Also already in the repo and still valid: `docs/agent-teams-reference.md` (a reference guide on how agent teams work in Claude Code) and `CLAUDE.md`, which points to it. Read and follow it before spawning any teammates.

### What the site is
- A believable **browsable catalog / lookbook** — a product grid, product detail pages, maybe a lookbook/editorial page, an about/brand page. Not an interactive terminal or app like the old site.
- A **mockup for v1, not real commerce**: a convincing cart/"Add to Cart" UI is good, but no real payment processing or checkout. Be honest about this in the code (clearly mocked, not held together with lies) — it should still *look and feel* real to a visitor.
- **Products: 6–12 items total, across shirts, sweatshirts, and hats only.** No accessories for v1.
- Aesthetic: streetwear with tech/programming/networking references — drop culture, bold type, maybe a grid or circuit motif mixed with monospace accents. Not a repeat of the old site's cyberpunk terminal palette.

### Multiple secret/easter-egg layers (a standout feature — I want more than one)
Ideas to pick from and adapt, rather than cramming in all of them:
- A hidden/13th product discoverable only through some interaction (Konami code, scrolling to the bottom, a buried link, etc.)
- A dev-console or view-source message
- A changelog page styled like `git log`
- A joke 404 page (stack trace, or "item not found in catalog")
- A discount code that's a programming pun
- Product copy or tags that reference tech culture (a care label styled like a config file, etc.)

### Team
Use fewer agents than a full five-role team, but still work as a coordinated team with real git branches and real GitHub PRs. Roster:
- **Architect** — turns my ideas into tasks, makes stack/scope calls, reviews and merges everything, decides what's ready to ship.
- **Creative Director** — brand identity, visual direction, copy, product concepts, and the secret/easter-egg layers. This role matters *more* here than on the old site — the brand feel is the whole product.
- **Engineer** — builds both the frontend and whatever light backend/data layer is actually needed. One combined role, not split: a mockup catalog with no real payments or complex auth likely doesn't need a separate backend engineer.

Don't spin up a standing Security/QA agent by default — a mockup marketing site has a much smaller real attack surface than the old project. The Architect can handle basic hygiene itself (secrets, dependencies, accessibility, broken links). If real user input or a real backend gets added later (a newsletter signup, a real cart), bring in a QA role for that specific piece then.

Keep the team lean generally — fewer, more focused tasks, less parallel agent spawning than the old project used.

### Process
- Real GitHub PRs from the start: branches, PR descriptions, Architect review, then merge. I (the lead Claude session) push and merge; agents never touch the remote directly.
- Same approval boundaries as before: no deploying, no real payment integration, no contacting external services, no fabricated claims about me, without asking me first.
- Build incrementally: a simple, working version first (even a handful of products and a clean grid), then keep improving.

Start by having the Architect review the existing repo, decide what to remove or keep, and write a short plan (stack decision, MVP scope, task board) before any other agent starts.

---

## Part 2 — Lead's decisions and constraints

### Legacy content (read before touching anything)
The repo currently contains a complete, merged, working cybersecurity-terminal site: `apps/web/src/terminal/**` and its API client, `apps/api/**` (Fastify + SQLite guestbook and auth), `packages/shared/**` (its validation schemas), and an extensive `docs/design/**` (concept, tokens, terminal command spec, easter eggs) written entirely for that concept. None of it is content-reusable for a streetwear catalog — the name ZeroJance is the only thing carried forward, and it now means something completely different (a brand, not a station).
- **What's likely still useful:** the npm-workspace scaffold, TypeScript/lint/test tooling, the git branch → PR → review → merge workflow, `docs/architecture/ownership-map.md`'s general shape, `docs/agent-teams-reference.md`, `CLAUDE.md`.
- **What's likely dead weight:** `docs/design/**` content (rewrite from scratch), the terminal engine and its API client, the guestbook/auth API and schema (unless the Architect decides a lightweight version is worth keeping for something like a newsletter signup — the owner's prompt doesn't ask for real backend features).
- **How to handle it:** normal branches and PRs, same as any other change. No special deletion step, and no need to ask the owner first — the owner has already said the old content is superseded and the team should just clean it up as it goes.
- **Do not delete `docs/architecture/adr/**`, `docs/prs/**`, or old design docs from git history** — leave them alone as history; only remove them from the live tree if they'd confuse someone reading the repo today.

### Environment (checked 2026-09-22)
- macOS, Node v22.12.0, npm 11.6.1, git 2.52.0, Python 3.14.2.
- **`gh` CLI is installed and authenticated** (v2.101.0, account `jansenfleming`) — unlike the original project, real GitHub PRs are available from day one. No simulated-PR phase needed.
- **Not installed:** Docker, pnpm. Use npm only.
- Repo root: `/Users/jansenfleming/Documents/My_Team`, branch `main`, remote `origin` already set to `https://github.com/jansenfleming/My_Team.git`.

### Approval boundaries (hard rules — unchanged from the prior project)
- **Agents never touch the remote.** No `git push`, no `gh`, no opening or merging PRs. The lead (this session) pushes, opens PRs, and merges after Architect review.
- **No deploying, no real payment/checkout integration, no contacting external services** without the owner's explicit approval, relayed through the lead.
- **No real secrets in the repo, ever.** `.env.example` placeholders only if any backend config exists at all.
- **No fabricated facts about the owner.** The owner's name is Jansen Fleming; any "about the brand" or "about the founder" copy uses `[PLACEHOLDER: ...]` until the owner supplies real content.
- **Mockup discipline:** cart/checkout UI must look real but must not claim to process a real payment or send a real order anywhere. Be explicit in code comments/PR descriptions about what's mocked.

### Model
All agents run on Claude Sonnet 5.

### Team roster (starting point — Architect may refine)
- **Architect** — `docs/architecture/**`, `docs/prs/**`, root workspace config, merges to `main`.
- **Creative Director** — `docs/design/**` (brand identity, product concepts, copy, easter-egg design).
- **Engineer** — `apps/**` (frontend and any light backend/data layer), `packages/**`, `infra/**`, `.github/**`.
- **No standing QA agent for now.** The Architect does basic hygiene review (secrets, dependencies, accessibility, broken links) as part of its own review. Introduce a QA role later only if real user input or a real backend gets added (e.g. a newsletter signup).

### Definition of done (lighter than the prior project, since there's no standing QA gate)
1. Implemented on a feature branch by its owner.
2. Owner's own tests/checks pass, with real output reported (never a claimed pass).
3. Architect reviews (including basic hygiene) and merges `--no-ff` into `main`.

### Scope guardrails
- Products: 6–12 total, shirts/sweatshirts/hats only — no accessories for v1.
- Catalog/lookbook browsing experience, not an interactive terminal.
- Multiple secret/easter-egg layers, but curated — pick a few from the owner's list rather than building all of them.
- No real commerce for v1: a believable mock cart/checkout only.

### Coordination notes
- The lead is the main Claude Code session and is fixed for its lifetime; only it spawns or shuts down teammates.
- Teammates don't see the lead's conversation. This brief, `docs/agent-teams-reference.md`, and each teammate's spawn prompt are its context.
- Keep the team lean: prefer sequential or small-batch work over spawning all agents in parallel by default, to conserve usage.

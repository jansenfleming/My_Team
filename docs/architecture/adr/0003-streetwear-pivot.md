# ADR 0003: Streetwear pivot — stack, scope, and what's kept vs. dropped

Status: accepted (Architect, 2026-09-22). Change only through a new ADR.

## Context
The owner's new master prompt (`docs/project-brief.md`) replaces the cybersecurity-
terminal project with **ZeroJance**, a mockup streetwear catalog/lookbook site: a
product grid, product detail pages, a lookbook/editorial page, an about/brand page, a
believable mock cart, and a curated set of secret/easter-egg layers. Products: 6-12
items, shirts/sweatshirts/hats only. **No real commerce, no real backend is expected for
v1** — the owner's prompt and Part 2 of the brief both say so directly.

The repo held a complete, merged, working project for the old concept: a Fastify +
SQLite guestbook/auth API (`apps/api`), its shared validation package
(`packages/shared`), a terminal engine and API client (`apps/web/src/{terminal,
commands, content, api}`), an independent QA workspace (`qa/**`) with its own gates and
threat model, and extensive design docs for the terminal concept (`docs/design/**`).
The team also shrank from five roles to three: Architect, Creative Director, Engineer
(no standing QA).

This ADR records what was kept, what was removed, and the stack decision for the new
site, made on branch `chore/streetwear-pivot-cleanup`.

## Decision

### Keep (genuinely reusable, unchanged in kind)
| Area | What | Why |
|---|---|---|
| Monorepo | npm workspaces (now just `apps/web`) | Still the only viable option (no pnpm, no Docker); no reason to change |
| Language/tooling | TypeScript 5.9 strict, ESLint 9 flat config, `.editorconfig`, `.nvmrc` (Node 22) | Config-only, concept-agnostic |
| Web framework | Vite 7 + React 19 + `@vitejs/plugin-react` 5 | Fast dev loop, static build — exactly what a catalog/lookbook site needs; nothing about the old choice was terminal-specific |
| Tests | Vitest 5 + `@testing-library/react` + `jsdom` 28 | Same reasoning; no backend to test against now, so API-inject and QA black-box layers are dropped (see below) |
| Process | git branch -> PR file (`docs/prs/<slug>.md`) -> Architect review -> lead pushes/merges | Unaffected by the concept change |
| Docs shape | `docs/architecture/{roadmap,board,ownership-map,adr,kickoff}` | Same structure, rewritten content for the new roster and scope |
| Hygiene tool | `qa/tools/scan-secrets.mjs` -> moved to `tools/scan-secrets.mjs` | Fully generic, dependency-free, no terminal-specific content; the Architect now owns basic hygiene directly (no standing QA role), so this belongs at the repo root, not under a dropped `qa/` workspace |

### Drop entirely
| Area | What | Why |
|---|---|---|
| Backend | `apps/api/**` (Fastify, SQLite, scrypt auth, sessions, rate limits) | No real backend for v1 per the owner's prompt. A mock cart/checkout needs no server: it can hold state in the browser (React state, `localStorage` for persistence across a session) |
| Shared package | `packages/shared/**` (zod schemas, guestbook/auth types) | Existed only to keep the API and web client in sync. With no API, there is nothing to keep in sync; if the Engineer later wants a typed product-data module shared by more than one app, that is a new, much smaller package, proposed fresh |
| Terminal engine | `apps/web/src/{terminal,commands,content,api}/**` | The new site is a browsable catalog, not an interactive terminal (owner's prompt, explicit) |
| QA workspace | `qa/**` (harness, gates, attack suite, reports, threat model) | Tied to the old API's threat model and the old five-role process; no standing QA role now. The Architect does basic hygiene itself (secrets, dependencies, accessibility, broken links) per the brief. If a real backend or real user input is added later (e.g. a newsletter signup), a QA role and its own gate process should be reintroduced then, scoped to that feature |
| Design docs | `docs/design/{concept,easter-eggs,screens,terminal-commands,style-guide}.md`, `tokens.css`, `assets/**`, `tools/check-contrast.py` | Written entirely for the terminal concept's voice, palette, and command set. The Creative Director starts fresh; nothing here transfers as content (the directory and its ownership convention do transfer) |
| API contract | `docs/architecture/api-contract.md` | No API to contract |

### Stack decision for the new site
- **Frontend only, static.** Vite + React + TypeScript, same major versions as before (see table above). No server-rendered pages, no API calls.
- **Product data:** a local, typed data module the Engineer owns (e.g. `apps/web/src/data/products.ts`), not a database and not a fetched JSON file from a server — this is a mockup with 6-12 fixed products, so hand-authored/typed data is simpler and gives full type-safety for product detail pages with zero moving parts. If this grows unwieldy, a static JSON import is a trivial, low-risk change; no ADR needed for that swap.
- **Mock cart:** client-side only (React state + `localStorage` for persistence). "Add to Cart", a cart drawer/page, and a checkout-style summary screen are all real UI backed by fake state. No network call, no order ever sent anywhere. The Engineer must make this honest in code (a comment at the point where a real implementation would call a payment API, explaining that it's intentionally mocked) and the Creative Director's copy must not claim otherwise (e.g. no "Order confirmed and emailed to you" language).
- **Routing:** client-side only, no server-side routing needed since GitHub Pages (if chosen again) can't rewrite arbitrary paths. Decision on library (React Router vs. a minimal hand-rolled switch) is left to the Engineer's first task; either is fine for ~5-6 route shapes (home, catalog, product detail, lookbook, about, 404).
- **Hosting:** not formally decided in this ADR. GitHub Pages (as ADR 0002 chose for the old project) is the likely fit again — free, static-only, matches "no real backend" — but that decision, the workflow file, and its threat notes should be a fresh ADR written when the Engineer's build is close to shippable, not guessed now. Nothing deploys without the owner's explicit approval regardless.

### Team and process
- Roster: Architect, Creative Director, Engineer (see `docs/architecture/kickoff/{creative-director,engineer}.md`). The old `.claude/agents/{frontend-engineer,backend-engineer,security-qa-engineer}.md` subagent definitions describe the old roster and old concept; the Architect did not edit `.claude/**` (out of scope for a spawned session — that's the lead's or owner's call) but flags this for the lead: those three definition files and `.claude/agents/architect.md` / `creative-director.md` are stale and should be reconciled with the new roster before they're relied on for a real team spawn.
- Definition of done, ownership map, and PR/branch/merge flow are otherwise unchanged in shape (see `docs/architecture/ownership-map.md`).

## Rejected
- **Keep a thin API for product data.** Rejected: adds a workspace, a process, and a deploy target for data that changes maybe a handful of times before ship. A typed local module does the same job with none of the operational cost, and the brief explicitly says no real backend is expected.
- **Keep `packages/shared` for future reuse.** Rejected: YAGNI. Nothing consumes it today; a real second consumer would justify a new, purpose-built shared package later.
- **Keep the QA workspace dormant for later reactivation.** Rejected: its gates and threat model target the old API and terminal input surface, none of which exist anymore; reviving it would mean rewriting it anyway. `tools/scan-secrets.mjs` is the one piece that was concept-agnostic, so it moves out and the rest is dropped.

## Consequences
- `apps/web` is now the only workspace. `npm run dev` starts only the web app; there is no `concurrently` two-process dev loop anymore.
- No auth, no database, no server-side validation exist or are needed for v1. Client-side form/interaction validation (e.g. a newsletter-style capture, if the Creative Director wants one as an easter egg) must stay clearly mocked, per the brief's "no real external services" rule.
- If a real backend feature is added later (the brief's one named example: a newsletter signup with a real send), it needs its own ADR, its own small API or third-party integration decision, and — per the brief — a QA role scoped to that feature before it ships.

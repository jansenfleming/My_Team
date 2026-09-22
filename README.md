# ZeroJance

A mockup lookbook/catalog website for **ZeroJance**, a streetwear brand that makes
tech-culture apparel (shirts, sweatshirts, hats) — programming and networking in-jokes,
made wearable.

This is a **v1 mockup**: a believable product grid, product detail pages, a lookbook
page, an about/brand page, and a convincing "Add to Cart" flow. There is no real
commerce — no payment processing, no real checkout — and the code says so plainly
wherever it matters.

Built by a small Claude Code agent team (Architect, Creative Director, Engineer). Start
with `docs/project-brief.md` for the full scope and constraints, then
`docs/architecture/roadmap.md` and `docs/architecture/board.md` for the current plan and
task state.

> This repo previously held an unrelated cybersecurity-terminal project built by an
> earlier five-agent team. That project is fully superseded; see
> `docs/architecture/adr/0003-streetwear-pivot.md` for what was kept, what was dropped,
> and why. Its history remains in git; `docs/prs/**` and `docs/architecture/adr/0001-*`
> and `0002-*` are left in place as a historical record.

## Working in this repo

```sh
npm install
npm run dev        # starts the web app (apps/web) on http://127.0.0.1:5173
npm test           # runs every workspace's tests plus the root tooling self-test
npm run lint
npm run typecheck
npm run build
npm run scan-secrets   # basic hygiene: dependency-free secret scan (tools/scan-secrets.mjs)
```

Node 22.12+ only (see `.nvmrc`), npm workspaces, no Docker or pnpm.

## Layout
- `apps/web` — the Vite + React catalog/lookbook site. Owned by the Engineer.
- `docs/design` — brand identity, product concepts, copy, easter-egg specs. Owned by the
  Creative Director.
- `docs/architecture` — roadmap, task board, ownership map, ADRs, kickoff docs. Owned by
  the Architect.
- `docs/prs` — one file per branch, written by its author, used to build the real GitHub
  PR description.
- `tools/scan-secrets.mjs` — dependency-free secret scanner used for basic hygiene (no
  standing QA role on this project).

# @site/web

Owner: Engineer. Vite 7 + React 19 + TypeScript catalog/lookbook site for ZeroJance (see
`docs/architecture/board.md`, tasks E1-E7). Frontend only — no server, no API, no
database (ADR 0003).

```
npm run dev -w @site/web        # http://127.0.0.1:5173
npm run build -w @site/web      # static build in apps/web/dist
npm run preview -w @site/web    # serve the build on 127.0.0.1:4173
npm test -w @site/web           # Vitest (jsdom + Testing Library)
npm run typecheck -w @site/web  # tsc --noEmit
```

## Routing
Client-side routing is a small hand-rolled router (`src/router/Router.tsx` +
`src/router/matchRoute.ts`) built on the History API, not a library — see the comment at
the top of `Router.tsx` for why. Six route shapes: home (`/`), catalog (`/catalog`),
product detail (`/product/:slug`), lookbook (`/lookbook`), about (`/about`), and a 404
fallback for anything else.

## Rules
No inline `<script>`, no `eval`, no third-party requests at runtime (self-host
everything). No network calls of any kind — the product catalog is a local typed data
module and the cart is client-side state (`localStorage`), never a server. See ADR 0003
(`docs/architecture/adr/0003-streetwear-pivot.md`) for the full stack decision.

# @site/web

Owner: Frontend Engineer. Vite 7 + React 19 + TypeScript terminal UI (see `docs/architecture/board.md`, tasks F1-F6).

```
npm run dev -w @site/web        # http://127.0.0.1:5173, proxies /api to http://127.0.0.1:3001
npm run build -w @site/web      # static build in apps/web/dist
npm run preview -w @site/web    # serve the build on 127.0.0.1:4173 (same /api proxy)
npm test -w @site/web           # Vitest (jsdom + Testing Library)
npm run typecheck -w @site/web  # tsc --noEmit
```

Rules: no inline script, no `eval`, no third-party requests; all server and user text is rendered as text nodes. See `docs/architecture/adr/0001-stack.md`.

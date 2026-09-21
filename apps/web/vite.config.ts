import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Dev and preview servers bind to loopback only (ADR 0001). The browser sees a single
// origin: /api is proxied to the API, so there is no CORS and SameSite=Strict cookies work.
const API_TARGET = "http://127.0.0.1:3001";
const proxy = { "/api": { target: API_TARGET, changeOrigin: false } };

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true, proxy },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true, proxy },
  build: { target: "es2022", sourcemap: false },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

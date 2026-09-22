import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Static catalog mockup: no backend, so no /api proxy (ADR 0003 supersedes the API-proxy
// convention in ADR 0001). Dev and preview servers still bind to loopback only.
export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: { target: "es2022", sourcemap: false },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

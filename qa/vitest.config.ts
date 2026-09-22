import { defineConfig } from "vitest/config";

// Only the harness's own tests run by default (`npm test -w @site/qa`). The gate suites under
// `qa/gates/**` need a branch worktree (QA_API_DIR / QA_WEB_DIR) and are run explicitly by hand or
// from a gate procedure; they are excluded here so a bare `npm test` never fails for lack of one.
export default defineConfig({
  test: {
    environment: "node",
    include: ["harness/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});

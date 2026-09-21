// Vitest config for QA gate tests that exercise apps/web code from a read-only worktree of the branch under test.
// Usage: QA_WEB_DIR=<worktree>/apps/web <worktree>/node_modules/.bin/vitest run --config qa/gates/web/vitest.gate.config.mjs
// `dedupe` forces react and testing-library to resolve from the branch worktree so there is exactly one React copy.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = process.env.QA_WEB_DIR;
if (!web) throw new Error("Set QA_WEB_DIR to the apps/web directory of the branch under test");

export default {
  root: web,
  esbuild: { jsx: "automatic" },
  resolve: { dedupe: ["react", "react-dom", "@testing-library/react", "@testing-library/dom", "@testing-library/jest-dom"] },
  server: { fs: { strict: false } },
  test: {
    environment: "jsdom",
    include: [join(here, "*.hostile.test.mjs")],
    setupFiles: [join(web, "src", "test", "setup.ts")],
  },
};

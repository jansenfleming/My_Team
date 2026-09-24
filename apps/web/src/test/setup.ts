import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so Testing Library's automatic cleanup is not registered.
afterEach(() => {
  cleanup();
  // Real jsdom localStorage persists across `it()` blocks within a test file (board task
  // E3's cart context reads/writes it) — clear it so one test's cart state never leaks
  // into the next. config.test.ts opts into `@vitest-environment node` (no `window`), so
  // this setup file — which runs for every test file — has to guard for that case too.
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

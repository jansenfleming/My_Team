import { describe, expect, it } from "vitest";

// ADR 0001: the browser bundle must not pull in zod. `@site/shared` (the barrel) re-exports the
// zod schemas, so the web app may only take TYPES from it; values come from the zod-free
// `@site/shared/constants` subpath.
const sources = import.meta.glob<string>("../**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true });

describe("imports from @site/shared", () => {
  const files = Object.entries(sources).filter(([path]) => !path.endsWith(".test.ts") && !path.endsWith(".test.tsx"));

  it("scans the web sources", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it('only uses "import type" for the @site/shared barrel and never imports zod directly', () => {
    const offenders: string[] = [];
    for (const [path, source] of files) {
      for (const match of source.matchAll(/import\s+([^;]*?)from\s+["']@site\/shared["']/gs)) {
        if (!/^type\s/.test((match[1] ?? "").trim())) offenders.push(`${path}: ${match[0].slice(0, 60)}`);
      }
      if (/from\s+["']zod/.test(source)) offenders.push(`${path}: imports zod`);
      if (/import\s*\(\s*["']@site\/shared["']\s*\)/.test(source)) offenders.push(`${path}: dynamic import of the barrel`);
    }
    expect(offenders).toEqual([]);
  });
});

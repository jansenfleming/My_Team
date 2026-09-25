import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Read the raw source directly rather than `import ... from "./index.css?raw"`: Vite's
// built-in CSS plugin intercepts `.css` imports before the generic `?raw` raw-import
// convention applies (unlike `.html?raw`, which src/index-html.test.ts already uses
// successfully — confirmed by hand that the `?raw` CSS import resolves to an empty
// string in this setup, not the stylesheet's text). Vitest's cwd is this workspace
// (apps/web, where vite.config.ts lives), same as every other relative path in this
// project's tooling.
const indexCss = readFileSync(resolve(process.cwd(), "src/index.css"), "utf-8");

// Board task E7 (responsiveness pass): two real overflow bugs were found with a
// headless-browser check at mobile widths (320-375px) and fixed here. jsdom doesn't
// compute real layout, so these can't be caught the way a browser-driven check would —
// this file is a cheap, permanent guard against a silent regression of either specific
// fix, matching the raw-CSS-import pattern src/index-html.test.ts already uses for the
// same reason (no runtime layout to assert against).
describe("index.css (board task E7 — responsiveness regressions)", () => {
  it("wraps the header bar so the brand + cart controls + nav toggle can drop to a second row instead of overflowing at narrow widths", () => {
    const barRuleMatch = indexCss.match(/\.site-header__bar\s*{([^}]*)}/);
    expect(barRuleMatch).not.toBeNull();
    expect(barRuleMatch![1]).toMatch(/flex-wrap:\s*wrap/);
  });

  it("uses minmax(0, 1fr) (not a bare 1fr) for every multi-column catalog/lookbook grid track, so an unbreakable word can't blow the grid past its container", () => {
    // No `repeat(N, 1fr)` (bare) anywhere in this file — a bare `1fr` track's default
    // min-width is `auto`, which floors it at its content's min-content size and can
    // overflow the container (verified: it did, on the catalog grid at 320px, before
    // this fix). Every multi-column grid must instead use `repeat(N, minmax(0, 1fr))`.
    expect(indexCss).not.toMatch(/repeat\(\s*\d+\s*,\s*1fr\s*\)/);

    // Sanity check that this isn't vacuously true because the rules were deleted rather
    // than fixed: the 5 known repeat() call sites (.catalog-grid's base/640px/960px
    // rules, .lookbook-cards's 640px/960px rules) must still be there, correctly fixed.
    const minmaxRepeatCalls = indexCss.match(/repeat\(\s*\d+\s*,\s*minmax\(0,\s*1fr\)\s*\)/g) ?? [];
    expect(minmaxRepeatCalls.length).toBe(5);
  });
});

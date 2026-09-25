import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";

// The web app must stay CSP-clean so a strict production policy is possible (ADR 0001):
// no inline script, no inline handlers, no third-party requests.
describe("index.html", () => {
  const doc = new DOMParser().parseFromString(indexHtml, "text/html");

  it("has no inline script: every script has a src and is a module", () => {
    const scripts = Array.from(doc.querySelectorAll("script"));
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      expect(script.getAttribute("src")).toBeTruthy();
      expect(script.textContent?.trim()).toBe("");
      expect(script.getAttribute("type")).toBe("module");
    }
  });

  it("references no external origins and has no inline event handlers", () => {
    expect(indexHtml).not.toMatch(/(https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(indexHtml).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it("mounts the app into #root", () => {
    expect(doc.getElementById("root")).not.toBeNull();
  });

  // Board task E7: the HTML-level color-scheme hint must match tokens.css's `color-
  // scheme: light` (docs/design/tokens.css, D2 — "light is the default and only
  // full-site theme for v1"). A leftover `content="dark"` from the old, now-superseded
  // dark-only terminal project (ADR 0003) shipped here through E1-E6; it told the
  // browser to render native UI (scrollbars, form controls, etc.) in dark mode against
  // this site's light page, before the CSS for those controls even loads.
  it("declares a light color-scheme, matching tokens.css's :root { color-scheme: light }", () => {
    const meta = doc.querySelector('meta[name="color-scheme"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("light");
  });

  // Egg 1a — view-source message (docs/design/easter-eggs.md §1a, board task E6): a
  // static HTML comment, always present in the raw markup, found by "View Page Source."
  // Located by title/head position rather than matched as one fragile whitespace-exact
  // string, since incidental comment indentation doesn't change what a "View Page
  // Source" reader sees — the two content lines below are checked verbatim.
  it("contains the exact view-source easter-egg comment, between </title> and </head>", () => {
    const titleIndex = indexHtml.indexOf("<title>ZeroJance</title>");
    const headCloseIndex = indexHtml.indexOf("</head>");
    expect(titleIndex).toBeGreaterThan(-1);
    expect(headCloseIndex).toBeGreaterThan(titleIndex);

    const commentStart = indexHtml.indexOf("<!--", titleIndex);
    expect(commentStart).toBeGreaterThan(titleIndex);
    const commentEnd = indexHtml.indexOf("-->", commentStart);
    expect(commentEnd).toBeGreaterThan(commentStart);
    expect(commentEnd).toBeLessThan(headCloseIndex);

    const commentBlock = indexHtml.slice(commentStart, commentEnd);
    expect(commentBlock).toContain("view-source: 200 OK.");
    expect(commentBlock).toContain("Nothing else is hidden in the markup — try the console.");
  });
});

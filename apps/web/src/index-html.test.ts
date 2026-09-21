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
});

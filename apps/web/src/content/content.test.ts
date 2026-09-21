import { describe, expect, it } from "vitest";
import { PAGE_TITLE, PROMPT, SITE_NAME, terminalText } from "./site";

// The owner is renaming the site. These guards keep identity strings in this folder, so the
// rename stays a one-file change.
const sources = import.meta.glob<string>(["../**/*.{ts,tsx,css}", "../../index.html"], {
  query: "?raw",
  import: "default",
  eager: true,
});

// Keys are relative to this file, so files in this folder start with "./".
const isContentOrTest = (path: string) =>
  path.startsWith("./") || path.startsWith("../content/") || /\.test\.tsx?$/.test(path);

describe("site identity lives only in src/content", () => {
  it("scans real source files", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10);
  });

  it("does not hardcode the old name anywhere in the web app", () => {
    const offenders = Object.entries(sources)
      .filter(([, source]) => /picket/i.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it("does not repeat the site name or prompt outside src/content", () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !isContentOrTest(path))
      .filter(([, source]) => source.includes(SITE_NAME) || source.includes(PROMPT))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it("derives the page title from the site name and provides every engine string", () => {
    expect(PAGE_TITLE).toContain(SITE_NAME);
    expect(terminalText.unknownCommand("x")).toContain("x");
    expect(terminalText.inputTooLong(5)).toContain("5");
  });
});

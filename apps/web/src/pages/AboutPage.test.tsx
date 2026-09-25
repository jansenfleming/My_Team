import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AboutPage } from "./AboutPage";

// Board task E5 (docs/design/about.md, D4). The hard rule carried from D1/the project
// brief: every [PLACEHOLDER: ...] marker renders VERBATIM — brackets included, not
// stripped, not filled in, not paraphrased around. These are checked as exact literal
// substrings of the rendered page text, not just "a placeholder exists somewhere".
const PLACEHOLDERS = [
  '[PLACEHOLDER: the real meaning or origin of the name "ZeroJance", if there is one beyond the style note above — do not present the style note as fact if a real origin is supplied later]',
  "[PLACEHOLDER: year]",
  "[PLACEHOLDER: founder name or detail]",
  "[PLACEHOLDER: location]",
];

describe("AboutPage — board task E5 (docs/design/about.md)", () => {
  it("renders no console errors or warnings", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<AboutPage />);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("renders the hero: kicker and h1", () => {
    render(<AboutPage />);
    expect(screen.getByText("# about.md")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("About ZeroJance");
  });

  it("renders the four named <h2> sections, in order", () => {
    render(<AboutPage />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "The name",
      "Where this started",
      "What we make",
      "Who this is for",
    ]);
  });

  it("preserves every [PLACEHOLDER: ...] marker verbatim, brackets included", () => {
    const { container } = render(<AboutPage />);
    for (const placeholder of PLACEHOLDERS) {
      expect(container.textContent).toContain(placeholder);
    }
  });

  it("does not invent any founding facts around the placeholders (no real year/place committed)", () => {
    const { container } = render(<AboutPage />);
    // The closing "Founded in ... by ... in ..." sentence (now the third paragraph of
    // "Where this started") is still placeholder-shaped, not a filled in sentence — e.g.
    // it must not contain a real-looking 4-digit founding year outside of the
    // [PLACEHOLDER: year] marker itself.
    const text = container.textContent ?? "";
    const foundedSentence = text.slice(text.indexOf("Founded in"), text.indexOf("Founded in") + 120);
    expect(foundedSentence).toContain("[PLACEHOLDER: year]");
    expect(foundedSentence).toContain("[PLACEHOLDER: founder name or detail]");
    expect(foundedSentence).toContain("[PLACEHOLDER: location]");
    expect(foundedSentence).not.toMatch(/Founded in \d{4}/);
  });

  it("renders the real founder's-story content in 'Where this started' (not just what's still missing)", () => {
    const { container } = render(<AboutPage />);
    const text = container.textContent ?? "";
    // Paragraph 1: the tech+fashion intersection, first-person voice.
    expect(text).toContain(
      "ZeroJance started with two things I've always been drawn to: technology and fashion",
    );
    // Paragraph 2: the minimalist-streetwear-with-character philosophy and the
    // no-strict-rules/"brand I want to wear" closing beat.
    expect(text).toContain("minimalist streetwear with character");
    expect(text).toContain("I'm building the brand I want to wear");
  });

  it("renders inline commands in a code-styled element (git blame)", () => {
    render(<AboutPage />);
    const codeEls = screen.getAllByText("git blame");
    expect(codeEls.length).toBeGreaterThan(0);
    for (const el of codeEls) {
      expect(el.tagName.toLowerCase()).toBe("code");
    }
  });

  it("wraps page content in a single top-level section (no nested <main>, no motion/JS component required)", () => {
    const { container } = render(<AboutPage />);
    expect(container.querySelectorAll("main")).toHaveLength(0);
    // Copy-led page: no lookbook-style cards, no IntersectionObserver usage markers.
    expect(container.querySelectorAll(".lookbook-card")).toHaveLength(0);
  });

  it("renders eight paragraphs of body copy (two-paragraph hero + three-paragraph founder's story + one per remaining named section)", () => {
    const { container } = render(<AboutPage />);
    expect(container.querySelectorAll("p.about-copy")).toHaveLength(8);
  });
});

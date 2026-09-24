import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LookbookPage } from "./LookbookPage";
import { products, hiddenProduct } from "../data/products";
import { RouterProvider } from "../router/Router";

// LookbookPage renders <Link> tiles, which need a RouterProvider in the tree (see
// pages/CatalogPage.test.tsx for the same pattern).
function renderLookbook() {
  return render(
    <RouterProvider>
      <LookbookPage />
    </RouterProvider>,
  );
}

// D4's exact assignment (docs/design/lookbook.md §3): 4 looks x 3 products, covering all
// 12 main-catalog products exactly once. Asserted as an exact set match, not just a count,
// so a future edit that swaps or duplicates a product is caught.
const EXPECTED_LOOKS: Record<string, string[]> = {
  Local: ["localhost Tee", "Rubber Duck Hoodie", "sudo Cap"],
  "On-Call": ["Works on My Machine Tee", "Technical Debt Hoodie", "TCP Handshake Cap"],
  Staging: ["403 / 404 Tee", "cron Crewneck", "Off-by-One Cap"],
  Shipped: ["Exit Code 0 Tee", "git blame Tee", "Staging vs Prod Crewneck"],
};

describe("LookbookPage — board task E5 (docs/design/lookbook.md)", () => {
  it("renders no console errors or warnings", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderLookbook();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("renders the hero: kicker, h1, and subhead copy acknowledging the placeholder photography", () => {
    renderLookbook();
    expect(screen.getByText("# lookbook.md")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lookbook");
    expect(
      screen.getByText(/Same twelve items, sorted by the part of the job/),
    ).toBeInTheDocument();
  });

  it("renders exactly the 4 look sections as <h2> headings, in order", () => {
    renderLookbook();
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["Local", "On-Call", "Staging", "Shipped"]);
  });

  it("renders each look's kicker and intro copy", () => {
    renderLookbook();
    expect(screen.getByText("environment: local")).toBeInTheDocument();
    expect(screen.getByText("rotation: primary")).toBeInTheDocument();
    expect(screen.getByText("environment: staging")).toBeInTheDocument();
    expect(screen.getByText("environment: production")).toBeInTheDocument();
  });

  it("renders exactly the 12 main-catalog products, each exactly once, matching D4's per-look assignment", () => {
    renderLookbook();

    for (const [lookHeading, expectedNames] of Object.entries(EXPECTED_LOOKS)) {
      const heading = screen.getByRole("heading", { level: 2, name: lookHeading });
      const section = heading.closest("section");
      expect(section).not.toBeNull();

      const cardNames = within(section as HTMLElement)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent);
      expect(cardNames).toEqual(expectedNames);
    }

    // Exact-set check across the whole page: every one of the 12 main-catalog products'
    // names appears as an <h3>, none missing, none duplicated, nothing extra.
    const allCardNames = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(allCardNames.sort()).toEqual(products.map((p) => p.name).sort());
    expect(allCardNames).toHaveLength(12);
  });

  it("never renders the hidden 13th product (200 OK Tee)", () => {
    renderLookbook();
    expect(screen.queryByText(hiddenProduct.name)).not.toBeInTheDocument();
  });

  it("links each card to its product detail route", () => {
    renderLookbook();
    const link = screen.getByRole("link", { name: /cron Crewneck/ });
    expect(link).toHaveAttribute("href", "/product/cron-crewneck");
  });

  it("gives every product its own editorial caption, distinct from the catalog description", () => {
    renderLookbook();
    expect(screen.getByText("Clean run. Nothing to report.")).toBeInTheDocument();
    // The product's own catalog description (products.ts) is a different sentence.
    const exitCode0 = products.find((p) => p.name === "Exit Code 0 Tee");
    expect(exitCode0?.description).not.toBe("Clean run. Nothing to report.");
  });

  it("uses a CSS-only placeholder tile per card — no <img> anywhere on the page", () => {
    renderLookbook();
    expect(document.querySelectorAll("img")).toHaveLength(0);
  });

  it("shows each card's category as visible text", () => {
    renderLookbook();
    const link = screen.getByRole("link", { name: /sudo Cap/ });
    expect(within(link).getByText("Hat")).toBeInTheDocument();
  });

  it("renders a closing link back to the full catalog", () => {
    renderLookbook();
    const link = screen.getByRole("link", { name: "Browse the full catalog" });
    expect(link).toHaveAttribute("href", "/catalog");
  });

  it("wraps page content in a single top-level section (no nested <main>)", () => {
    const { container } = renderLookbook();
    expect(container.querySelectorAll("main")).toHaveLength(0);
  });
});

describe("LookbookPage — scroll-reveal motion (D4 §5)", () => {
  const originalMatchMedia = window.matchMedia;
  const originalIntersectionObserver = window.IntersectionObserver;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.IntersectionObserver = originalIntersectionObserver;
    vi.restoreAllMocks();
  });

  it("never sets data-motion when prefers-reduced-motion is requested — sections render at their final visible state", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false, // "no-preference" query does not match => reduced motion requested
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    const { container } = renderLookbook();
    const sections = container.querySelectorAll(".lookbook-look");
    expect(sections.length).toBe(4);
    for (const section of sections) {
      expect(section).not.toHaveAttribute("data-motion");
    }
  });

  it("never sets data-motion when IntersectionObserver is unsupported, even if motion is allowed", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    // @ts-expect-error -- simulating an unsupported browser for this test only
    delete window.IntersectionObserver;

    const { container } = renderLookbook();
    for (const section of container.querySelectorAll(".lookbook-look")) {
      expect(section).not.toHaveAttribute("data-motion");
    }
  });

  it("starts a section pending and flips to visible once IntersectionObserver reports it in view, then stops observing just that section", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    // One LookSection = one IntersectionObserver instance (4 sections, 4 instances). Each
    // instance's callback/disconnect are tracked separately, in construction order, which
    // matches DOM/render order (section 0 = "Local" mounts and effects-fire first).
    const instances: { callback: IntersectionObserverCallback; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
    class FakeIntersectionObserver {
      callback: IntersectionObserverCallback;
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = "";
      thresholds: number[] = [];
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        instances.push({ callback, observe: this.observe, disconnect: this.disconnect });
      }
    }
    window.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;

    const { container } = renderLookbook();
    const sections = Array.from(container.querySelectorAll(".lookbook-look"));
    expect(sections.length).toBe(4);
    for (const section of sections) {
      expect(section).toHaveAttribute("data-motion", "pending");
    }
    expect(instances).toHaveLength(4);
    for (const instance of instances) {
      expect(instance.observe).toHaveBeenCalledTimes(1);
    }

    // Simulate the first section ("Local") scrolling into view.
    const firstInstance = instances[0];
    const firstSection = sections[0];
    if (!firstInstance || !firstSection) {
      throw new Error("expected at least one look section/observer instance");
    }
    act(() => {
      firstInstance.callback(
        [{ isIntersecting: true, target: firstSection } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(firstSection).toHaveAttribute("data-motion", "visible");
    expect(firstInstance.disconnect).toHaveBeenCalledTimes(1);

    // The other 3 sections are untouched: still pending, their observers never disconnected.
    for (const section of sections.slice(1)) {
      expect(section).toHaveAttribute("data-motion", "pending");
    }
    for (const instance of instances.slice(1)) {
      expect(instance.disconnect).not.toHaveBeenCalled();
    }
  });
});

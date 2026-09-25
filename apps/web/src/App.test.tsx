import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { KONAMI_SEQUENCE, resetKonamiMemoryFlagForTests } from "./eggs/konami";

// Renders the app with the browser at `path` before mount, the way a direct URL load
// (or a static-file server serving index.html for any path) would.
function renderAt(path: string) {
  window.history.pushState(null, "", path);
  return render(<App />);
}

describe("App routing (smoke test per route — board task E1)", () => {
  it("renders the home route", () => {
    renderAt("/");
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ZeroJance");
    expect(document.title).toBe("ZeroJance");
  });

  it("renders the catalog route", () => {
    renderAt("/catalog");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Catalog");
    expect(document.title).toBe("Catalog — ZeroJance");
  });

  it("renders a known product's detail route with its real content (board task E3)", () => {
    renderAt("/product/exit-code-0-tee");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Exit Code 0 Tee");
    expect(document.title).toBe("Product — ZeroJance");
  });

  it("renders the existing NotFoundPage for an unknown product slug", () => {
    renderAt("/product/circuit-hoodie");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
  });

  it("renders the lookbook route", () => {
    renderAt("/lookbook");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lookbook");
  });

  it("renders the about route", () => {
    renderAt("/about");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("About");
  });

  it("renders the 404 route for an unrecognized path", () => {
    renderAt("/this-does-not-exist");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
  });

  it("renders as inert text with no injected markup", () => {
    const { container } = renderAt("/");
    expect(container.querySelectorAll("script, iframe").length).toBe(0);
  });
});

describe("App navigation", () => {
  it("navigates client-side via nav links, without a full page reload", async () => {
    renderAt("/");
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: "Catalog" }));

    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Catalog");
    expect(window.location.pathname).toBe("/catalog");
  });

  it("responds to browser back/forward navigation", async () => {
    renderAt("/");
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: "About" }));
    expect(window.location.pathname).toBe("/about");

    window.history.back();

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ZeroJance");
    });
  });

  it("marks the current nav link with aria-current", async () => {
    renderAt("/catalog");
    const catalogLink = screen.getByRole("link", { name: "Catalog" });
    expect(catalogLink).toHaveAttribute("aria-current", "page");
  });
});

describe("App cart (board task E3 — mock cart core)", () => {
  it("shows a visible cart count in the header that starts at zero", () => {
    renderAt("/");
    expect(screen.getByText("Cart (0)")).toBeInTheDocument();
  });

  it("updates the header cart count when a product is added to cart", async () => {
    renderAt("/product/exit-code-0-tee");
    const user = userEvent.setup();

    expect(screen.getByText("Cart (0)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(screen.getByText("Cart (1)")).toBeInTheDocument();
  });

  it("keeps the cart count after navigating away from the product page and back", async () => {
    renderAt("/product/exit-code-0-tee");
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(screen.getByText("Cart (1)")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Catalog" }));
    expect(screen.getByText("Cart (1)")).toBeInTheDocument();
  });
});

afterEach(() => {
  resetKonamiMemoryFlagForTests();
});

describe("App cart drawer + mock checkout (board task E4, wired through the real header button)", () => {
  it("opens the drawer from the header's cart toggle and shows the item added on the product page", async () => {
    renderAt("/product/exit-code-0-tee");
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));
    await user.click(screen.getByRole("button", { name: "Open cart" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Exit Code 0 Tee");
    expect(dialog).toHaveTextContent("$36");
  });

  it("goes all the way through checkout to the honest mock disclosure, with the header count reflecting the cleared cart", async () => {
    renderAt("/product/exit-code-0-tee");
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));
    await user.click(screen.getByRole("button", { name: "Open cart" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await user.click(screen.getByRole("button", { name: "Place Order" }));

    expect(screen.getByText(/this is a demo — no real order was placed/i)).toBeInTheDocument();
    expect(screen.getByText("Cart (0)")).toBeInTheDocument();
  });

  it("closing the drawer returns focus to the header's cart toggle button", async () => {
    renderAt("/");
    const user = userEvent.setup();

    const toggle = screen.getByRole("button", { name: "Open cart" });
    await user.click(toggle);
    await user.keyboard("{Escape}");

    expect(toggle).toHaveFocus();
  });

  it(
    "keeps a background nav link unreachable by Tab while the drawer is open (board " +
      "task E7, carried over from E4's review §5: the backdrop already blocked pointer " +
      "clicks on background content, but Tab could previously escape the drawer and land " +
      "on a control like this one, e.g. a header nav link, while still visually open)",
    async () => {
      renderAt("/");
      const user = userEvent.setup();

      await user.click(screen.getByRole("button", { name: "Open cart" }));
      const dialog = await screen.findByRole("dialog");
      const catalogNavLink = screen.getByRole("link", { name: "Catalog" });

      // Tab far more times than the dialog has focusable elements — if the trap were
      // missing, this would eventually land on the header nav link behind the drawer.
      for (let i = 0; i < 15; i++) {
        await user.tab();
        expect(catalogNavLink).not.toHaveFocus();
        expect(dialog.contains(document.activeElement)).toBe(true);
      }
    },
  );
});

describe("App easter eggs (board task E6)", () => {
  it("logs the dev-console message exactly once on mount, and not again on a route change", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    renderAt("/");
    const user = userEvent.setup();

    expect(consoleLogSpy).toHaveBeenCalledTimes(3);

    await user.click(screen.getByRole("link", { name: "Catalog" }));

    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    consoleLogSpy.mockRestore();
  });

  it("renders the joke 404 page's exact copy and links for an unmatched path", () => {
    renderAt("/this-does-not-exist");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
    expect(screen.getByText("GET /this-does-not-exist → 404 Not Found")).toBeInTheDocument();
    expect(screen.getByText("Not in the catalog. Try the catalog instead.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to catalog" })).toHaveAttribute(
      "href",
      "/catalog",
    );
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
  });

  it("keeps the hidden product unreachable by direct navigation before the Konami code is entered", () => {
    renderAt("/product/200-ok");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
  });

  it("entering the Konami code anywhere on the site unlocks the hidden product for direct navigation", () => {
    renderAt("/about");

    for (const key of KONAMI_SEQUENCE) {
      fireEvent.keyDown(window, { key });
    }

    expect(screen.getByText("Item unlocked.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "View 200 OK Tee" }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("200 OK Tee");
    expect(window.location.pathname).toBe("/product/200-ok");
  });
});

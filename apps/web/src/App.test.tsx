import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

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

  it("renders a product detail route with the slug from the URL", () => {
    renderAt("/product/circuit-hoodie");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Product detail");
    expect(screen.getByText("circuit-hoodie")).toBeInTheDocument();
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

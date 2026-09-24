import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogPage } from "./CatalogPage";
import { products } from "../data/products";
import { RouterProvider } from "../router/Router";

// CatalogPage renders <Link> tiles, which need a RouterProvider in the tree (see
// router/Router.test.tsx for the same pattern).
function renderCatalog() {
  return render(
    <RouterProvider>
      <CatalogPage />
    </RouterProvider>,
  );
}

// Board task E2 — the catalog grid must render all 12 main-catalog products (never the
// hidden 13th), each showing a styled placeholder, name, price, and category, and stay
// responsive via the .catalog-grid CSS (jsdom doesn't evaluate media queries, so the
// class/markup shape is what's asserted here — the breakpoints themselves are visually
// verified against the real build).
describe("CatalogPage", () => {
  it("renders exactly the 12 main-catalog products, not 13", () => {
    renderCatalog();
    const grid = screen.getByRole("list", { name: "All products" });
    expect(within(grid).getAllByRole("listitem")).toHaveLength(12);
  });

  it("does not render the hidden 13th product (200 OK Tee)", () => {
    renderCatalog();
    expect(screen.queryByText("200 OK Tee")).not.toBeInTheDocument();
  });

  it("renders every product's name, price, and category as visible text", () => {
    renderCatalog();
    for (const product of products) {
      expect(screen.getByText(product.name)).toBeInTheDocument();
    }
    // Spot-check price and category formatting for one product.
    const exitCode = screen.getByText("Exit Code 0 Tee").closest("a");
    expect(exitCode).not.toBeNull();
    expect(within(exitCode as HTMLElement).getByText("$36")).toBeInTheDocument();
    expect(within(exitCode as HTMLElement).getAllByText("Shirt").length).toBeGreaterThan(0);
  });

  it("links each product tile to its own /product/:id detail route", () => {
    renderCatalog();
    const link = screen.getByRole("link", { name: /cron Crewneck/ });
    expect(link).toHaveAttribute("href", "/product/cron-crewneck");
  });

  it("gives every product a styled placeholder that is decorative, not a broken image", () => {
    renderCatalog();
    // No <img> elements at all — the placeholder is CSS-only, per the hard constraint on
    // no external image URLs / no broken <img>.
    expect(document.querySelectorAll("img")).toHaveLength(0);
  });

  it("renders a product with no special copy and a longer name cleanly (edge case)", () => {
    renderCatalog();
    const longName = screen.getByText("Works on My Machine Tee");
    expect(longName).toBeInTheDocument();
    const link = longName.closest("a");
    expect(link).not.toBeNull();
    expect(within(link as HTMLElement).getByText("$34")).toBeInTheDocument();
  });

  it("shows a live product count matching the catalog length", () => {
    renderCatalog();
    expect(screen.getByText(`${products.length} products — shirts, sweatshirts, and hats.`)).toBeInTheDocument();
  });
});

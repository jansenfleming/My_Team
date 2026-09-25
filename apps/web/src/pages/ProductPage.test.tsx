import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductPage } from "./ProductPage";
import { CartProvider, useCart } from "../cart/CartContext";
import { KONAMI_STORAGE_KEY, resetKonamiMemoryFlagForTests } from "../eggs/konami";
import { RouterProvider } from "../router/Router";

// ProductPage needs a CartProvider (Add to Cart) and a RouterProvider (the NotFoundPage
// fallback it reuses renders a <Link>) — same nesting App.tsx uses in production.
function renderProduct(slug: string) {
  return render(
    <CartProvider>
      <RouterProvider>
        <ProductPage slug={slug} />
      </RouterProvider>
    </CartProvider>,
  );
}

// A small probe rendered alongside ProductPage, inside the same CartProvider, so a test
// can assert on cart state after interacting with the real "Add to Cart" button rather
// than reaching into React internals.
function CartQuantityProbe() {
  const { totalQuantity } = useCart();
  return <p data-testid="probe-quantity">{totalQuantity}</p>;
}

function renderProductWithCartProbe(slug: string) {
  return render(
    <CartProvider>
      <RouterProvider>
        <ProductPage slug={slug} />
        <CartQuantityProbe />
      </RouterProvider>
    </CartProvider>,
  );
}

afterEach(() => {
  resetKonamiMemoryFlagForTests();
});

describe("ProductPage (board task E3)", () => {
  it("renders a known product's name, category, price, description, and tags", () => {
    renderProduct("exit-code-0-tee");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Exit Code 0 Tee");
    expect(screen.getByText("Shirt")).toBeInTheDocument();
    expect(screen.getByText("$36")).toBeInTheDocument();
    expect(
      screen.getByText("Ran clean. No errors, no warnings, no output — which is the point."),
    ).toBeInTheDocument();
    const tagList = screen.getByRole("list", { name: "Tags" });
    expect(within(tagList).getByText("exit-codes")).toBeInTheDocument();
    expect(within(tagList).getByText("shell")).toBeInTheDocument();
    expect(within(tagList).getByText("core")).toBeInTheDocument();
  });

  it("renders the special-copy block distinctly (dark-panel treatment) when the product has one", () => {
    renderProduct("exit-code-0-tee");

    expect(screen.getByText("Care label, styled as a config file")).toBeInTheDocument();
    const block = document.querySelector(".product-detail__special-copy");
    expect(block).not.toBeNull();
    expect(block?.textContent).toContain("exit_code: 0");
    // Verbatim, not paraphrased (docs/design/products.md's explicit rule).
    expect(block?.textContent).toContain("wash: cold");
  });

  it("renders no special-copy block for a product that has none (plain copy by design)", () => {
    renderProduct("localhost-tee");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("localhost Tee");
    expect(document.querySelector(".product-detail__special-copy")).toBeNull();
  });

  it("offers a 4-size variant picker for a shirt", () => {
    renderProduct("exit-code-0-tee");

    for (const size of ["S", "M", "L", "XL"]) {
      expect(screen.getByRole("radio", { name: size })).toBeInTheDocument();
    }
    expect(screen.getByRole("radio", { name: "S" })).toBeChecked();
  });

  it("offers a one-size variant for a hat", () => {
    renderProduct("sudo-cap");

    expect(screen.getByRole("radio", { name: "One Size" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "One Size" })).toBeChecked();
    expect(screen.queryByRole("radio", { name: "M" })).not.toBeInTheDocument();
  });

  it("lets the visitor pick a different size before adding to cart", async () => {
    renderProduct("exit-code-0-tee");
    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: "L" }));

    expect(screen.getByRole("radio", { name: "L" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "S" })).not.toBeChecked();
  });

  it("renders the existing NotFoundPage behavior for an unknown product id, not a duplicate", () => {
    renderProduct("this-product-does-not-exist");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
    // "Back home" is D5's exact 404 copy (docs/design/easter-eggs.md §2, board task E6),
    // which replaced E3's original placeholder "Back to home" link text.
    expect(screen.getByRole("link", { name: "Back home" })).toBeInTheDocument();
  });

  it("does not reveal the hidden 13th product by its fixed slug via ordinary navigation", () => {
    // "200-ok" is the fixed slug for the Konami-code hidden product
    // (docs/design/easter-eggs.md §3, /product/200-ok). Without the unlock flag set
    // (board task E6, not implemented here), this must fall through to NotFoundPage —
    // that's what makes the product unreachable by direct navigation or a guessed URL.
    renderProduct("200-ok");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
  });

  it("adding to cart shows a flat, non-exclamatory confirmation and updates the cart count", async () => {
    renderProductWithCartProbe("exit-code-0-tee");
    const user = userEvent.setup();

    expect(screen.getByTestId("probe-quantity")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(screen.getByRole("status")).toHaveTextContent("Added 1 × Exit Code 0 Tee (S) to cart.");
    expect(screen.getByTestId("probe-quantity")).toHaveTextContent("1");
  });

  it("clicking Add to Cart twice for the same product+variant increments quantity, not a duplicate line", async () => {
    renderProductWithCartProbe("exit-code-0-tee");
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(screen.getByTestId("probe-quantity")).toHaveTextContent("2");
  });

  it("never makes a network call when adding to cart (mock cart only)", async () => {
    const fetchSpy = vi.fn();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    renderProduct("exit-code-0-tee");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(fetchSpy).not.toHaveBeenCalled();
    globalThis.fetch = originalFetch;
  });
});

// Hidden 13th product gating (docs/design/easter-eggs.md §3, board task E6). The "still
// 404s before unlock" direction is covered by the existing test above ("does not reveal
// the hidden 13th product..."); these cover the unlock direction and persistence.
describe("ProductPage — hidden 13th product (board task E6)", () => {
  it("renders the real 200 OK Tee detail content once the Konami unlock flag is set", () => {
    window.localStorage.setItem(KONAMI_STORAGE_KEY, "1");

    renderProduct("200-ok");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("200 OK Tee");
    expect(screen.getByText("$38")).toBeInTheDocument();
    expect(
      screen.getByText("Everything you asked for, nothing you didn't."),
    ).toBeInTheDocument();
    expect(screen.getByText("Care label, styled as a config file")).toBeInTheDocument();
    const block = document.querySelector(".product-detail__special-copy");
    expect(block?.textContent).toContain("code: 200");
    // Full normal treatment, same as any of the other 12 — size picker and Add to Cart.
    expect(screen.getByRole("radio", { name: "S" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeInTheDocument();
  });

  it("stays 404 for a guessed/direct-navigation visit even with a stray unrelated flag set", () => {
    window.localStorage.setItem("some-other-flag", "1");

    renderProduct("200-ok");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
  });

  it("the unlock persists across a simulated reload (a fresh render reads the same localStorage)", () => {
    window.localStorage.setItem(KONAMI_STORAGE_KEY, "1");
    const first = renderProduct("200-ok");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("200 OK Tee");

    // Simulate a reload: unmount and mount fresh — only localStorage carries the flag
    // across this boundary (same pattern as CartContext.test.tsx's persistence test).
    first.unmount();
    renderProduct("200-ok");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("200 OK Tee");
  });

  it("lets Add to Cart work normally on the hidden product once unlocked", async () => {
    window.localStorage.setItem(KONAMI_STORAGE_KEY, "1");
    renderProductWithCartProbe("200-ok");
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(screen.getByTestId("probe-quantity")).toHaveTextContent("1");
  });
});

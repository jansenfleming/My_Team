import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "./CartContext";

const PRODUCT_A = { id: "exit-code-0-tee", name: "Exit Code 0 Tee", price: 36, category: "shirt" as const };
const PRODUCT_B = { id: "sudo-cap", name: "sudo Cap", price: 30, category: "hat" as const };

// A small consumer that exposes cart state/actions as testable DOM so tests don't need
// to reach into React internals — the same pattern App.test.tsx and Router.test.tsx use.
function CartProbe() {
  const { items, totalQuantity, addItem } = useCart();
  return (
    <div>
      <p data-testid="total-quantity">{totalQuantity}</p>
      <p data-testid="item-count">{items.length}</p>
      <ul>
        {items.map((item) => (
          <li key={`${item.productId}-${item.variant}`}>
            {item.name} · {item.variant} · qty {item.quantity}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => addItem(PRODUCT_A, "M")}>
        add-a-m
      </button>
      <button type="button" onClick={() => addItem(PRODUCT_A, "L")}>
        add-a-l
      </button>
      <button type="button" onClick={() => addItem(PRODUCT_B, "One Size")}>
        add-b
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <CartProvider>
      <CartProbe />
    </CartProvider>,
  );
}

describe("CartContext (board task E3 — mock cart core, no server, ever)", () => {
  it("starts empty", () => {
    renderProbe();
    expect(screen.getByTestId("total-quantity")).toHaveTextContent("0");
    expect(screen.getByTestId("item-count")).toHaveTextContent("0");
  });

  it("adding the same product+variant twice increments quantity rather than adding a second line", async () => {
    renderProbe();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "add-a-m" }));
    await user.click(screen.getByRole("button", { name: "add-a-m" }));

    expect(screen.getByTestId("item-count")).toHaveTextContent("1");
    expect(screen.getByTestId("total-quantity")).toHaveTextContent("2");
    expect(screen.getByText("Exit Code 0 Tee · M · qty 2")).toBeInTheDocument();
  });

  it("adding the same product with a different variant creates a separate line", async () => {
    renderProbe();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "add-a-m" }));
    await user.click(screen.getByRole("button", { name: "add-a-l" }));

    expect(screen.getByTestId("item-count")).toHaveTextContent("2");
    expect(screen.getByTestId("total-quantity")).toHaveTextContent("2");
  });

  it("tracks total quantity across different products", async () => {
    renderProbe();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "add-a-m" }));
    await user.click(screen.getByRole("button", { name: "add-b" }));

    expect(screen.getByTestId("total-quantity")).toHaveTextContent("2");
    expect(screen.getByTestId("item-count")).toHaveTextContent("2");
  });

  it("persists across a simulated reload (a fresh CartProvider reads the same localStorage)", async () => {
    const user = userEvent.setup();
    const first = renderProbe();
    await user.click(screen.getByRole("button", { name: "add-a-m" }));
    expect(screen.getByTestId("total-quantity")).toHaveTextContent("1");

    // Simulate a reload: unmount the whole provider tree (discarding React state) and
    // mount a brand new one. Only localStorage carries state across this boundary.
    first.unmount();
    renderProbe();

    expect(screen.getByTestId("total-quantity")).toHaveTextContent("1");
    expect(screen.getByText("Exit Code 0 Tee · M · qty 1")).toBeInTheDocument();
  });

  it("falls back to an empty cart, without crashing, when stored JSON is malformed", () => {
    window.localStorage.setItem("zj_cart", "{not valid json");
    expect(() => renderProbe()).not.toThrow();
    expect(screen.getByTestId("total-quantity")).toHaveTextContent("0");
  });

  it("falls back to an empty cart when stored JSON is a well-formed but unexpected shape", () => {
    window.localStorage.setItem("zj_cart", JSON.stringify({ not: "an array" }));
    expect(() => renderProbe()).not.toThrow();
    expect(screen.getByTestId("total-quantity")).toHaveTextContent("0");
  });

  it("keeps working in-memory and never crashes when localStorage.setItem throws (blocked/full storage)", async () => {
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const user = userEvent.setup();

    renderProbe();
    await user.click(screen.getByRole("button", { name: "add-a-m" }));

    expect(screen.getByTestId("total-quantity")).toHaveTextContent("1");

    setItemSpy.mockRestore();
  });

  it("useCart throws a clear error when used outside a CartProvider", () => {
    // Suppress the expected React error-boundary console noise for this one assertion.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bare() {
      useCart();
      return null;
    }
    expect(() => render(<Bare />)).toThrow("useCart must be used within a CartProvider");
    consoleError.mockRestore();
  });
});

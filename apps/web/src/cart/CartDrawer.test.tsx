import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CartDrawer } from "./CartDrawer";
import { CartProvider, useCart } from "./CartContext";
import { RouterProvider } from "../router/Router";

const PRODUCT_A = { id: "exit-code-0-tee", name: "Exit Code 0 Tee", price: 36, category: "shirt" as const };
const PRODUCT_B = { id: "sudo-cap", name: "sudo Cap", price: 30, category: "hat" as const };

// A probe that seeds the cart via the real addItem action (not by poking React
// internals), rendered as a sibling of CartDrawer inside the same CartProvider — the
// same pattern ProductPage.test.tsx uses for its cart-quantity probe.
function SeedProbe() {
  const { addItem } = useCart();
  return (
    <div>
      <button type="button" onClick={() => addItem(PRODUCT_A, "M")}>
        seed-a
      </button>
      <button type="button" onClick={() => addItem(PRODUCT_B, "One Size")}>
        seed-b
      </button>
    </div>
  );
}

function renderDrawer(open: boolean, onClose: () => void = vi.fn()) {
  return render(
    <CartProvider>
      <RouterProvider>
        <SeedProbe />
        <CartDrawer open={open} onClose={onClose} />
      </RouterProvider>
    </CartProvider>,
  );
}

describe("CartDrawer (board task E4 — cart drawer + mock checkout)", () => {
  it("renders nothing interactive when closed", () => {
    renderDrawer(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty-bag message with no items", async () => {
    renderDrawer(true);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
  });

  it("lists each line item with name, variant, quantity, and price", async () => {
    const user = userEvent.setup();
    renderDrawer(true);
    await user.click(screen.getByRole("button", { name: "seed-a" }));
    await user.click(screen.getByRole("button", { name: "seed-b" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Exit Code 0 Tee")).toBeInTheDocument();
    expect(within(dialog).getByText("Shirt · M")).toBeInTheDocument();
    expect(within(dialog).getByText("sudo Cap")).toBeInTheDocument();
    expect(within(dialog).getByText("Hat · One Size")).toBeInTheDocument();
    expect(within(dialog).getByText("$36")).toBeInTheDocument();
    expect(within(dialog).getByText("$30")).toBeInTheDocument();
  });

  it("editing quantity with the stepper recomputes the subtotal correctly", async () => {
    const user = userEvent.setup();
    renderDrawer(true);
    await user.click(screen.getByRole("button", { name: "seed-a" })); // qty 1, $36

    expect(screen.getByTestId("cart-drawer-subtotal")).toHaveTextContent("$36");

    await user.click(screen.getByRole("button", { name: /increase quantity of exit code 0 tee/i }));
    // qty 2 → line price $72, subtotal $72
    expect(screen.getByTestId("cart-drawer-subtotal")).toHaveTextContent("$72");

    await user.click(screen.getByRole("button", { name: /decrease quantity of exit code 0 tee/i }));
    expect(screen.getByTestId("cart-drawer-subtotal")).toHaveTextContent("$36");
  });

  it("the quantity decrease button is disabled at quantity 1 (remove is the separate action for that)", async () => {
    const user = userEvent.setup();
    renderDrawer(true);
    await user.click(screen.getByRole("button", { name: "seed-a" }));

    expect(screen.getByRole("button", { name: /decrease quantity of exit code 0 tee/i })).toBeDisabled();
  });

  it("removing an item updates both the subtotal and the item list", async () => {
    const user = userEvent.setup();
    renderDrawer(true);
    await user.click(screen.getByRole("button", { name: "seed-a" })); // $36
    await user.click(screen.getByRole("button", { name: "seed-b" })); // $30
    expect(screen.getByTestId("cart-drawer-subtotal")).toHaveTextContent("$66");

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[0]!);

    expect(screen.getByTestId("cart-drawer-subtotal")).toHaveTextContent("$30");
    expect(screen.queryByText("Exit Code 0 Tee")).not.toBeInTheDocument();
    expect(screen.getByText("sudo Cap")).toBeInTheDocument();
  });

  it("removing the only item falls back to the empty-bag message", async () => {
    const user = userEvent.setup();
    renderDrawer(true);
    await user.click(screen.getByRole("button", { name: "seed-a" }));

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
  });

  it("Checkout moves to a read-only order summary with subtotal, an estimated shipping/tax line, and a total", async () => {
    const user = userEvent.setup();
    renderDrawer(true);
    await user.click(screen.getByRole("button", { name: "seed-a" }));

    await user.click(screen.getByRole("button", { name: "Checkout" }));

    expect(screen.getByRole("heading", { name: "Review Order" })).toBeInTheDocument();
    expect(screen.getByText("Exit Code 0 Tee")).toBeInTheDocument();
    expect(screen.getByText("Shipping (est.)")).toBeInTheDocument();
    expect(screen.getByText("Tax (est.)")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    // No quantity stepper or Remove button on the read-only summary.
    expect(screen.queryByRole("button", { name: /increase quantity/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("the mock disclosure is rendered on the checkout screen before placing an order", async () => {
    const user = userEvent.setup();
    renderDrawer(true);
    await user.click(screen.getByRole("button", { name: "seed-a" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));

    expect(
      screen.getByText("This is a mockup checkout — no order is placed and no payment is processed."),
    ).toBeInTheDocument();
  });

  it("placing the order shows the honest post-checkout disclosure and clears the cart, without ever calling fetch or XMLHttpRequest", async () => {
    const fetchSpy = vi.fn();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const OriginalXHR = globalThis.XMLHttpRequest;
    const xhrConstructorSpy = vi.fn();
    class SpyXHR extends OriginalXHR {
      constructor() {
        super();
        xhrConstructorSpy();
      }
    }
    globalThis.XMLHttpRequest = SpyXHR as unknown as typeof XMLHttpRequest;

    const user = userEvent.setup();
    renderDrawer(true);
    await user.click(screen.getByRole("button", { name: "seed-a" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await user.click(screen.getByRole("button", { name: "Place Order" }));

    expect(
      screen.getByText(/this is a demo — no real order was placed/i),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrConstructorSpy).not.toHaveBeenCalled();

    globalThis.fetch = originalFetch;
    globalThis.XMLHttpRequest = OriginalXHR;
  });

  it("reopening the drawer after placing an order starts back at the (now empty) cart view, not the stale 'placed' screen", async () => {
    const user = userEvent.setup();
    let open = true;
    const onClose = vi.fn();
    const { rerender } = render(
      <CartProvider>
        <RouterProvider>
          <SeedProbe />
          <CartDrawer open={open} onClose={onClose} />
        </RouterProvider>
      </CartProvider>,
    );

    await user.click(screen.getByRole("button", { name: "seed-a" }));
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await user.click(screen.getByRole("button", { name: "Place Order" }));
    expect(screen.getByText(/this is a demo/i)).toBeInTheDocument();

    // Close, then reopen (simulated via rerender with a new `open` value, the way Layout
    // actually drives this component's `open` prop).
    open = false;
    rerender(
      <CartProvider>
        <RouterProvider>
          <SeedProbe />
          <CartDrawer open={open} onClose={onClose} />
        </RouterProvider>
      </CartProvider>,
    );
    open = true;
    rerender(
      <CartProvider>
        <RouterProvider>
          <SeedProbe />
          <CartDrawer open={open} onClose={onClose} />
        </RouterProvider>
      </CartProvider>,
    );

    expect(screen.getByText(/your bag is empty/i)).toBeInTheDocument();
  });

  it("clicking the backdrop calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer(true, onClose);

    await user.click(document.querySelector(".cart-drawer-backdrop")!);

    expect(onClose).toHaveBeenCalled();
  });

  it("pressing Escape calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer(true, onClose);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("the close button calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer(true, onClose);

    await user.click(screen.getByRole("button", { name: "Close cart" }));

    expect(onClose).toHaveBeenCalled();
  });
});

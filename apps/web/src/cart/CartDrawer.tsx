// Cart drawer + mock checkout (board task E4). A single overlay panel with three internal
// steps — "cart" (line items, quantity edit, remove, subtotal), "checkout" (a read-only
// order summary with a mock shipping/tax estimate and a "Place Order" button), and
// "placed" (the honest, explicit disclosure that nothing was actually sent anywhere) —
// rather than a separate modal dialog per step. One `role="dialog"` element, one focus
// trap entry point, one place to reason about keyboard/escape handling; simpler than
// juggling two stacked overlays (the cart drawer, `--zjc-z-drawer`, and a separate
// checkout dialog, `--zjc-z-modal`) for what is, functionally, one linear flow. This
// panel uses `--zjc-z-drawer`; `--zjc-z-modal` ships unused for now, which style-
// guide.md §6 explicitly allows for a token that doesn't have a component yet.
//
// Mounting: the backdrop + panel are always in the DOM (so the CSS slide/fade transition
// — `--zjc-dur-moderate` / `--zjc-ease-in-out`, per style-guide.md §5's drawer-open
// pairing rule — has something to animate), but the interactive content inside the panel
// only renders while `open` is true. That keeps a closed-but-still-mounted drawer from
// being tab-reachable (no `inert` polyfill needed) while still getting a real transition
// on open. Reduced-motion users get the token-level collapse to 0ms from tokens.css,
// same as every other animated element on the site (style-guide.md §5).
import { useEffect, useRef, useState } from "react";
import { useCart, type CartItem } from "./CartContext";
import { Link } from "../router/Router";
import { CATEGORY_LABEL, CURRENCY } from "../utils/format";

type Step = "cart" | "checkout" | "placed";

// Illustrative mock numbers only — not computed against any real address, carrier, or
// tax jurisdiction, and never sent anywhere (see the "Place Order" handler below). Kept
// as named constants, not magic numbers inline, so the "(est.)" labels in the summary
// and the math stay obviously in sync.
const MOCK_SHIPPING_ESTIMATE = 8;
const MOCK_TAX_RATE = 0.08;

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset back to the cart view whenever the drawer is reopened after having reached
  // "checkout" or "placed" on a previous visit — a visitor who closes a completed mock
  // order and reopens the (now-empty) drawer should see the ordinary empty-cart state,
  // not a stale "order placed" screen.
  useEffect(() => {
    if (open) {
      setStep("cart");
    }
  }, [open]);

  // Focus the panel on open (so keyboard/screen-reader users land inside the dialog
  // immediately), close on Escape, and trap Tab/Shift+Tab so keyboard focus can never
  // reach the dimmed background page while the drawer is open (carried over from E4's
  // Architect review, docs/architecture/reviews/feat-web-checkout.md §5 — the backdrop's
  // pointer-events already blocked mouse/pointer users from reaching background content,
  // but had no effect on keyboard Tab order; this closes that gap for keyboard users
  // specifically). Returning focus to the trigger button on close is the caller's job
  // (src/layout/Layout.tsx) — it owns the button that opened this.
  useEffect(() => {
    if (!open) {
      return;
    }
    panelRef.current?.focus();

    // Queried live on every Tab keypress, not memoized, since the set of focusable
    // elements changes as `step` changes (cart → checkout → placed each render different
    // buttons/links). Order matches source order, which matches visual/tab order here —
    // nothing in this panel uses a custom `tabindex`.
    function getFocusable(): HTMLElement[] {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const focusable = getFocusable();
      if (focusable.length === 0) {
        // Nothing focusable inside (shouldn't happen — every step renders at least a
        // close/back button — but keep focus pinned to the panel itself rather than
        // letting it leak out if it ever does).
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey) {
        // Shift+Tab from the first focusable element, or from the panel itself (the
        // initial-focus target right after open, which isn't in the focusable list) —
        // wrap to the last element instead of escaping into the background.
        if (activeIndex <= 0) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Tab from the last focusable element, or from anywhere focus has drifted
        // outside the tracked list — wrap to the first element.
        if (activeIndex === -1 || activeIndex === focusable.length - 1) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock background scroll while the drawer is open, restoring whatever was there before
  // (usually "") on close/unmount.
  useEffect(() => {
    if (!open) {
      return;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  function handlePlaceOrder() {
    // Mock checkout only — ADR 0003 and the project brief's "mockup discipline" rule
    // (no real payment processing, no real order ever sent anywhere), matching D1's
    // explicit cart/checkout copy rule (docs/design/concept.md §2). This is the exact
    // point a real implementation would call a payment/order API — e.g.
    // `await fetch("/api/orders", { method: "POST", body: ... })` or a third-party
    // checkout SDK's charge call — intentionally not implemented. `clearCart()` only
    // resets local React state + localStorage (src/cart/CartContext.tsx); nothing in
    // this handler, or anywhere else in this file, makes or will ever make a network
    // call. The "placed" step below states this outright rather than implying success.
    clearCart();
    setStep("placed");
  }

  function handleContinueShopping() {
    setStep("cart");
    onClose();
  }

  return (
    <>
      <div
        className="cart-drawer-backdrop"
        data-open={open}
        aria-hidden="true"
        onClick={open ? onClose : undefined}
      />
      <div
        ref={panelRef}
        id="cart-drawer"
        className="cart-drawer"
        data-open={open}
        // role/aria-modal/aria-labelledby only apply while open — closed, this is just
        // an empty, non-interactive, off-screen panel kept mounted for the CSS
        // transition (see the module comment above), not a dialog an assistive
        // technology should ever announce or be able to query for.
        role={open ? "dialog" : undefined}
        aria-modal={open ? "true" : undefined}
        aria-labelledby={open ? "cart-drawer-title" : undefined}
        tabIndex={-1}
      >
        {open && (
          <>
            {step === "cart" && (
              <CartStep
                items={items}
                subtotal={subtotal}
                onClose={onClose}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                onCheckout={() => setStep("checkout")}
              />
            )}
            {step === "checkout" && (
              <CheckoutStep
                items={items}
                subtotal={subtotal}
                onBack={() => setStep("cart")}
                onPlaceOrder={handlePlaceOrder}
              />
            )}
            {step === "placed" && <PlacedStep onContinueShopping={handleContinueShopping} />}
          </>
        )}
      </div>
    </>
  );
}

function CartStep({
  items,
  subtotal,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: {
  items: CartItem[];
  subtotal: number;
  onClose: () => void;
  onUpdateQuantity: (productId: string, variant: string, quantity: number) => void;
  onRemove: (productId: string, variant: string) => void;
  onCheckout: () => void;
}) {
  return (
    <div className="cart-drawer__inner">
      <div className="cart-drawer__header">
        <h2 id="cart-drawer-title">Your Bag</h2>
        <button type="button" className="cart-drawer__close" onClick={onClose}>
          <span className="sr-only">Close cart</span>
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {items.length === 0 ? (
        <p className="cart-drawer__empty">
          Your bag is empty. Nothing to check out yet.{" "}
          <Link to="/catalog" onClick={onClose}>
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <>
          <ul className="cart-drawer__items">
            {items.map((item) => (
              <li className="cart-drawer__item" key={`${item.productId}-${item.variant}`}>
                <div className="cart-drawer__item-info">
                  <p className="cart-drawer__item-name">{item.name}</p>
                  <p className="cart-drawer__item-meta">
                    {CATEGORY_LABEL[item.category]} · {item.variant}
                  </p>
                </div>
                <div
                  className="cart-drawer__qty"
                  role="group"
                  aria-label={`Quantity for ${item.name}, ${item.variant}`}
                >
                  <button
                    type="button"
                    className="cart-drawer__qty-button"
                    onClick={() => onUpdateQuantity(item.productId, item.variant, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity of ${item.name}, ${item.variant}`}
                  >
                    −
                  </button>
                  <span className="cart-drawer__qty-value">{item.quantity}</span>
                  <button
                    type="button"
                    className="cart-drawer__qty-button"
                    onClick={() => onUpdateQuantity(item.productId, item.variant, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.name}, ${item.variant}`}
                  >
                    +
                  </button>
                </div>
                <p className="cart-drawer__item-price">{CURRENCY.format(item.price * item.quantity)}</p>
                <button
                  type="button"
                  className="button button--destructive cart-drawer__remove"
                  onClick={() => onRemove(item.productId, item.variant)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="cart-drawer__subtotal">
            <span>Subtotal</span>
            <span data-testid="cart-drawer-subtotal">{CURRENCY.format(subtotal)}</span>
          </div>
          <p className="cart-drawer__subtotal-note">Shipping and tax estimated at checkout.</p>

          <button type="button" className="button button--primary cart-drawer__checkout" onClick={onCheckout}>
            Checkout
          </button>
        </>
      )}
    </div>
  );
}

function CheckoutStep({
  items,
  subtotal,
  onBack,
  onPlaceOrder,
}: {
  items: CartItem[];
  subtotal: number;
  onBack: () => void;
  onPlaceOrder: () => void;
}) {
  const shipping = items.length > 0 ? MOCK_SHIPPING_ESTIMATE : 0;
  const tax = subtotal * MOCK_TAX_RATE;
  const total = subtotal + shipping + tax;

  return (
    <div className="cart-drawer__inner">
      <div className="cart-drawer__header">
        <h2 id="cart-drawer-title">Review Order</h2>
        <button type="button" className="cart-drawer__close" onClick={onBack}>
          <span className="sr-only">Back to bag</span>
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <ul className="cart-drawer__items cart-drawer__items--summary">
        {items.map((item) => (
          <li className="cart-drawer__item cart-drawer__item--summary" key={`${item.productId}-${item.variant}`}>
            <div className="cart-drawer__item-info">
              <p className="cart-drawer__item-name">{item.name}</p>
              <p className="cart-drawer__item-meta">
                {CATEGORY_LABEL[item.category]} · {item.variant} · qty {item.quantity}
              </p>
            </div>
            <p className="cart-drawer__item-price">{CURRENCY.format(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="cart-drawer__totals">
        <div className="cart-drawer__totals-row">
          <dt>Subtotal</dt>
          <dd>{CURRENCY.format(subtotal)}</dd>
        </div>
        <div className="cart-drawer__totals-row">
          <dt>Shipping (est.)</dt>
          <dd>{CURRENCY.format(shipping)}</dd>
        </div>
        <div className="cart-drawer__totals-row">
          <dt>Tax (est.)</dt>
          <dd>{CURRENCY.format(tax)}</dd>
        </div>
        <div className="cart-drawer__totals-row cart-drawer__totals-row--total">
          <dt>Total</dt>
          <dd>{CURRENCY.format(total)}</dd>
        </div>
      </dl>

      <p className="cart-drawer__mock-notice">
        This is a mockup checkout — no order is placed and no payment is processed.
      </p>

      <div className="cart-drawer__actions">
        <button type="button" className="button button--ghost" onClick={onBack}>
          Back to bag
        </button>
        <button type="button" className="button button--primary" onClick={onPlaceOrder}>
          Place Order
        </button>
      </div>
    </div>
  );
}

function PlacedStep({ onContinueShopping }: { onContinueShopping: () => void }) {
  return (
    <div className="cart-drawer__inner">
      <div className="cart-drawer__header">
        <h2 id="cart-drawer-title">Nothing Sent</h2>
      </div>
      <p className="cart-drawer__mock-notice" role="status">
        This is a demo — no real order was placed, no payment was processed, and nothing
        was sent anywhere. Your bag has been cleared, same as a real checkout would, but
        that&rsquo;s the only thing that happened here.
      </p>
      <div className="cart-drawer__actions">
        <button type="button" className="button button--primary" onClick={onContinueShopping}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

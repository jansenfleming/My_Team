// Mock cart state (board task E3, extended for E4): a React context holding cart items
// (product + variant + quantity), persisted across the session via localStorage.
// Frontend-only, per ADR 0003 — no server, no network call, ever, for cart or checkout.
// The comment at the exact point a real payment/order integration would go lives in
// src/cart/CartDrawer.tsx's "Place Order" handler (board task E4) — src/pages/
// ProductPage.tsx carries the equivalent comment for "Add to Cart" (board task E3).
//
// E4 additions: `updateQuantity` and `removeItem` are deliberately separate actions (the
// board's cart drawer spec calls for both "a way to edit quantity" and "a way to remove
// an item" as distinct affordances) rather than overloading one function with a
// quantity-reaches-zero-means-remove rule. `updateQuantity` always clamps to a minimum
// of 1 — going to zero is what the Remove button is for. `subtotal` and `clearCart` back
// the cart drawer and the mock checkout step.
//
// localStorage access is wrapped in try/catch on both read and write: a blocked or full
// localStorage (private browsing, quota exceeded, disabled storage) must never crash the
// app — the cart still works in-memory for the current page session, it just won't
// survive a reload in that fallback case.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product, ProductCategory } from "../data/products";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  category: ProductCategory;
  variant: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  /** Sum of price × quantity across every line item. */
  subtotal: number;
  addItem: (
    product: Pick<Product, "id" | "name" | "price" | "category">,
    variant: string,
    quantity?: number,
  ) => void;
  /** Sets an existing line's quantity outright (not a delta). Clamped to a minimum of 1
   * — pass through `removeItem` to take a line to zero. A no-op if no line matches
   * `productId` + `variant`. */
  updateQuantity: (productId: string, variant: string, quantity: number) => void;
  /** Removes the one line matching `productId` + `variant` entirely. */
  removeItem: (productId: string, variant: string) => void;
  /** Empties the cart. Used when the mock checkout "places" an order (board task E4) —
   * see the comment at that call site for why nothing is sent anywhere. */
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "zj_cart";

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    typeof v.name === "string" &&
    typeof v.price === "number" &&
    typeof v.category === "string" &&
    typeof v.variant === "string" &&
    typeof v.quantity === "number" &&
    v.quantity > 0
  );
}

/** Reads and validates the persisted cart. Any failure — storage unavailable, blocked,
 * or containing malformed/foreign JSON — falls back to an empty cart rather than
 * throwing or rendering garbage. */
function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable/full/blocked — the cart keeps working from React state for
      // this render pass; it just won't persist across a reload. Never let this crash
      // the app (see module comment above).
    }
  }, [items]);

  const addItem = useCallback<CartContextValue["addItem"]>((product, variant, quantity = 1) => {
    setItems((current) => {
      const isSameLine = (item: CartItem) => item.productId === product.id && item.variant === variant;
      if (current.some(isSameLine)) {
        return current.map((item) =>
          isSameLine(item) ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          variant,
          quantity,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>((productId, variant, quantity) => {
    const clamped = Math.max(1, Math.trunc(quantity));
    setItems((current) =>
      current.map((item) =>
        item.productId === productId && item.variant === variant
          ? { ...item, quantity: clamped }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback<CartContextValue["removeItem"]>((productId, variant) => {
    setItems((current) =>
      current.filter((item) => !(item.productId === productId && item.variant === variant)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, totalQuantity, subtotal, addItem, updateQuantity, removeItem, clearCart }),
    [items, totalQuantity, subtotal, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

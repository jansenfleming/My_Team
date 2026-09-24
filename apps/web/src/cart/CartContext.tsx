// Mock cart state (board task E3): a React context holding cart items (product +
// variant + quantity), persisted across the session via localStorage. Frontend-only,
// per ADR 0003 — no server, no network call, ever, for cart or checkout. The comment at
// the exact point a real payment/order integration would go lives in
// src/pages/ProductPage.tsx, next to the "Add to Cart" action.
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
  addItem: (
    product: Pick<Product, "id" | "name" | "price" | "category">,
    variant: string,
    quantity?: number,
  ) => void;
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

  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ items, totalQuantity, addItem }),
    [items, totalQuantity, addItem],
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

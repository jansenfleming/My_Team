// Shared formatting helpers for anywhere a product's price or category needs a
// human-readable label — the catalog grid tile (board task E2) and the product detail
// page (board task E3). Centralized so both render identical price/category text
// instead of duplicating the same two small maps.
import type { ProductCategory } from "../data/products";

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  shirt: "Shirt",
  sweatshirt: "Sweatshirt",
  hat: "Hat",
};

export const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

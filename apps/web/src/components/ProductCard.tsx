// Product tile for the catalog grid (board task E2). There is no real product
// photography yet, so the "image" is a CSS-only styled placeholder built from D2's grid
// motif and panel tokens (docs/design/tokens.css, docs/design/style-guide.md §3) — never a
// broken <img>, a stock photo, or a fetched external image.
import { Link } from "../router/Router";
import type { Product } from "../data/products";

const CATEGORY_LABEL: Record<Product["category"], string> = {
  shirt: "Shirt",
  sweatshirt: "Sweatshirt",
  hat: "Hat",
};

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function ProductCard({ product }: { product: Product }) {
  return (
    <li className="product-card">
      <Link to={`/product/${product.id}`} className="product-card__link">
        {/* Styled placeholder in place of product photography: the grid motif from
            tokens.css on a --zjc-bg-surface tile, with the category set large in the
            structural monospace accent. Decorative — the product name/category are
            already announced as real text below, so this is aria-hidden rather than
            given a redundant accessible name. */}
        <span className="product-card__placeholder" data-category={product.category} aria-hidden="true">
          <span className="product-card__placeholder-label">{CATEGORY_LABEL[product.category]}</span>
        </span>
        <span className="product-card__body">
          <span className="product-card__name">{product.name}</span>
          <span className="product-card__meta">
            <span className="product-card__category">{CATEGORY_LABEL[product.category]}</span>
            <span className="product-card__price">{CURRENCY.format(product.price)}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

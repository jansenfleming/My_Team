// Real product-detail route (board task E3): looks up the product by slug in the main
// catalog (src/data/products.ts), and renders its name, category, price, description,
// tags, special-copy block (if present, in the D2 dark-panel treatment), a mock
// size/variant picker, and an "Add to Cart" action backed by the cart context
// (src/cart/CartContext.tsx). An unknown slug reuses the existing NotFoundPage rather
// than duplicating its markup.
import { useState } from "react";
import { useCart } from "../cart/CartContext";
import { products, type Product } from "../data/products";
import { VARIANTS } from "../data/variants";
import { CATEGORY_LABEL, CURRENCY } from "../utils/format";
import { NotFoundPage } from "./NotFoundPage";

// Plain search against the 12-item main catalog only — never `hiddenProduct`
// (src/data/products.ts), which this file doesn't import. The Konami-code easter egg
// (docs/design/easter-eggs.md §3, board task E6) will extend this lookup with a branch
// that returns the hidden product for its slug when
// `localStorage.getItem("zj_unlocked_200ok") === "1"`, falling through to the same
// not-found path when it isn't. This function's shape (a slug in, a Product or undefined
// out, NotFoundPage on a miss) doesn't need to change for that — only a new branch goes
// inside it. Not implemented here: that's E6's job, not E3's (see board task E3's
// kickoff note).
function findProduct(slug: string): Product | undefined {
  return products.find((product) => product.id === slug);
}

export function ProductPage({ slug }: { slug: string }) {
  const product = findProduct(slug);

  if (!product) {
    return <NotFoundPage />;
  }

  // Keyed on the product id so navigating directly from one product detail page to
  // another (e.g. via a future "related products" link) resets the local variant
  // selection and confirmation message instead of carrying stale state across products.
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const variants = VARIANTS[product.category];
  // VARIANTS always supplies at least one option per category (see data/variants.ts);
  // the `?? ""` fallback only satisfies noUncheckedIndexedAccess, it's never reached.
  const [variant, setVariant] = useState(variants[0] ?? "");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function handleAddToCart() {
    addItem(product, variant);
    setConfirmation(`Added 1 × ${product.name} (${variant}) to cart.`);
  }

  return (
    <section className="page page-product">
      <p className="product-detail__category">{CATEGORY_LABEL[product.category]}</p>
      <h1>{product.name}</h1>
      <p className="product-detail__price">{CURRENCY.format(product.price)}</p>
      <p className="product-detail__description">{product.description}</p>

      {product.tags.length > 0 && (
        <ul className="product-detail__tags" aria-label="Tags">
          {product.tags.map((tag) => (
            <li key={tag} className="tag">
              {tag}
            </li>
          ))}
        </ul>
      )}

      {product.specialCopy && (
        <div className="product-detail__special-copy">
          <p className="product-detail__special-copy-label">{product.specialCopy.label}</p>
          <pre className="product-detail__special-copy-block">{product.specialCopy.content}</pre>
        </div>
      )}

      <fieldset className="product-detail__variants">
        <legend>Size</legend>
        <div className="product-detail__variant-options">
          {variants.map((option) => (
            <label
              key={option}
              className="product-detail__variant-option"
              data-selected={option === variant}
            >
              <input
                type="radio"
                name={`variant-${product.id}`}
                value={option}
                checked={option === variant}
                onChange={() => {
                  setVariant(option);
                  setConfirmation(null);
                }}
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        className="button button--primary product-detail__add-to-cart"
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>

      {/*
        Mock cart only — no real commerce anywhere on this site (ADR 0003; project
        brief's "mockup discipline" rule). This is the exact point a real implementation
        would call a payment/order API (e.g. POST /api/orders, or a third-party checkout
        SDK) — intentionally not implemented. `addItem` above only updates in-memory
        React state and localStorage; nothing on this page makes, or will ever make, a
        network call.
      */}

      <p className="product-detail__confirmation" role="status" aria-live="polite">
        {confirmation}
      </p>
    </section>
  );
}

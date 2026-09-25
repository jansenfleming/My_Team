// Reusable placeholder-block product card for the lookbook page (board task E5, spec
// docs/design/lookbook.md §4). Same "no real photography" discipline as
// components/ProductCard.tsx (board task E2): the "image" is a CSS-only grid-motif tile,
// never an <img>, a stock photo, or a fetched external image. Unlike ProductCard, this
// tile carries a visible category tag pinned over the image area and a caption below the
// tile — distinct editorial treatment per D4, not a restyle of the catalog-grid tile.
import { Link } from "../router/Router";
import type { Product } from "../data/products";

const CATEGORY_LABEL: Record<Product["category"], string> = {
  shirt: "Shirt",
  sweatshirt: "Sweatshirt",
  hat: "Hat",
};

export function LookbookCard({
  product,
  caption,
}: {
  product: Product;
  caption: string;
}) {
  // Markup follows docs/design/lookbook.md §4's spec exactly: a single <a class="lookbook-
  // card"> wraps the tile and caption. The <li> is a bare grid item (styling lives on the
  // <ul class="lookbook-cards"> grid container), matching how the spec's markup has no
  // list wrapper of its own to style.
  return (
    <li>
      <Link to={`/product/${product.id}`} className="lookbook-card">
        <div className="lookbook-card__tile">
          <div className="lookbook-card__image-area" aria-hidden="true" />
          <span className="lookbook-card__tag">{CATEGORY_LABEL[product.category]}</span>
          <div className="lookbook-card__nameplate">
            <h3 className="lookbook-card__name">{product.name}</h3>
          </div>
        </div>
        <p className="lookbook-card__caption">{caption}</p>
      </Link>
    </li>
  );
}

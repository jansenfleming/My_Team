// Catalog route (board task E2): a responsive product grid built from the typed product
// data module (src/data/products.ts), styled with D2's real design tokens. Renders all 12
// main-catalog products — the hidden 13th product (src/data/products.ts `hiddenProduct`)
// is a separate export and is never imported here, per docs/design/products.md §3.
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function CatalogPage() {
  return (
    <section className="page page-catalog">
      <div className="page-catalog__intro">
        <h1>Catalog</h1>
        <p className="page-catalog__count">
          {products.length} products — shirts, sweatshirts, and hats.
        </p>
      </div>
      <ul className="catalog-grid" aria-label="All products">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </section>
  );
}

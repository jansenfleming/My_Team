// Placeholder catalog route. The real product grid (typed data module, images, price,
// category) is board task E2 — this only proves the route renders a grid-shaped skeleton
// that's already responsive (see .catalog-grid-skeleton in index.css).
export function CatalogPage() {
  const placeholderCount = 6;

  return (
    <section className="page page-catalog">
      <h1>Catalog</h1>
      <p className="placeholder-copy">
        Product grid coming soon — shirts, sweatshirts, and hats (board task E2).
      </p>
      <ul className="catalog-grid-skeleton" aria-label="Placeholder product grid">
        {Array.from({ length: placeholderCount }, (_, index) => (
          <li className="catalog-grid-skeleton__card" key={index} aria-hidden="true" />
        ))}
      </ul>
    </section>
  );
}

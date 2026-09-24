// Placeholder product-detail route. Real product data, images, variant picker, and
// "Add to Cart" land in board task E3 once the typed product-data module exists. For E1
// this only proves the /product/:slug route shape resolves and renders.
export function ProductPage({ slug }: { slug: string }) {
  return (
    <section className="page page-product">
      <h1>Product detail</h1>
      <p className="placeholder-copy">
        Product pages render per item once the product data module lands (board task E3).
      </p>
      <p>
        Requested product: <code>{slug}</code>
      </p>
    </section>
  );
}

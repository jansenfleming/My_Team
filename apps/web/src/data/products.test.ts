import { describe, expect, it } from "vitest";
import { hiddenProduct, products, type ProductCategory } from "./products";

// Board task E2 — docs/design/products.md §0 fixes these counts exactly: 12 products in
// the main catalog, 5 shirts / 4 sweatshirts / 3 hats, and a 13th hidden product that must
// never be part of the main array.
describe("products data module", () => {
  it("has exactly 12 products in the main catalog (not 13)", () => {
    expect(products).toHaveLength(12);
  });

  it("has a category split of 5 shirts, 4 sweatshirts, 3 hats", () => {
    const counts = products.reduce<Record<ProductCategory, number>>(
      (acc, product) => {
        acc[product.category] += 1;
        return acc;
      },
      { shirt: 0, sweatshirt: 0, hat: 0 },
    );

    expect(counts).toEqual({ shirt: 5, sweatshirt: 4, hat: 3 });
  });

  it("only uses shirt/sweatshirt/hat categories (no accessories)", () => {
    const allowed: ProductCategory[] = ["shirt", "sweatshirt", "hat"];
    for (const product of products) {
      expect(allowed).toContain(product.category);
    }
  });

  it("gives every product a unique, non-empty id, name, and a positive price", () => {
    const ids = new Set<string>();
    for (const product of products) {
      expect(product.id.length).toBeGreaterThan(0);
      expect(product.name.length).toBeGreaterThan(0);
      expect(product.price).toBeGreaterThan(0);
      expect(ids.has(product.id)).toBe(false);
      ids.add(product.id);
    }
    expect(ids.size).toBe(12);
  });

  it("gives every product at least one tag", () => {
    for (const product of products) {
      expect(product.tags.length).toBeGreaterThan(0);
    }
  });

  it("excludes the hidden 13th product (200 OK Tee) from the main catalog array", () => {
    expect(products.some((product) => product.id === "200-ok")).toBe(false);
    expect(products.some((product) => product.name === "200 OK Tee")).toBe(false);
  });

  it("keeps the hidden product as a separate export, tagged 'hidden', not in `products`", () => {
    // Fixed slug per docs/design/easter-eggs.md §3 ("Fixed slug: `200-ok`. Route:
    // `/product/200-ok`.") — the Architect-approved, load-bearing id for the Konami
    // mechanism (board task E6). Not "200-ok-tee", an earlier draft value from before D5.
    expect(hiddenProduct.id).toBe("200-ok");
    expect(hiddenProduct.tags).toContain("hidden");
    expect(products).not.toContain(hiddenProduct);
  });

  it("renders the longer product names without any special copy fine (plain-copy edge case)", () => {
    // "Works on My Machine Tee" is one of D3's intentionally plain-copy products (no
    // specialCopy block) and one of the longer names in the set — both are edge cases
    // the catalog grid must handle cleanly.
    const plain = products.find((product) => product.id === "works-on-my-machine-tee");
    expect(plain).toBeDefined();
    expect(plain?.specialCopy).toBeUndefined();
    expect(plain?.name.length).toBeGreaterThan(20);
  });

  it("preserves special-copy blocks verbatim where D3 specifies one", () => {
    const exitCode = products.find((product) => product.id === "exit-code-0-tee");
    expect(exitCode?.specialCopy?.content).toBe(
      `# care.cfg\nwash: cold\ndry: tumble_low\niron: false\nbleach: never\nexit_code: 0`,
    );
  });
});

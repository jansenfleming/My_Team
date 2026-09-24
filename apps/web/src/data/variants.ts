// Mock size/variant options per product category (board task E3). Neither D2 nor D3
// specifies an exact size run, so this is the Engineer's plausible, simple call: shirts
// and sweatshirts get a standard four-size run; hats are one-size, which matches how most
// snapback/adjustable-strap streetwear caps are actually sold, and there's no separate
// fitted-cap product in the catalog that would justify more than one option. If the
// Creative Director wants different sizing (e.g. a fitted-cap size run), this is the one
// file to change — nothing else derives sizes from anywhere else.
import type { ProductCategory } from "./products";

export const VARIANTS: Record<ProductCategory, string[]> = {
  shirt: ["S", "M", "L", "XL"],
  sweatshirt: ["S", "M", "L", "XL"],
  hat: ["One Size"],
};

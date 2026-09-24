// Placeholder home page. Replaced once D1 (brand identity) and D3 (product copy) land —
// see board task E1 for the shell, E2 for the real catalog grid on this route family.
import { Link } from "../router/Router";

export function HomePage() {
  return (
    <section className="page page-home">
      <h1>ZeroJance</h1>
      <p className="placeholder-copy">
        Tech-culture streetwear, mocked up for now. Real brand copy and product photos
        land once the Creative Director's specs (docs/design/**) are in.
      </p>
      <p>
        <Link to="/catalog">Browse the catalog</Link>
      </p>
    </section>
  );
}

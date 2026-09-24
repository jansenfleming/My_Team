// Plain 404. A styled joke 404 ("item not found in catalog", a stack trace, etc.) is on
// the easter-egg candidate list for the Creative Director's D5 spec (board task E6) —
// this is the honest placeholder until that's specified and built.
import { Link } from "../router/Router";

export function NotFoundPage() {
  return (
    <section className="page page-not-found">
      <h1>404</h1>
      <p className="placeholder-copy">This page isn&rsquo;t in the catalog.</p>
      <p>
        <Link to="/">Back to home</Link>
      </p>
    </section>
  );
}

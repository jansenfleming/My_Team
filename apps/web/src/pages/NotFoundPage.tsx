// Joke 404 — "item not found in catalog" (docs/design/easter-eggs.md §2, board task E6).
// Any pathname matchRoute() (src/router/matchRoute.ts) doesn't match already renders this
// page via App.tsx's route switch. The hidden 13th product's slug (/product/200-ok)
// whenever it isn't unlocked is just another unmatched-at-render-time product lookup
// (src/pages/ProductPage.tsx) rendering this exact same page — no special-casing needed
// here for that.
import { Link, useRouter } from "../router/Router";

const MAX_DISPLAY_LENGTH = 60;
const TRUNCATE_LENGTH = 57;

/** Truncates an overlong pathname for the status line, per docs/design/easter-eggs.md §2,
 * so an unusual or very long path can't force horizontal scroll or overflow on mobile.
 * Measured against the pathname with its leading "/" excluded, per that spec; the
 * `overflow-wrap: anywhere` rule in index.css is the second line of defense. */
function formatPathnameForDisplay(pathname: string): string {
  const withoutLeadingSlash = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (withoutLeadingSlash.length <= MAX_DISPLAY_LENGTH) {
    return pathname;
  }
  return `/${withoutLeadingSlash.slice(0, TRUNCATE_LENGTH)}…`;
}

export function NotFoundPage() {
  const { pathname } = useRouter();
  const displayPathname = formatPathnameForDisplay(pathname);

  return (
    <section className="page page-not-found">
      <h1>404</h1>
      {/* Rendered as ordinary JSX text, never dangerouslySetInnerHTML — React escapes
          `displayPathname` automatically, so an unusual or malformed path in the URL bar
          can't inject markup. */}
      <p className="page-not-found__status">GET {displayPathname} → 404 Not Found</p>
      <p className="page-not-found__body">Not in the catalog. Try the catalog instead.</p>
      <p className="page-not-found__links">
        <Link to="/catalog">Back to catalog</Link>
        <Link to="/">Back home</Link>
      </p>
    </section>
  );
}

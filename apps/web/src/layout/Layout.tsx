// Mobile-first app shell: skip link, header with a collapsible nav (a real <button> that
// toggles visibility below the desktop breakpoint — CSS handles the breakpoint switch;
// see index.css), a single <main> landmark, and a footer. Placeholder nav labels/copy
// until the Creative Director's specs (D1-D4) land — see board task E1.
//
// Board task E4 adds the cart drawer toggle button (right next to the existing cart
// count) and renders <CartDrawer>. Deliberately a small, additive change to this file —
// same reasoning as E3's cart-count addition: another Engineer instance may be touching
// this file on a parallel branch (easter eggs, board task E6), so nothing here is
// restructured, just added to.
import { useRef, useState, type ReactNode } from "react";
import { CartDrawer } from "../cart/CartDrawer";
import { useCart } from "../cart/CartContext";
import { KonamiEasterEgg } from "../eggs/KonamiEasterEgg";
import { Link, useRouter } from "../router/Router";

const NAV_LINKS = [
  { to: "/catalog", label: "Catalog" },
  { to: "/lookbook", label: "Lookbook" },
  { to: "/about", label: "About" },
];

export function Layout({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { pathname } = useRouter();
  const { totalQuantity } = useCart();
  const cartToggleRef = useRef<HTMLButtonElement>(null);

  // Returns focus to the button that opened the drawer, rather than leaving it on
  // whatever the drawer's own close control was (which just unmounted).
  function closeCart() {
    setCartOpen(false);
    cartToggleRef.current?.focus();
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header__bar">
          <Link to="/" className="brand" onClick={() => setNavOpen(false)}>
            ZeroJance
          </Link>
          <div className="site-header__actions">
            {/* Cart count (board task E3) stays plain text — the button beside it (board
                task E4) is the one interactive cart control, so the count itself doesn't
                need to duplicate that affordance. */}
            <p className="cart-indicator" aria-live="polite">
              Cart ({totalQuantity})
            </p>
            <button
              ref={cartToggleRef}
              type="button"
              className="cart-toggle"
              aria-haspopup="dialog"
              aria-expanded={cartOpen}
              aria-controls="cart-drawer"
              onClick={() => setCartOpen(true)}
            >
              Open cart
            </button>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={navOpen}
              aria-controls="primary-nav"
              onClick={() => setNavOpen((open) => !open)}
            >
              <span className="sr-only">{navOpen ? "Close menu" : "Open menu"}</span>
              <span aria-hidden="true">{navOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
        <nav id="primary-nav" className="site-nav" data-open={navOpen} aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setNavOpen(false)}
                  aria-current={pathname === link.to ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main-content" className="site-main">
        {children}
      </main>
      <footer className="site-footer">
        <p>
          ZeroJance is a mockup catalog. Nothing on this site processes a real payment or
          sends a real order. Browse like it&apos;s localhost — nothing you do here leaves
          the browser.
        </p>
      </footer>
      <CartDrawer open={cartOpen} onClose={closeCart} />
      {/* Konami-code easter egg (docs/design/easter-eggs.md §3, board task E6): a global
          keydown listener + its confirmation banner, mounted once here so it's alive for
          every route without remounting on navigation. Kept as a single self-contained
          component (own state, own effect) so it's additive here — one import, one line —
          rather than restructuring this file. */}
      <KonamiEasterEgg />
    </div>
  );
}

// Mobile-first app shell: skip link, header with a collapsible nav (a real <button> that
// toggles visibility below the desktop breakpoint — CSS handles the breakpoint switch;
// see index.css), a single <main> landmark, and a footer. Placeholder nav labels/copy
// until the Creative Director's specs (D1-D4) land — see board task E1.
import { useState, type ReactNode } from "react";
import { Link, useRouter } from "../router/Router";

const NAV_LINKS = [
  { to: "/catalog", label: "Catalog" },
  { to: "/lookbook", label: "Lookbook" },
  { to: "/about", label: "About" },
];

export function Layout({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useRouter();

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
          sends a real order. [PLACEHOLDER: real footer copy from the Creative Director.]
        </p>
      </footer>
    </div>
  );
}

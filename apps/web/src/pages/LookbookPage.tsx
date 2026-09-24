// Lookbook/editorial page (board task E5, spec docs/design/lookbook.md — D4). Four "look"
// sections, each pairing 3 of the 12 main-catalog products around a workday moment, built
// entirely from the shared product-data module (src/data/products.ts, D3/E2) — this file
// invents no product data of its own and never imports `hiddenProduct` (D4's explicit
// "not on this page" rule for the Konami-code 13th product).
import { useEffect, useRef, useState } from "react";
import { Link } from "../router/Router";
import { LookbookCard } from "../components/LookbookCard";
import { products, type Product } from "../data/products";

interface LookItem {
  productName: string;
  caption: string;
}

interface LookSpec {
  id: string;
  heading: string;
  kicker: string;
  intro: string;
  items: LookItem[];
}

// D4 §3: four looks, 3 products each, covering all 12 main-catalog products exactly once
// (5 shirts, 4 sweatshirts, 3 hats — D3's full split). Captions are distinct, shorter
// editorial lines, not copy-pasted from each product's catalog description.
const LOOKS: LookSpec[] = [
  {
    id: "local",
    heading: "Local",
    kicker: "environment: local",
    intro:
      "Before anything ships, before anyone's watching. Just you, a terminal, and whatever's running on port 3000.",
    items: [
      { productName: "localhost Tee", caption: "Home base. 127.0.0.1, every time." },
      {
        productName: "Rubber Duck Hoodie",
        caption: "For talking through the bug before you ask anyone else.",
      },
      { productName: "sudo Cap", caption: "Full permissions. Still your problem." },
    ],
  },
  {
    id: "on-call",
    heading: "On-Call",
    kicker: "rotation: primary",
    intro: "Something's paging. The fix can wait for coffee; the ack can't.",
    items: [
      {
        productName: "Works on My Machine Tee",
        caption: "True in dev. Under investigation everywhere else.",
      },
      {
        productName: "Technical Debt Hoodie",
        caption: "The balance came due at 2am, like it does.",
      },
      {
        productName: "TCP Handshake Cap",
        caption: "SYN sent. Waiting on the rest of the team to ACK.",
      },
    ],
  },
  {
    id: "staging",
    heading: "Staging",
    kicker: "environment: staging",
    intro: "Everything that's supposed to break, breaking here instead of in front of a client.",
    items: [
      {
        productName: "403 / 404 Tee",
        caption: "Access denied, or never existed. Staging doesn't clarify which.",
      },
      { productName: "cron Crewneck", caption: "Running on a schedule nobody on the team wrote down." },
      { productName: "Off-by-One Cap", caption: "One more pass before this counts." },
    ],
  },
  {
    id: "shipped",
    heading: "Shipped",
    kicker: "environment: production",
    intro: "It's out. Somebody's name is on the commit, and the logs are clean — for now.",
    items: [
      { productName: "Exit Code 0 Tee", caption: "Clean run. Nothing to report." },
      { productName: "git blame Tee", caption: "The record doesn't forget who touched this last." },
      { productName: "Staging vs Prod Crewneck", caption: "Same shirt. Higher stakes." },
    ],
  },
];

const PRODUCTS_BY_NAME = new Map<string, Product>(products.map((product) => [product.name, product]));

function resolveProduct(name: string): Product {
  const product = PRODUCTS_BY_NAME.get(name);
  if (!product) {
    // Fails loudly at render time rather than silently dropping a card — this can only
    // happen if this page's LOOKS table drifts out of sync with src/data/products.ts.
    throw new Error(`LookbookPage: no product named "${name}" in src/data/products.ts`);
  }
  return product;
}

/** True only when the browser supports the two APIs the scroll-reveal effect needs *and*
 * the visitor hasn't asked for reduced motion — computed once, synchronously, so the very
 * first render already reflects it (no flash of the wrong state). Per D4 §5's "JS gate":
 * if this is false, the reveal effect never runs at all and every section renders at its
 * final, fully visible state immediately. */
function motionIsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  if (typeof IntersectionObserver === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}

function LookSection({ look, motionEnabled }: { look: LookSpec; motionEnabled: boolean }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const headingId = `look-${look.id}-heading`;

  useEffect(() => {
    if (!motionEnabled) return;
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [motionEnabled]);

  return (
    <section
      ref={sectionRef}
      id={`look-${look.id}`}
      className="lookbook-look"
      aria-labelledby={headingId}
      data-motion={motionEnabled ? (revealed ? "visible" : "pending") : undefined}
    >
      <div className="lookbook-look__intro">
        <p className="lookbook-kicker">{look.kicker}</p>
        <h2 id={headingId} className="lookbook-look__heading">
          {look.heading}
        </h2>
        <p className="lookbook-copy">{look.intro}</p>
      </div>
      <ul className="lookbook-cards" aria-label={`${look.heading} look`}>
        {look.items.map((item) => (
          <LookbookCard
            key={item.productName}
            product={resolveProduct(item.productName)}
            caption={item.caption}
          />
        ))}
      </ul>
    </section>
  );
}

export function LookbookPage() {
  // Computed once per mount via useState's lazy initializer, not on every render.
  const [motionEnabled] = useState(motionIsEnabled);

  // Root element is a <section>, not another <main> — Layout.tsx (board task E1) already
  // supplies the page's single <main id="main-content"> landmark; every other page follows
  // this same "<section class='page page-x'>" convention (see CatalogPage.tsx), so this
  // page's content lives inside that one landmark rather than nesting a second.
  return (
    <section className="page page-lookbook">
      {/* Hero (D4 §2): grid-motif background applied directly per style-guide.md §3. */}
      <div className="lookbook-hero">
        <p className="lookbook-kicker"># lookbook.md</p>
        <h1 className="lookbook-hero__title">Lookbook</h1>
        <p className="lookbook-copy">
          Same twelve items, sorted by the part of the job they&apos;re for. No photoshoot
          — these are the same styled blocks as the product pages.
        </p>
      </div>

      {LOOKS.map((look) => (
        <LookSection key={look.id} look={look} motionEnabled={motionEnabled} />
      ))}

      <div className="lookbook-closing">
        <Link to="/catalog" className="button button--ghost">
          Browse the full catalog
        </Link>
      </div>
    </section>
  );
}

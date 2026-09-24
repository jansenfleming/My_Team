// Typed product-data module (board task E2), built from the Creative Director's product
// copy at docs/design/products.md (D3). This is a fixed, hand-authored data set — not a
// database, not a fetched API response — per ADR 0003's "frontend-only, static" decision.
//
// Counts and structure (see docs/design/products.md §0, verbatim constraint):
//   - `products` holds exactly the 12 main-catalog items (5 shirts, 4 sweatshirts,
//     3 hats). This is the array the catalog grid, sitemap, and any "all products" loop
//     must use.
//   - `hiddenProduct` (§3 of the source doc) is a 13th item, the Konami-code easter egg's
//     payoff (board task D5/E6, not built yet). It is a SEPARATE export, deliberately not
//     part of the `products` array, so it is excluded from every "all products" loop by
//     construction rather than filtered out at render time. Do not add it to `products`
//     and do not add a route for it here — that wiring is E6's job once D5 specifies the
//     trigger mechanics.
//
// "Special copy" blocks (care labels, hangtags) are reproduced verbatim from
// docs/design/products.md — field names, spacing, and command syntax are real technical
// formats, not decorative text, and are not paraphrased.

export type ProductCategory = "shirt" | "sweatshirt" | "hat";

export interface SpecialCopy {
  /** How the source doc describes the artifact, e.g. "Care label, styled as a config file". */
  label: string;
  /** The real-world format being imitated, for any future format-specific rendering. */
  format: "config" | "git-blame" | "access-log" | "crontab" | "ini" | "handshake";
  /** The verbatim block content — render in a monospace/code treatment, do not reword. */
  content: string;
}

export interface Product {
  /** URL-safe identifier, used for the /product/:slug route (board task E3). */
  id: string;
  name: string;
  category: ProductCategory;
  /** Mock USD display price. No real commerce is implied anywhere on the site. */
  price: number;
  tags: string[];
  description: string;
  /** Present for 8 of the 13 products across the whole site; absent means plain copy by
   * design (docs/design/products.md §1) — not a missing value. */
  specialCopy?: SpecialCopy;
}

/** The 12 main-catalog products (docs/design/products.md §2). Category split: 5 shirts,
 * 4 sweatshirts, 3 hats — matches D3 exactly. */
export const products: Product[] = [
  {
    id: "exit-code-0-tee",
    name: "Exit Code 0 Tee",
    category: "shirt",
    price: 36,
    tags: ["exit-codes", "shell", "core"],
    description: "Ran clean. No errors, no warnings, no output — which is the point.",
    specialCopy: {
      label: "Care label, styled as a config file",
      format: "config",
      content: `# care.cfg
wash: cold
dry: tumble_low
iron: false
bleach: never
exit_code: 0`,
    },
  },
  {
    id: "git-blame-tee",
    name: "git blame Tee",
    category: "shirt",
    price: 36,
    tags: ["git", "version-control"],
    description: "Every line has an author. This one's on you now.",
    specialCopy: {
      label: "Hangtag, styled as git blame's default output",
      format: "git-blame",
      content: `a3f9c21 (you  2026-01-01 09:14:02 -0500  1) sized true. no exceptions.`,
    },
  },
  {
    id: "localhost-tee",
    name: "localhost Tee",
    category: "shirt",
    price: 34,
    tags: ["networking", "unix"],
    description: "127.0.0.1. Always home, never far.",
  },
  {
    id: "403-404-tee",
    name: "403 / 404 Tee",
    category: "shirt",
    price: 36,
    tags: ["http", "status-codes"],
    description:
      "One means it exists and you can't have it. The other won't even confirm that much.",
    specialCopy: {
      label: "Hangtag, styled as an access log excerpt",
      format: "access-log",
      content: `10.0.0.4 - - [24/Sep/2026:00:00:00 +0000] "GET /this-shirt HTTP/1.1"  403 -
10.0.0.4 - - [24/Sep/2026:00:00:00 +0000] "GET /that-shirt HTTP/1.1"  404 -`,
    },
  },
  {
    id: "works-on-my-machine-tee",
    name: "Works on My Machine Tee",
    category: "shirt",
    price: 34,
    tags: ["debugging", "classics"],
    description: "A true statement. Not a warranty.",
  },
  {
    id: "cron-crewneck",
    name: "cron Crewneck",
    category: "sweatshirt",
    price: 64,
    tags: ["unix", "automation"],
    description: "Scheduled to run whether or not anyone remembers writing it.",
    specialCopy: {
      label: "Care label, styled as a crontab -l listing",
      format: "crontab",
      content: `# crontab -l
0  6  *  *  *   wash --cycle=cold
0  6  *  *  *   dry --tumble=low
*  *  *  *  *   iron --enabled=false`,
    },
  },
  {
    id: "staging-vs-prod-crewneck",
    name: "Staging vs Prod Crewneck",
    category: "sweatshirt",
    price: 68,
    tags: ["environments", "deployment"],
    description: "Same shirt. Different consequences.",
    specialCopy: {
      label: "Care label, styled as an INI-style two-environment config",
      format: "ini",
      content: `[staging]
wash = cold
dry = tumble_low
risk = low

[production]
wash = cold
dry = tumble_low
risk = someone is wearing this to a client meeting`,
    },
  },
  {
    id: "rubber-duck-hoodie",
    name: "Rubber Duck Hoodie",
    category: "sweatshirt",
    price: 72,
    tags: ["debugging", "classics"],
    description: "Explain the bug out loud. The hoodie doesn't interrupt either.",
  },
  {
    id: "technical-debt-hoodie",
    name: "Technical Debt Hoodie",
    category: "sweatshirt",
    price: 72,
    tags: ["technical-debt", "metaphor"],
    description: "Interest accrues whether or not you check the statement.",
    specialCopy: {
      label: "Hangtag, styled as a config file",
      format: "config",
      content: `# balance.cfg
principal: unpaid_refactor
interest: compounding
due: eventually`,
    },
  },
  {
    id: "sudo-cap",
    name: "sudo Cap",
    category: "hat",
    price: 30,
    tags: ["unix", "permissions"],
    description: "Elevated privileges. Everything else about you stays the same.",
  },
  {
    id: "tcp-handshake-cap",
    name: "TCP Handshake Cap",
    category: "hat",
    price: 32,
    tags: ["networking", "protocols"],
    description: "Nothing gets sent until both sides agree to talk.",
    specialCopy: {
      label: "Hangtag, styled as a TCP three-way handshake trace",
      format: "handshake",
      content: `client  -> server   SYN
server  -> client   SYN/ACK
client  -> server   ACK
connection established. true to size.`,
    },
  },
  {
    id: "off-by-one-cap",
    name: "Off-by-One Cap",
    category: "hat",
    price: 28,
    tags: ["debugging", "classics"],
    description: "Counted from zero. Still came up one short.",
  },
];

/** The hidden 13th product (docs/design/products.md §3) — Konami-code only. NOT part of
 * `products`, not routed anywhere yet, and not rendered by the catalog grid. Kept here so
 * the data (and its exact copy) exists ahead of D5's trigger spec and E6's wiring; do not
 * import this into CatalogPage or any "all products" view.
 *
 * `id` is fixed at "200-ok" per docs/design/easter-eggs.md §3 ("Fixed slug: `200-ok`.
 * Route: `/product/200-ok`."), which is the Architect-approved, load-bearing decision for
 * the whole Konami mechanism. An earlier draft of this file (board task E2, merged before
 * D5 landed) used "200-ok-tee" instead; that was a real mismatch, not an alternate valid
 * spelling — fixed here per the lead's explicit direction, not silently. */
export const hiddenProduct: Product = {
  id: "200-ok",
  name: "200 OK Tee",
  category: "shirt",
  price: 38,
  tags: ["http", "status-codes", "hidden"],
  description: "Everything you asked for, nothing you didn't.",
  specialCopy: {
    label: "Care label, styled as a config file",
    format: "config",
    content: `# status.cfg
code: 200
message: OK
wash: cold
dry: tumble_low
retry: not_needed`,
  },
};

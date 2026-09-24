// App shell: wires the hand-rolled router (src/router/Router.tsx) to the 6 route shapes
// on the board (home, catalog, product detail, lookbook, about, 404) inside the shared
// Layout. See docs/architecture/board.md task E1.
import { useEffect } from "react";
import { Layout } from "./layout/Layout";
import { AboutPage } from "./pages/AboutPage";
import { CatalogPage } from "./pages/CatalogPage";
import { HomePage } from "./pages/HomePage";
import { LookbookPage } from "./pages/LookbookPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProductPage } from "./pages/ProductPage";
import { matchRoute, type Route } from "./router/matchRoute";
import { RouterProvider, useRouter } from "./router/Router";

const PAGE_TITLES: Record<Route["name"], string> = {
  home: "ZeroJance",
  catalog: "Catalog — ZeroJance",
  product: "Product — ZeroJance",
  lookbook: "Lookbook — ZeroJance",
  about: "About — ZeroJance",
  "not-found": "Not found — ZeroJance",
};

function Pages() {
  const { pathname } = useRouter();
  const route = matchRoute(pathname);

  useEffect(() => {
    document.title = PAGE_TITLES[route.name];
  }, [route.name]);

  switch (route.name) {
    case "home":
      return <HomePage />;
    case "catalog":
      return <CatalogPage />;
    case "product":
      return <ProductPage slug={route.slug} />;
    case "lookbook":
      return <LookbookPage />;
    case "about":
      return <AboutPage />;
    case "not-found":
    default:
      return <NotFoundPage />;
  }
}

export function App() {
  return (
    <RouterProvider>
      <Layout>
        <Pages />
      </Layout>
    </RouterProvider>
  );
}

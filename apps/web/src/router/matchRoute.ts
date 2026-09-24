// Pure route-matching for the 6 route shapes on the board (E1): home, catalog, product
// detail, lookbook, about, 404. Kept as a pure function so it's trivial to unit test
// without rendering anything.
export type Route =
  | { name: "home" }
  | { name: "catalog" }
  | { name: "product"; slug: string }
  | { name: "lookbook" }
  | { name: "about" }
  | { name: "not-found" };

/** Strips a trailing slash (except for the root path itself). */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

export function matchRoute(pathname: string): Route {
  const path = normalize(pathname);

  if (path === "/") {
    return { name: "home" };
  }
  if (path === "/catalog") {
    return { name: "catalog" };
  }
  if (path === "/lookbook") {
    return { name: "lookbook" };
  }
  if (path === "/about") {
    return { name: "about" };
  }

  const productMatch = /^\/product\/([^/]+)$/.exec(path);
  if (productMatch?.[1]) {
    return { name: "product", slug: decodeURIComponent(productMatch[1]) };
  }

  return { name: "not-found" };
}

// Minimal hand-rolled client-side router (History API + a React context), rather than a
// library like react-router-dom. For ~6 static route shapes on a frontend-only mockup
// site, this keeps dependencies at zero, is trivial to unit test (see matchRoute.test.ts
// for the pure matching logic), and keeps the bundle small. If routing needs grow
// (nested layouts, real query-string handling, scroll restoration), swapping in a
// library later is a small, low-risk change — nothing here is load-bearing elsewhere.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";

interface RouterContextValue {
  pathname: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

function currentPathname(): string {
  return window.location.pathname;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(currentPathname);

  useEffect(() => {
    const onPopState = () => setPathname(currentPathname());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState(null, "", to);
    } else {
      window.history.pushState(null, "", to);
    }
    setPathname(currentPathname());
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>{children}</RouterContext.Provider>
  );
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return ctx;
}

type LinkProps = {
  to: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">;

/** An <a> that navigates client-side on a plain left-click, and falls back to a normal
 * browser navigation for modified clicks (middle-click, ctrl/cmd-click, etc.) so "open in
 * new tab" keeps working. */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  return (
    <a
      href={to}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

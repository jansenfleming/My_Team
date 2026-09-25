import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotFoundPage } from "./NotFoundPage";
import { RouterProvider } from "../router/Router";

function renderAt(path: string) {
  window.history.pushState(null, "", path);
  return render(
    <RouterProvider>
      <NotFoundPage />
    </RouterProvider>,
  );
}

// Exact copy per docs/design/easter-eggs.md §2 (board task E6).
describe("NotFoundPage (egg 2 — joke 404)", () => {
  it("renders the 404 heading, the real-pathname status line, the body copy, and both links", () => {
    renderAt("/this-does-not-exist");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
    expect(screen.getByText("GET /this-does-not-exist → 404 Not Found")).toBeInTheDocument();
    expect(screen.getByText("Not in the catalog. Try the catalog instead.")).toBeInTheDocument();

    const catalogLink = screen.getByRole("link", { name: "Back to catalog" });
    expect(catalogLink).toHaveAttribute("href", "/catalog");
    const homeLink = screen.getByRole("link", { name: "Back home" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("builds the status line from the actual pathname, not a hardcoded sample", () => {
    renderAt("/product/does-not-exist");

    expect(
      screen.getByText("GET /product/does-not-exist → 404 Not Found"),
    ).toBeInTheDocument();
  });

  it("truncates a pathname longer than 60 characters (excluding the leading slash) to 57 chars + an ellipsis", () => {
    const longSegment = "a".repeat(75);
    renderAt(`/${longSegment}`);

    const truncated = `/${longSegment.slice(0, 57)}…`;
    expect(screen.getByText(`GET ${truncated} → 404 Not Found`)).toBeInTheDocument();
    // Confirm it's genuinely shorter than the untruncated path would have produced.
    expect(screen.queryByText(`GET /${longSegment} → 404 Not Found`)).not.toBeInTheDocument();
  });

  it("does not truncate a pathname at exactly the 60-character boundary", () => {
    const boundarySegment = "b".repeat(60);
    renderAt(`/${boundarySegment}`);

    expect(
      screen.getByText(`GET /${boundarySegment} → 404 Not Found`),
    ).toBeInTheDocument();
  });

  it("renders the pathname as inert text, not injected markup", () => {
    const { container } = renderAt("/%3Cscript%3E");

    expect(container.querySelectorAll("script").length).toBe(0);
  });
});

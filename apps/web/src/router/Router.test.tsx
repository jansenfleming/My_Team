import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Link, RouterProvider, useRouter } from "./Router";

// Renders the current pathname as text so tests can assert on it without reaching into
// window.location alone (and to prove the RouterProvider's own state didn't change, not
// just that the URL happened to stay put).
function PathnameProbe() {
  const { pathname } = useRouter();
  return <p data-testid="pathname">{pathname}</p>;
}

function Harness() {
  return (
    <RouterProvider>
      <Link to="/catalog">Catalog</Link>
      <PathnameProbe />
    </RouterProvider>
  );
}

describe("Link click handling", () => {
  beforeEach(() => {
    window.history.pushState(null, "", "/");
  });

  it("navigates client-side and prevents the default browser navigation on a plain left click", () => {
    render(<Harness />);
    const link = screen.getByRole("link", { name: "Catalog" });

    // fireEvent.click returns the result of dispatchEvent: false once preventDefault()
    // was called on a cancelable event, true otherwise.
    const notCancelled = fireEvent.click(link, { button: 0 });

    expect(notCancelled).toBe(false);
    expect(screen.getByTestId("pathname")).toHaveTextContent("/catalog");
    expect(window.location.pathname).toBe("/catalog");
  });

  it("does not intercept a ctrl-click, leaving the browser's native new-tab behavior to fire", () => {
    render(<Harness />);
    const link = screen.getByRole("link", { name: "Catalog" });

    const notCancelled = fireEvent.click(link, { ctrlKey: true });

    expect(notCancelled).toBe(true);
    expect(screen.getByTestId("pathname")).toHaveTextContent("/");
    expect(window.location.pathname).toBe("/");
  });

  it("does not intercept a meta-click (cmd-click on macOS)", () => {
    render(<Harness />);
    const link = screen.getByRole("link", { name: "Catalog" });

    const notCancelled = fireEvent.click(link, { metaKey: true });

    expect(notCancelled).toBe(true);
    expect(window.location.pathname).toBe("/");
  });

  it("does not intercept a shift-click or an alt-click", () => {
    render(<Harness />);
    const link = screen.getByRole("link", { name: "Catalog" });

    expect(fireEvent.click(link, { shiftKey: true })).toBe(true);
    expect(window.location.pathname).toBe("/");

    expect(fireEvent.click(link, { altKey: true })).toBe(true);
    expect(window.location.pathname).toBe("/");
  });

  it("does not intercept a non-primary button click (e.g. a middle-click)", () => {
    render(<Harness />);
    const link = screen.getByRole("link", { name: "Catalog" });

    // button: 1 is the middle mouse button; browsers open a new tab on this natively.
    const notCancelled = fireEvent.click(link, { button: 1 });

    expect(notCancelled).toBe(true);
    expect(screen.getByTestId("pathname")).toHaveTextContent("/");
    expect(window.location.pathname).toBe("/");
  });
});

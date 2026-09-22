import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

// Placeholder smoke test for the placeholder shell. Replace once the Engineer builds the
// real catalog shell (board task E1) — this only proves the app mounts cleanly.
describe("App shell (placeholder)", () => {
  it("renders a main landmark with a level-one heading", () => {
    render(<App />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ZeroJance");
  });

  it("renders as inert text with no injected markup", () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll("script, iframe, img")).toHaveLength(0);
  });
});

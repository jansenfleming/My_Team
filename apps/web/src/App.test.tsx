import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App shell", () => {
  it("renders a main landmark with a level-one heading", () => {
    render(<App />);
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders as inert text with no injected markup", () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll("script, iframe, img")).toHaveLength(0);
  });
});

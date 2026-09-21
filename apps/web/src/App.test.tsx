import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { SITE_NAME, WELCOME_LINES } from "./content/site";

describe("App shell", () => {
  it("renders a main landmark with the site name as the level-one heading", () => {
    render(<App />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(SITE_NAME);
  });

  it("renders as inert text with no injected markup", () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll("script, iframe, img")).toHaveLength(0);
  });

  it("shows the welcome lines from content in the terminal log", () => {
    render(<App />);
    const log = screen.getByRole("log");
    for (const line of WELCOME_LINES) expect(log).toHaveTextContent(line);
  });

  it("runs the placeholder help command and reports unknown commands", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("textbox", { name: "Command input" }), "help{Enter}");
    expect(screen.getByRole("log")).toHaveTextContent(/clear\s+Clear the screen/);
    await user.type(screen.getByRole("textbox", { name: "Command input" }), "nope{Enter}");
    expect(screen.getByRole("log")).toHaveTextContent("Unknown command: nope");
  });
});

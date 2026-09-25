import { describe, expect, it, vi } from "vitest";
import { logDevConsoleMessage } from "./devConsole";

// Exact strings and call order per docs/design/easter-eggs.md §1b (board task E6).
describe("logDevConsoleMessage (egg 1b — dev console)", () => {
  it("logs exactly 3 messages, in order, with the exact specified content", () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logDevConsoleMessage();

    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      1,
      "%cZeroJance",
      "font-weight:700;font-size:16px;font-family:monospace;letter-spacing:0.02em;",
    );
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      2,
      "console.log is still the most common debugger. No shame in it.",
    );
    expect(consoleLogSpy).toHaveBeenNthCalledWith(3, "Not everything here is in the catalog.");

    consoleLogSpy.mockRestore();
  });
});

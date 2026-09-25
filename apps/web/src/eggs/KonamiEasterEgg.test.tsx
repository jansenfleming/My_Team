import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { KonamiEasterEgg } from "./KonamiEasterEgg";
import { KONAMI_SEQUENCE, KONAMI_STORAGE_KEY, resetKonamiMemoryFlagForTests } from "./konami";
import { RouterProvider } from "../router/Router";

function renderEgg() {
  return render(
    <RouterProvider>
      <KonamiEasterEgg />
    </RouterProvider>,
  );
}

/** Dispatches the given keys as `keydown` events on `window`, the same target the real
 * listener is attached to (docs/design/easter-eggs.md §3's "global, every page"). */
function pressKeys(keys: readonly string[]) {
  for (const key of keys) {
    fireEvent.keyDown(window, { key });
  }
}

afterEach(() => {
  resetKonamiMemoryFlagForTests();
});

describe("KonamiEasterEgg (board task E6, docs/design/easter-eggs.md §3)", () => {
  it("does not show the banner before the full sequence is entered", () => {
    renderEgg();
    pressKeys(KONAMI_SEQUENCE.slice(0, -1));

    expect(screen.queryByText("Item unlocked.")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(KONAMI_STORAGE_KEY)).not.toBe("1");
  });

  it("does not unlock on a wrong sequence", () => {
    renderEgg();
    pressKeys(["ArrowDown", "ArrowUp", "b", "a"]);

    expect(screen.queryByText("Item unlocked.")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(KONAMI_STORAGE_KEY)).not.toBe("1");
  });

  it("sets the unlock flag and shows the flat, exact-copy confirmation banner on the full sequence", () => {
    renderEgg();
    pressKeys(KONAMI_SEQUENCE);

    expect(window.localStorage.getItem(KONAMI_STORAGE_KEY)).toBe("1");
    expect(screen.getByText("Item unlocked.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "View 200 OK Tee" });
    expect(link).toHaveAttribute("href", "/product/200-ok");
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("recovers from a fumbled attempt without an extra keystroke (the retry fix)", () => {
    renderEgg();
    // ArrowUp, ArrowUp, ArrowUp (fumble — 3rd is wrong but restarts progress at 1), then
    // the rest of the sequence from the 2nd key onward.
    pressKeys(["ArrowUp", "ArrowUp", "ArrowUp", ...KONAMI_SEQUENCE.slice(1)]);

    expect(screen.getByText("Item unlocked.")).toBeInTheDocument();
  });

  it("ignores the sequence entirely while focus is in an editable element", () => {
    render(
      <RouterProvider>
        <input aria-label="future text field" />
        <KonamiEasterEgg />
      </RouterProvider>,
    );
    screen.getByLabelText("future text field").focus();

    pressKeys(KONAMI_SEQUENCE);

    expect(screen.queryByText("Item unlocked.")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(KONAMI_STORAGE_KEY)).not.toBe("1");
  });

  it("never calls preventDefault on any key in the sequence", () => {
    renderEgg();
    // fireEvent.keyDown returns the DOM dispatchEvent result: false only if some handler
    // called preventDefault() on a cancelable event — must be true for every key here.
    for (const key of KONAMI_SEQUENCE) {
      expect(fireEvent.keyDown(window, { key })).toBe(true);
    }
  });

  it("dismisses the banner via the × button", async () => {
    renderEgg();
    pressKeys(KONAMI_SEQUENCE);
    const user = userEvent.setup();

    expect(screen.getByText("Item unlocked.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Item unlocked.")).not.toBeInTheDocument();
  });

  it("re-entering the sequence after unlock simply re-shows the banner (no special-casing)", () => {
    renderEgg();
    pressKeys(KONAMI_SEQUENCE);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Item unlocked.")).not.toBeInTheDocument();

    pressKeys(KONAMI_SEQUENCE);

    expect(screen.getByText("Item unlocked.")).toBeInTheDocument();
  });
});

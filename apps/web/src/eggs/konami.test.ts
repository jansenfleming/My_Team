import { afterEach, describe, expect, it, vi } from "vitest";
import {
  KONAMI_SEQUENCE,
  KONAMI_STORAGE_KEY,
  isEditableTarget,
  isKonamiUnlocked,
  nextKonamiProgress,
  resetKonamiMemoryFlagForTests,
  setKonamiUnlocked,
} from "./konami";

afterEach(() => {
  resetKonamiMemoryFlagForTests();
});

describe("nextKonamiProgress (pure sequence matcher, board task E6)", () => {
  it("advances progress by 1 for each correct key in order", () => {
    let progress = 0;
    for (const key of KONAMI_SEQUENCE) {
      progress = nextKonamiProgress(progress, key);
    }
    expect(progress).toBe(KONAMI_SEQUENCE.length);
  });

  it("matches the two letter keys case-insensitively (arrow keys are always exact from the browser)", () => {
    let progress = 0;
    // Only "b"/"a" are compared case-insensitively per docs/design/easter-eggs.md §3 —
    // real ArrowUp/Down/Left/Right event.key values are always this exact casing, so only
    // the two trailing letter keys are upper-cased here.
    const shiftedSequence = KONAMI_SEQUENCE.map((key) =>
      key.startsWith("Arrow") ? key : key.toUpperCase(),
    );
    for (const key of shiftedSequence) {
      progress = nextKonamiProgress(progress, key);
    }
    expect(progress).toBe(KONAMI_SEQUENCE.length);
  });

  it("resets progress to 0 on a wrong key that doesn't match the first key either", () => {
    let progress = nextKonamiProgress(0, "ArrowUp"); // progress 1
    progress = nextKonamiProgress(progress, "ArrowUp"); // progress 2
    progress = nextKonamiProgress(progress, "x"); // wrong key, not SEQUENCE[0]

    expect(progress).toBe(0);
  });

  it("restarts at progress 1 (the fumbled-retry fix) when the wrong key equals SEQUENCE[0]", () => {
    // ArrowUp, ArrowUp, ArrowUp: the 3rd ArrowUp is wrong at position 2 (expects
    // ArrowDown), but ArrowUp is also SEQUENCE[0] — should restart at 1, not 0, so the
    // visitor doesn't need an extra keystroke to recover.
    let progress = nextKonamiProgress(0, "ArrowUp"); // progress 1
    progress = nextKonamiProgress(progress, "ArrowUp"); // progress 2
    progress = nextKonamiProgress(progress, "ArrowUp"); // fumble

    expect(progress).toBe(1);
  });

  it("lets a fumbled-retry restart still complete the sequence from that point", () => {
    let progress = nextKonamiProgress(0, "ArrowUp");
    progress = nextKonamiProgress(progress, "ArrowUp");
    progress = nextKonamiProgress(progress, "ArrowUp"); // fumble, restarts at 1
    // Continue the sequence from index 1 onward (skip the first ArrowUp, already "used").
    for (const key of KONAMI_SEQUENCE.slice(1)) {
      progress = nextKonamiProgress(progress, key);
    }

    expect(progress).toBe(KONAMI_SEQUENCE.length);
  });

  it("does not complete on an incomplete sequence", () => {
    let progress = 0;
    for (const key of KONAMI_SEQUENCE.slice(0, -1)) {
      progress = nextKonamiProgress(progress, key);
    }
    expect(progress).toBe(KONAMI_SEQUENCE.length - 1);
  });
});

describe("isEditableTarget (board task E6)", () => {
  it("is true for input, textarea, and select elements", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
    expect(isEditableTarget(document.createElement("select"))).toBe(true);
  });

  it("is true for a contenteditable element", () => {
    const div = document.createElement("div");
    Object.defineProperty(div, "isContentEditable", { value: true });
    expect(isEditableTarget(div)).toBe(true);
  });

  it("is false for a plain element or null", () => {
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(document.createElement("body"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("Konami unlock flag persistence (board task E6)", () => {
  it("is unset before setKonamiUnlocked is called", () => {
    expect(isKonamiUnlocked()).toBe(false);
  });

  it("sets the exact localStorage key/value D5 fixes, and isKonamiUnlocked reads it fresh", () => {
    setKonamiUnlocked();

    expect(window.localStorage.getItem(KONAMI_STORAGE_KEY)).toBe("1");
    expect(isKonamiUnlocked()).toBe(true);
  });

  it("falls back to an in-memory flag, without crashing, when localStorage throws", () => {
    const setItemSpy = vi
      .spyOn(window.localStorage.__proto__, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    const getItemSpy = vi
      .spyOn(window.localStorage.__proto__, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });

    expect(() => setKonamiUnlocked()).not.toThrow();
    expect(isKonamiUnlocked()).toBe(true);

    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });
});

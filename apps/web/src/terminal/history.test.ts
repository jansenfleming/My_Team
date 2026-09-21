import { describe, expect, it } from "vitest";
import { CommandHistory } from "./history";

describe("CommandHistory", () => {
  it("returns nothing when empty", () => {
    const h = new CommandHistory();
    expect(h.prev("draft")).toBeUndefined();
    expect(h.next()).toBeUndefined();
  });

  it("walks back through entries newest first and stops at the oldest", () => {
    const h = new CommandHistory();
    ["one", "two", "three"].forEach((l) => h.add(l));
    expect(h.prev("")).toBe("three");
    expect(h.prev("")).toBe("two");
    expect(h.prev("")).toBe("one");
    expect(h.prev("")).toBe("one");
  });

  it("walks forward again and restores the draft that was being typed", () => {
    const h = new CommandHistory();
    ["one", "two"].forEach((l) => h.add(l));
    expect(h.prev("half-typed")).toBe("two");
    expect(h.prev("ignored")).toBe("one");
    expect(h.next()).toBe("two");
    expect(h.next()).toBe("half-typed");
    expect(h.next()).toBeUndefined();
  });

  it("skips blank lines and an immediate repeat, but keeps non-adjacent repeats", () => {
    const h = new CommandHistory();
    ["a", "  ", "", "a", "b", "a"].forEach((l) => h.add(l));
    expect(h.entries()).toEqual(["a", "b", "a"]);
  });

  it("trims entries", () => {
    const h = new CommandHistory();
    h.add("  status  ");
    expect(h.entries()).toEqual(["status"]);
  });

  it("caps the number of entries, dropping the oldest", () => {
    const h = new CommandHistory(3);
    ["1", "2", "3", "4", "5"].forEach((l) => h.add(l));
    expect(h.entries()).toEqual(["3", "4", "5"]);
    expect(h.size).toBe(3);
  });

  it("returns to the fresh-input position after add or reset", () => {
    const h = new CommandHistory();
    h.add("a");
    h.add("b");
    h.prev("");
    h.add("c");
    expect(h.prev("x")).toBe("c");
    h.reset();
    expect(h.next()).toBeUndefined();
  });

  it("returns a copy from entries()", () => {
    const h = new CommandHistory();
    h.add("a");
    (h.entries() as string[]).push("tamper");
    expect(h.entries()).toEqual(["a"]);
  });
});

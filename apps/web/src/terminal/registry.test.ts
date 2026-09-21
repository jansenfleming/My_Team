import { describe, expect, it } from "vitest";
import { createRegistry } from "./registry";
import type { CommandDefinition } from "./types";

const def = (name: string, aliases: string[] = []): CommandDefinition => ({
  name,
  aliases,
  usage: name,
  summary: `${name} summary`,
  run: () => undefined,
});

describe("createRegistry", () => {
  it("resolves commands by name and by alias, case-insensitively", () => {
    const status = def("status", ["st", "stat"]);
    const registry = createRegistry([status, def("help")]);
    expect(registry.resolve("status")).toBe(status);
    expect(registry.resolve("ST")).toBe(status);
    expect(registry.resolve("Stat")).toBe(status);
    expect(registry.resolve("nope")).toBeUndefined();
  });

  it("lists public info in registration order, without the run function", () => {
    const registry = createRegistry([def("b", ["bee"]), def("a")]);
    expect(registry.list()).toEqual([
      { name: "b", aliases: ["bee"], usage: "b", summary: "b summary" },
      { name: "a", aliases: [], usage: "a", summary: "a summary" },
    ]);
    expect(registry.list()[0]).not.toHaveProperty("run");
  });

  it("throws on a duplicate name or alias, including an alias that collides with a name", () => {
    expect(() => createRegistry([def("a"), def("a")])).toThrow(/Duplicate/);
    expect(() => createRegistry([def("a", ["x"]), def("b", ["x"])])).toThrow(/Duplicate/);
    expect(() => createRegistry([def("a"), def("b", ["a"])])).toThrow(/Duplicate/);
  });

  it("throws on invalid names", () => {
    for (const bad of ["", "Has Space", "9start", "_x", "a;b", "a/b", "ünï"]) {
      expect(() => createRegistry([def(bad)])).toThrow(/Invalid command name/);
    }
  });

  it("never resolves names inherited from Object.prototype", () => {
    const registry = createRegistry([def("help")]);
    for (const name of ["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf", "prototype"]) {
      expect(registry.resolve(name)).toBeUndefined();
    }
  });
});

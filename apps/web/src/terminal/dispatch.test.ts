import { describe, expect, it, vi } from "vitest";
import { dispatch } from "./dispatch";
import { createRegistry } from "./registry";
import type { CommandContext, CommandDefinition, TerminalText } from "./types";

const text: TerminalText = {
  unknownCommand: (name) => `unknown:${name}`,
  inputTooLong: (max) => `too-long:${max}`,
  unterminatedQuote: "unterminated",
  trailingEscape: "trailing",
  commandFailed: "failed",
  interrupted: "interrupted",
  regionLabel: "r",
  logLabel: "l",
  inputLabel: "i",
};

function makeCtx(signal: AbortSignal = new AbortController().signal): CommandContext {
  return { clear: vi.fn(), readSecret: vi.fn(async () => null), signal, commands: [] };
}

const command = (name: string, run: CommandDefinition["run"], aliases: string[] = []): CommandDefinition => ({
  name,
  aliases,
  usage: name,
  summary: "",
  run,
});

const run = (raw: string, defs: CommandDefinition[], ctx = makeCtx(), maxInputLength = 1024) =>
  dispatch(raw, ctx, { registry: createRegistry(defs), text, maxInputLength });

describe("dispatch", () => {
  it("runs the command with its arguments and returns its lines", async () => {
    const echo = vi.fn((_ctx: CommandContext, args: readonly string[]) => [{ kind: "output" as const, text: args.join("|") }]);
    const lines = await run('echo one "two three"', [command("echo", echo)]);
    expect(lines).toEqual([{ kind: "output", text: "one|two three" }]);
    expect(echo.mock.calls[0]?.[1]).toEqual(["one", "two three"]);
  });

  it("matches names case-insensitively and by alias", async () => {
    const def = command("status", () => [{ kind: "output", text: "ok" }], ["st"]);
    expect(await run("STATUS", [def])).toEqual([{ kind: "output", text: "ok" }]);
    expect(await run("st", [def])).toEqual([{ kind: "output", text: "ok" }]);
  });

  it("awaits async commands", async () => {
    const def = command("slow", async () => {
      await new Promise((r) => setTimeout(r, 5));
      return [{ kind: "system", text: "done" }];
    });
    expect(await run("slow", [def])).toEqual([{ kind: "system", text: "done" }]);
  });

  it("returns no lines for empty input and for a command that returns nothing", async () => {
    expect(await run("", [])).toEqual([]);
    expect(await run("   ", [])).toEqual([]);
    expect(await run("noop", [command("noop", () => undefined)])).toEqual([]);
  });

  it("reports an unknown command through the provided message", async () => {
    expect(await run("frobnicate now", [command("help", () => undefined)])).toEqual([{ kind: "error", text: "unknown:frobnicate" }]);
  });

  it("does not resolve prototype property names", async () => {
    for (const name of ["constructor", "__proto__", "toString"]) {
      expect(await run(name, [])).toEqual([{ kind: "error", text: `unknown:${name}` }]);
    }
  });

  it("treats markup typed as a command as an unknown command, verbatim and as plain data", async () => {
    const payload = "<img";
    const lines = await run(`${payload} src=x onerror=alert(1)>`, []);
    expect(lines).toEqual([{ kind: "error", text: "unknown:<img" }]);
  });

  it("truncates a very long unknown command name in the message", async () => {
    const lines = await run("x".repeat(500), [], makeCtx(), 1024);
    expect(lines[0]?.text).toBe(`unknown:${"x".repeat(32)}`);
  });

  it("maps each parse failure to its message", async () => {
    expect(await run('say "oops', [])).toEqual([{ kind: "error", text: "unterminated" }]);
    expect(await run("say oops\\", [])).toEqual([{ kind: "error", text: "trailing" }]);
    expect(await run("a".repeat(11), [], makeCtx(), 10)).toEqual([{ kind: "error", text: "too-long:10" }]);
  });

  it("does not run any command when the line is too long", async () => {
    const spy = vi.fn();
    await run(`spy ${"a".repeat(10_240)}`, [command("spy", spy)]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("turns a thrown error into a generic message that leaks nothing", async () => {
    const boom = command("boom", () => {
      throw new Error("secret-token-123 at /Users/x/file.ts");
    });
    const rejected = command("nope", () => Promise.reject(new Error("db password hunter2")));
    for (const raw of ["boom", "nope"]) {
      const lines = await run(raw, [boom, rejected]);
      expect(lines).toEqual([{ kind: "error", text: "failed" }]);
    }
  });

  it("drops malformed lines and coerces nothing else", async () => {
    const bad = command("bad", () => [
      { kind: "output", text: "keep" },
      { kind: "input", text: "spoofed prompt" },
      { kind: "output", text: 42 },
      null,
      "just a string",
      { kind: "error", text: "also keep" },
    ] as never);
    expect(await run("bad", [bad])).toEqual([
      { kind: "output", text: "keep" },
      { kind: "error", text: "also keep" },
    ]);
  });

  it("reports an interrupt when the signal aborts while a command is running", async () => {
    const controller = new AbortController();
    const hang = command("hang", () => new Promise(() => undefined));
    const pending = run("hang", [hang], makeCtx(controller.signal));
    controller.abort();
    expect(await pending).toEqual([{ kind: "error", text: "interrupted" }]);
  });

  it("reports an interrupt without running when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const spy = vi.fn();
    expect(await run("spy", [command("spy", spy)], makeCtx(controller.signal))).toEqual([{ kind: "error", text: "interrupted" }]);
    expect(spy).not.toHaveBeenCalled();
  });
});

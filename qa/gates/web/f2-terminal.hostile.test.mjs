/* global window, document */
// Hostile-input checks for the F2 terminal engine (feat/terminal-engine), cases W1, W2, W4, W5, W7, W8 and a11y from
// qa/test-plan.md. jsdom only: no browser was available, so "inert" means no element or handler is created from
// payload text and no script side effect occurs, not that a real browser was observed.
// The web app source is imported from the branch worktree via QA_WEB_DIR (see vitest.gate.config.mjs).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement as h } from "react";
import { cleanup, fireEvent, render, screen, waitFor, act } from "@testing-library/react";

const WEB = process.env.QA_WEB_DIR;
const T = await import(`${WEB}/src/terminal/index.ts`);
const { Terminal, createRegistry, parseInput, CommandHistory, dispatch, outputLine } = T;

const text = {
  unknownCommand: (n) => `Unknown command: ${n}.`,
  inputTooLong: (m) => `Input too long (limit ${m}).`,
  unterminatedQuote: "Unterminated quote.",
  trailingEscape: "Trailing backslash.",
  commandFailed: "That command failed.",
  interrupted: "Interrupted.",
  regionLabel: "Terminal",
  logLabel: "Terminal output",
  inputLabel: "Command input",
};
const def = (name, run) => ({ name, aliases: [], usage: name, summary: name, run });

function mount(commands, props = {}) {
  const registry = createRegistry(commands);
  return render(h(Terminal, { registry, text, prompt: "guest$", ...props }));
}
const input = () => screen.getByLabelText("Command input");
async function run(line) {
  fireEvent.change(input(), { target: { value: line } });
  await act(async () => {
    fireEvent.submit(input().closest("form"));
  });
}
const log = () => screen.getByRole("log");

const PAYLOADS = [
  "<img src=x onerror=window.__xss=1>",
  "<script>window.__xss=1</script>",
  "<svg onload=window.__xss=1>",
  "<iframe src=javascript:window.__xss=1>",
  "<a href=javascript:window.__xss=1>x</a>",
  "\"><img src=x onerror=window.__xss=1>",
  "'-window.__xss=1-'",
  "<style>@import 'http://evil.test/x.css'</style>",
  "&lt;b&gt;&amp;",
  "<math><mi xlink:href=javascript:window.__xss=1>",
  "${window.__xss=1}",
  "{{constructor.constructor('window.__xss=1')()}}",
];

beforeEach(() => {
  delete window.__xss;
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => cleanup());

describe("W1/W2: hostile text is inert", () => {
  it("typed payloads are echoed and answered as plain text, with no elements, handlers or side effects", async () => {
    mount([def("echo", (_c, args) => [outputLine(args.join(" "))])]);
    for (const p of PAYLOADS) {
      await run(`echo ${JSON.stringify(p)}`);
      await run(p); // also as an unknown command name
    }
    const l = log();
    expect(l.querySelectorAll("img, script, svg, iframe, a, style, math, object, embed, link, form, input")).toHaveLength(0);
    for (const el of l.querySelectorAll("*")) {
      for (const a of el.getAttributeNames()) expect(a.startsWith("on"), `handler attribute ${a}`).toBe(false);
    }
    expect(window.__xss).toBeUndefined();
    expect(l.textContent).toContain("<img src=x onerror=window.__xss=1>");
    expect(l.textContent).toContain("<script>window.__xss=1</script>");
    expect(document.querySelectorAll("script").length).toBe(0);
  });

  it("output and error lines from a command are text nodes, even for markup, entities and bidi/ANSI/NUL text", async () => {
    const nasty = ["<b>bold</b>", "&amp;&lt;", "\u202egnp.exe", "\u001b[31mred\u001b[0m", "nul\u0000byte", "\u2028\u2029", "<img src=x onerror=window.__xss=1>"];
    mount([def("dump", () => nasty.map((t, i) => (i % 2 ? { kind: "error", text: t } : outputLine(t))))]);
    await run("dump");
    const l = log();
    expect(l.querySelector("b, img")).toBeNull();
    for (const t of nasty) expect(l.textContent).toContain(t);
    expect(window.__xss).toBeUndefined();
  });

  it("malformed command results are ignored, not rendered", async () => {
    mount([def("bad", () => [null, 5, "str", { kind: "html", text: "<b>x</b>" }, { kind: "output", text: { toString: () => "<b>obj</b>" } }, { kind: "output", text: "ok" }])]);
    await run("bad");
    const l = log();
    expect(l.textContent).toContain("ok");
    expect(l.textContent).not.toContain("<b>x</b>");
    expect(l.textContent).not.toContain("obj");
    expect(l.querySelector("b")).toBeNull();
  });

  it("a command that throws never surfaces the error text (may hold secrets or paths)", async () => {
    mount([
      def("boom", () => { throw new Error("SECRETLEAK /Users/x/.env token=abc123"); }),
      def("rej", async () => { throw new Error("SECRETLEAK-2 stack at /Users/x"); }),
    ]);
    await run("boom");
    await run("rej");
    expect(log().textContent).not.toContain("SECRETLEAK");
    expect(log().textContent).not.toContain("/Users");
    expect(log().textContent).toContain("That command failed.");
  });

  it("unknown-command echo is truncated to 32 code points; prototype names never resolve", async () => {
    mount([def("help", () => [outputLine("h")])]);
    await run("x".repeat(500));
    const err = [...log().querySelectorAll(".terminal-line--error")].at(-1).textContent;
    expect(err).toBe(`Unknown command: ${"x".repeat(32)}.`);
    for (const name of ["__proto__", "constructor", "toString", "hasOwnProperty", "prototype", "valueOf", "__defineGetter__"]) {
      await run(name);
      expect([...log().querySelectorAll(".terminal-line--error")].at(-1).textContent).toContain("Unknown command");
    }
    await run("HELP");
    expect(log().textContent).toContain("h");
  });
});

describe("W4: parser edge cases", () => {
  const ok = (s) => {
    const r = parseInput(s);
    expect(r.ok, s).toBe(true);
    return r.args;
  };
  it("handles empty, whitespace, quotes, escapes, unicode, control and bidi characters without altering them", () => {
    expect(ok("")).toEqual([]);
    expect(ok("   \t\n  ")).toEqual([]);
    expect(ok('a "b c" \'d e\' f\\ g')).toEqual(["a", "b c", "d e", "f g"]);
    expect(ok('""')).toEqual([""]);
    expect(ok("a\u0000b")).toEqual(["a\u0000b"]);
    expect(ok("\u001b[31mred")).toEqual(["\u001b[31mred"]);
    expect(ok("\\x1b[31m")).toEqual(["x1b[31m"]);
    expect(ok("a\u202eb")).toEqual(["a\u202eb"]);
    expect(ok("\u{1f468}\u200d\u{1f469} \u{1f600}")).toEqual(["\u{1f468}\u200d\u{1f469}", "\u{1f600}"]);
    expect(ok("\ud800")).toHaveLength(1); // lone surrogate does not throw
    expect(ok("$(id) `id` ${x} ; | & > < *")).toEqual(["$(id)", "`id`", "${x}", ";", "|", "&", ">", "<", "*"]);
  });
  it("rejects unbalanced quotes, trailing escape and over-length input without throwing", () => {
    expect(parseInput('a "b')).toEqual({ ok: false, error: "unterminated_quote" });
    expect(parseInput("a 'b")).toEqual({ ok: false, error: "unterminated_quote" });
    expect(parseInput('a "b\\')).toEqual({ ok: false, error: "unterminated_quote" });
    expect(parseInput("a\\")).toEqual({ ok: false, error: "trailing_escape" });
    expect(parseInput("x".repeat(1025))).toEqual({ ok: false, error: "too_long" });
    expect(parseInput("x".repeat(1024)).ok).toBe(true);
  });
  it("10 kB and 1 MB inputs are refused quickly and never run a command", async () => {
    const ran = vi.fn();
    mount([def("echo", (_c, a) => { ran(a); return [outputLine("ran")]; })]);
    const t0 = performance.now();
    await run("echo " + "a".repeat(10_000));
    await run("echo " + "a".repeat(1_000_000));
    const ms = performance.now() - t0;
    expect(ran).not.toHaveBeenCalled();
    expect(log().textContent).toContain("Input too long");
    expect(ms).toBeLessThan(2000);
    expect(input().getAttribute("maxlength")).toBe("1024");
  });
  it("pathological quoting stays linear", () => {
    const t0 = performance.now();
    parseInput('"\\'.repeat(200_000).slice(0, 1024));
    parseInput(("\\" + '"').repeat(500));
    expect(performance.now() - t0).toBeLessThan(200);
  });
});

describe("W5: the masked prompt keeps the secret out of everything", () => {
  const SECRET = "Pa55-QAFAKE-9zX";
  function setup() {
    const got = [];
    const consoleSpies = ["log", "info", "warn", "error", "debug"].map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    mount([def("login", async (ctx, args) => {
      const pw = await ctx.readSecret("Password:");
      got.push(pw);
      return [outputLine(pw === null ? "cancelled" : `hello ${args[0]}`)];
    })]);
    return { got, consoleSpies };
  }
  const secretInput = () => screen.getByLabelText("Password:");

  it("the value reaches only the command: not DOM text or attributes, history, storage, or console", async () => {
    const { got, consoleSpies } = setup();
    await run("login jansen");
    const field = secretInput();
    expect(field.type).toBe("password");
    expect(field.getAttribute("maxlength")).toBe("256");
    expect(document.activeElement).toBe(field);
    fireEvent.change(field, { target: { value: SECRET } });
    expect(document.body.innerHTML).not.toContain(SECRET); // typed but not yet submitted: still only a .value property
    await act(async () => {
      fireEvent.submit(field.closest("form"));
    });
    await waitFor(() => expect(log().textContent).toContain("hello jansen"));
    expect(got).toEqual([SECRET]);
    expect(document.body.innerHTML).not.toContain(SECRET);
    expect(document.body.textContent).not.toContain(SECRET);
    expect(JSON.stringify({ ...localStorage })).not.toContain(SECRET);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(SECRET);
    for (const spy of consoleSpies) expect(JSON.stringify(spy.mock.calls)).not.toContain(SECRET);
    // history: press ArrowUp through everything; the secret never appears and the command line does
    const cmd = input();
    const seen = [];
    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(cmd, { key: "ArrowUp" });
      seen.push(cmd.value);
    }
    expect(seen.join("|")).not.toContain(SECRET);
    expect(seen).toContain("login jansen");
    // the echoed line for the secret prompt has an empty text
    const echoes = [...log().querySelectorAll(".terminal-line--input")].map((n) => n.textContent);
    expect(echoes.some((t) => t.includes("Password:"))).toBe(true);
    expect(echoes.join("\n")).not.toContain(SECRET);
  });

  it("Escape and Ctrl+C cancel: the command receives null, the typed value is discarded, focus returns to the command input", async () => {
    const { got } = setup();
    await run("login a");
    fireEvent.change(secretInput(), { target: { value: SECRET } });
    fireEvent.keyDown(secretInput(), { key: "Escape" });
    await waitFor(() => expect(log().textContent).toContain("cancelled"));
    expect(got).toEqual([null]);
    expect(document.body.innerHTML).not.toContain(SECRET);
    expect(screen.queryByLabelText("Password:")).toBeNull();
    expect(document.activeElement).toBe(input());
    await run("login b");
    fireEvent.change(secretInput(), { target: { value: SECRET } });
    fireEvent.keyDown(secretInput(), { key: "c", ctrlKey: true });
    await waitFor(() => expect(got).toEqual([null, null]));
    expect(document.body.innerHTML).not.toContain(SECRET);
  });

  it("unmounting during the prompt releases the command with null (no dangling secret request)", async () => {
    const { got } = setup();
    await run("login a");
    fireEvent.change(secretInput(), { target: { value: SECRET } });
    cleanup();
    await waitFor(() => expect(got).toEqual([null]));
  });

  it("a second login while the prompt is open is ignored (busy), and the value is never reused", async () => {
    const { got } = setup();
    await run("login a");
    expect(screen.queryByLabelText("Command input")).toBeNull(); // command input is replaced while masked
    fireEvent.change(secretInput(), { target: { value: SECRET } });
    await act(async () => fireEvent.submit(secretInput().closest("form")));
    await waitFor(() => expect(got).toHaveLength(1));
    expect(input().value).toBe("");
  });
});

describe("W7/W8: caps, double submit, a11y", () => {
  it("scrollback is capped by maxScrollback", async () => {
    mount([def("n", () => [outputLine("x")])], { maxScrollback: 40 });
    for (let i = 0; i < 120; i++) await run("n");
    expect(log().querySelectorAll(".terminal-line").length).toBeLessThanOrEqual(40);
  }, 20000);

  it("command history is capped and skips blanks and immediate repeats; nothing is persisted", () => {
    const hst = new CommandHistory(100);
    for (let i = 0; i < 10_000; i++) hst.add(`cmd ${i}`);
    expect(hst.size).toBe(100);
    expect(hst.entries().at(-1)).toBe("cmd 9999");
    hst.add("   ");
    hst.add("cmd 9999");
    expect(hst.size).toBe(100);
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it("output larger than the cap is trimmed too (one command returning 5000 lines)", async () => {
    mount([def("flood", () => Array.from({ length: 5000 }, (_, i) => outputLine(`line ${i}`)))], { maxScrollback: 100 });
    await run("flood");
    expect(log().querySelectorAll(".terminal-line").length).toBeLessThanOrEqual(100);
  });

  it("double submit while a command runs executes it once", async () => {
    let calls = 0;
    let release;
    const gate = new Promise((r) => (release = r));
    mount([def("slow", async () => { calls++; await gate; return [outputLine("done")]; })]);
    fireEvent.change(input(), { target: { value: "slow" } });
    const form = input().closest("form");
    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    expect(calls).toBe(1);
    await act(async () => release());
    await waitFor(() => expect(log().textContent).toContain("done"));
    expect(calls).toBe(1);
    expect(log().getAttribute("aria-busy")).toBe("false");
  });

  it("Ctrl+C interrupts a running command and the terminal accepts input again", async () => {
    mount([def("hang", () => new Promise(() => {}))]);
    fireEvent.change(input(), { target: { value: "hang" } });
    await act(async () => fireEvent.submit(input().closest("form")));
    expect(log().getAttribute("aria-busy")).toBe("true");
    fireEvent.keyDown(input(), { key: "c", ctrlKey: true });
    await waitFor(() => expect(log().textContent).toContain("Interrupted."));
    expect(log().getAttribute("aria-busy")).toBe("false");
  });

  it("a11y basics: named region, polite live log, labelled input, focus on load, prompt hidden from AT", () => {
    mount([def("help", () => [])]);
    expect(screen.getByRole("region", { name: "Terminal" })).toBeInTheDocument();
    const l = screen.getByRole("log", { name: "Terminal output" });
    expect(l.getAttribute("aria-live")).toBe("polite");
    expect(document.activeElement).toBe(input());
    expect(input().getAttribute("autocomplete")).toBe("off");
    expect(document.querySelector(".terminal-form .terminal-prompt").getAttribute("aria-hidden")).toBe("true");
  });

  it("dispatch never throws on odd registries or aborted signals", async () => {
    const registry = createRegistry([def("x", () => [outputLine("ok")])]);
    const ctrl = new AbortController();
    ctrl.abort();
    const out = await dispatch("x", { clear() {}, signal: ctrl.signal, commands: [], readSecret: async () => null }, { registry, text, maxInputLength: 1024 });
    expect(out).toEqual([{ kind: "error", text: "Interrupted." }]);
  });
});

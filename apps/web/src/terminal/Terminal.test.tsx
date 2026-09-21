import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Terminal } from "./Terminal";
import { createRegistry } from "./registry";
import { errorLine, outputLine } from "./types";
import type { CommandDefinition, TerminalText } from "./types";

const text: TerminalText = {
  unknownCommand: (name) => `unknown command: ${name}`,
  inputTooLong: (max) => `input too long (${max})`,
  unterminatedQuote: "unterminated quote",
  trailingEscape: "trailing backslash",
  commandFailed: "command failed",
  interrupted: "interrupted",
  regionLabel: "Terminal",
  logLabel: "Terminal output",
  inputLabel: "Command input",
};

const cmd = (name: string, run: CommandDefinition["run"]): CommandDefinition => ({ name, aliases: [], usage: name, summary: "", run });

const SECRET = "hunter2-correct-horse";

interface Captured {
  secret: string | null | undefined;
}
function setup(extra: CommandDefinition[] = [], props: Partial<Parameters<typeof Terminal>[0]> = {}) {
  const captured: Captured = { secret: undefined };
  const registry = createRegistry([
    cmd("say", (_ctx, args) => [outputLine(args.join(" "))]),
    cmd("hostile", () => [outputLine("<img src=x onerror=alert(1)>"), errorLine("<script>alert(2)</script>")]),
    cmd("login", async (ctx, args) => {
      const secret = await ctx.readSecret("password:");
      captured.secret = secret;
      return [outputLine(secret === null ? `cancelled ${args.join(" ")}` : `logged in ${args.join(" ")}`)];
    }),
    cmd("clear", (ctx) => {
      ctx.clear();
    }),
    cmd("hang", (ctx) => new Promise(() => void ctx.signal)),
    ...extra,
  ]);
  const user = userEvent.setup();
  const utils = render(<Terminal registry={registry} text={text} prompt="$" {...props} />);
  // A password input has no ARIA role, so query the element directly.
  const input = () => {
    const el = document.querySelector<HTMLInputElement>("input.terminal-input");
    if (!el) throw new Error("terminal input not found");
    return el;
  };
  const log = () => screen.getByRole("log");
  const run = async (line: string) => {
    await user.type(input(), `${line}{Enter}`);
  };
  return { user, input, log, run, captured, ...utils };
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("<Terminal>", () => {
  it("exposes a labelled region, a polite live log, and a focused input", () => {
    setup([], { initialLines: ["welcome"] });
    expect(screen.getByRole("region", { name: "Terminal" })).toBeInTheDocument();
    const log = screen.getByRole("log", { name: "Terminal output" });
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(within(log).getByText("welcome")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Command input" })).toHaveFocus();
  });

  it("echoes the command with the prompt and shows the command output", async () => {
    const { run, log } = setup();
    await run("say hello world");
    const lines = Array.from(log().querySelectorAll(".terminal-line"));
    expect(lines.map((l) => l.textContent)).toEqual(["$say hello world", "hello world"]);
    expect(lines[0]).toHaveAttribute("data-kind", "input");
  });

  it("renders an unknown command that looks like markup as inert text", async () => {
    const { run, log, container } = setup();
    await run("<img src=x onerror=alert(1)>");
    expect(within(log()).getAllByText(/<img/).length).toBeGreaterThan(0);
    expect(log().textContent).toContain("unknown command: <img");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(log().innerHTML).toContain("&lt;img");
  });

  it("renders hostile command output as inert text", async () => {
    const { run, log, container } = setup();
    await run("hostile");
    expect(log().textContent).toContain("<img src=x onerror=alert(1)>");
    expect(log().textContent).toContain("<script>alert(2)</script>");
    expect(container.querySelector("img, script, [onerror]")).toBeNull();
  });

  it("reports parse errors and does not run the command", async () => {
    const spy = vi.fn();
    const { run, log } = setup([cmd("spy", spy)]);
    await run('spy "unterminated');
    expect(log().textContent).toContain("unterminated quote");
    expect(spy).not.toHaveBeenCalled();
  });

  it("shows a generic failure when a command throws", async () => {
    const { run, log } = setup([
      cmd("boom", () => {
        throw new Error("leaky internal detail");
      }),
    ]);
    await run("boom");
    expect(log().textContent).toContain("command failed");
    expect(log().textContent).not.toContain("leaky internal detail");
  });

  it("navigates history with ArrowUp and ArrowDown and restores the draft", async () => {
    const { user, run, input } = setup();
    await run("say one");
    await run("say two");
    await user.type(input(), "dra");
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("say two");
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("say one");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input().value).toBe("dra");
  });

  it("caps the scrollback, dropping the oldest lines", async () => {
    const { run, log } = setup([], { maxScrollback: 4 });
    for (const n of [1, 2, 3]) await run(`say n${n}`);
    const shown = Array.from(log().querySelectorAll(".terminal-line")).map((l) => l.textContent);
    expect(shown).toHaveLength(4);
    expect(shown).toEqual(["$say n2", "n2", "$say n3", "n3"]);
  });

  it("clears the screen with a command and with Ctrl+L", async () => {
    const { user, run, log } = setup();
    await run("say a");
    await run("clear");
    expect(log().querySelectorAll(".terminal-line")).toHaveLength(0);
    await run("say b");
    expect(log().querySelectorAll(".terminal-line")).toHaveLength(2);
    await user.keyboard("{Control>}l{/Control}");
    expect(log().querySelectorAll(".terminal-line")).toHaveLength(0);
  });

  it("clears the input on Ctrl+C and interrupts a running command", async () => {
    const { user, run, input, log } = setup();
    await user.type(input(), "half");
    await user.keyboard("{Control>}c{/Control}");
    expect(input().value).toBe("");

    await run("hang");
    expect(log()).toHaveAttribute("aria-busy", "true");
    await user.keyboard("{Control>}c{/Control}");
    await waitFor(() => expect(log().textContent).toContain("interrupted"));
    expect(log()).toHaveAttribute("aria-busy", "false");
    await run("say after");
    expect(log().textContent).toContain("after");
  });

  it("caps the input length with maxLength", () => {
    const { input } = setup([], { maxInputLength: 12 });
    expect(input()).toHaveAttribute("maxlength", "12");
  });

  it("does not run a second command while one is running", async () => {
    const started = vi.fn();
    const { run, log } = setup([
      cmd("once", () => {
        started();
        return new Promise(() => undefined);
      }),
    ]);
    await run("once");
    await run("once");
    expect(started).toHaveBeenCalledTimes(1);
    expect(log()).toHaveAttribute("aria-busy", "true");
  });
});

describe("<Terminal> masked prompt", () => {
  it("collects a secret in a password input and never puts it in the DOM, scrollback, history, or storage", async () => {
    const { user, run, input, log, captured } = setup();
    await run("login alice");

    const field = input();
    expect(field).toHaveAttribute("type", "password");
    expect(field).toHaveAttribute("aria-label", "password:");
    expect(field).toHaveFocus();

    await user.type(field, SECRET);
    expect(document.body.innerHTML).not.toContain(SECRET);
    await user.keyboard("{Enter}");

    await waitFor(() => expect(log().textContent).toContain("logged in alice"));
    expect(captured.secret).toBe(SECRET);

    // Back to the normal prompt, focused, with the secret gone everywhere.
    expect(input()).toHaveAttribute("type", "text");
    expect(input()).toHaveFocus();
    expect(document.body.innerHTML).not.toContain(SECRET);
    expect(document.body.textContent).not.toContain(SECRET);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    // History holds the command line, never the password.
    await user.keyboard("{ArrowUp}");
    expect(input().value).toBe("login alice");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(input().value).toBe("login alice");
  });

  it("echoes only the prompt label for a submitted secret", async () => {
    const { user, run, input, log } = setup();
    await run("login alice");
    await user.type(input(), `${SECRET}{Enter}`);
    await waitFor(() => expect(log().textContent).toContain("logged in alice"));
    const echoes = Array.from(log().querySelectorAll('[data-kind="input"]')).map((l) => l.textContent);
    expect(echoes).toEqual(["$login alice", "password:"]);
  });

  it("cancels with Escape and with Ctrl+C, handing null to the command", async () => {
    const { user, run, input, log, captured } = setup();
    await run("login alice");
    await user.type(input(), "partial");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(log().textContent).toContain("cancelled alice"));
    expect(captured.secret).toBeNull();
    expect(input()).toHaveAttribute("type", "text");
    expect(document.body.innerHTML).not.toContain("partial");

    await run("login bob");
    await user.keyboard("{Control>}c{/Control}");
    await waitFor(() => expect(log().textContent).toContain("cancelled bob"));
    expect(captured.secret).toBeNull();
  });

  it("does not offer history navigation while the masked prompt is open", async () => {
    const { user, run, input } = setup();
    await run("say earlier");
    await run("login alice");
    await user.keyboard("{ArrowUp}");
    expect(input()).toHaveAttribute("type", "password");
    expect(input().value).toBe("");
  });

  it("limits the secret length with maxSecretLength", async () => {
    const { run, input } = setup([], { maxSecretLength: 7 });
    await run("login alice");
    expect(input()).toHaveAttribute("maxlength", "7");
  });
});

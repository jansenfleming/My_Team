import { parseInput } from "./parser";
import type { CommandRegistry } from "./registry";
import type { CommandContext, OutputLine, TerminalText } from "./types";

/** Longest command name echoed back in an "unknown command" message, in code points. */
const MAX_ECHOED_NAME = 32;

const LINE_KINDS: ReadonlySet<string> = new Set(["output", "error", "system"]);

export interface DispatchOptions {
  readonly registry: CommandRegistry;
  readonly text: TerminalText;
  readonly maxInputLength: number;
}

/**
 * Parse one submitted line and run the matching command. Never throws: every failure becomes an
 * error line built from `text`. If `ctx.signal` aborts while a command runs, dispatch stops
 * waiting and reports `text.interrupted` (the command itself may keep running).
 */
export async function dispatch(raw: string, ctx: CommandContext, options: DispatchOptions): Promise<OutputLine[]> {
  const { registry, text, maxInputLength } = options;
  const err = (message: string): OutputLine[] => [{ kind: "error", text: message }];

  const parsed = parseInput(raw, maxInputLength);
  if (!parsed.ok) {
    switch (parsed.error) {
      case "too_long":
        return err(text.inputTooLong(maxInputLength));
      case "unterminated_quote":
        return err(text.unterminatedQuote);
      case "trailing_escape":
        return err(text.trailingEscape);
    }
  }

  const [name, ...args] = parsed.args;
  if (name === undefined) return [];

  const command = registry.resolve(name);
  if (!command) {
    return err(text.unknownCommand([...name].slice(0, MAX_ECHOED_NAME).join("")));
  }

  if (ctx.signal.aborted) return err(text.interrupted);

  let onAbort: (() => void) | undefined;
  const aborted = new Promise<"aborted">((resolve) => {
    onAbort = () => resolve("aborted");
    ctx.signal.addEventListener("abort", onAbort, { once: true });
  });

  try {
    const outcome = await Promise.race([Promise.resolve().then(() => command.run(ctx, args)), aborted]);
    if (outcome === "aborted") return err(text.interrupted);
    return sanitize(outcome);
  } catch {
    // Deliberately drop the error: its message could contain user input or internals.
    return ctx.signal.aborted ? err(text.interrupted) : err(text.commandFailed);
  } finally {
    if (onAbort) ctx.signal.removeEventListener("abort", onAbort);
  }
}

/** Accept only well-formed lines from a command, and force their text to be a string. */
function sanitize(result: readonly OutputLine[] | void): OutputLine[] {
  if (!Array.isArray(result)) return [];
  const lines: OutputLine[] = [];
  for (const line of result as unknown[]) {
    if (typeof line !== "object" || line === null) continue;
    const { kind, text } = line as { kind?: unknown; text?: unknown };
    if (typeof kind === "string" && LINE_KINDS.has(kind) && typeof text === "string") {
      lines.push({ kind: kind as OutputLine["kind"], text });
    }
  }
  return lines;
}

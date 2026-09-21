// Terminal engine types. The engine holds no site copy: every user-facing string is passed in
// (see TerminalText) so the site can be renamed by editing src/content/ only.

/** input = echo of a submitted command line, output = normal result, error = failure, system = notices. */
export type LineKind = "input" | "output" | "error" | "system";

/** A line a command produces. Always plain text: the UI renders it as a text node, never as HTML. */
export interface OutputLine {
  readonly kind: Exclude<LineKind, "input">;
  readonly text: string;
}

/** A line in the scrollback. `prompt` is set only on `input` lines. */
export interface Line {
  readonly id: number;
  readonly kind: LineKind;
  readonly text: string;
  readonly prompt?: string;
}

export interface CommandInfo {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly usage: string;
  readonly summary: string;
}

/** What a command can do besides returning lines. */
export interface CommandContext {
  /** Empty the scrollback. */
  clear(): void;
  /**
   * Ask the user for a secret (for example a password) at a masked prompt. The value is handed
   * only to the returned promise: it is never added to the scrollback, history, or React state.
   * Resolves to `null` if the user cancels (Ctrl+C or Escape).
   */
  readSecret(label: string): Promise<string | null>;
  /** Aborted when the user presses Ctrl+C while the command runs. Pass it to fetch when possible. */
  readonly signal: AbortSignal;
  /** Every registered command, for building help output. */
  readonly commands: readonly CommandInfo[];
}

export type CommandResult = readonly OutputLine[] | void;

export interface CommandDefinition extends CommandInfo {
  run(ctx: CommandContext, args: readonly string[]): CommandResult | Promise<CommandResult>;
}

/** All strings the engine may show. Provided by the app (src/content/), never hardcoded here. */
export interface TerminalText {
  unknownCommand(name: string): string;
  inputTooLong(maxLength: number): string;
  unterminatedQuote: string;
  trailingEscape: string;
  /** Shown when a command throws. Generic on purpose: never include the thrown error's text. */
  commandFailed: string;
  /** Shown when the user interrupts a running command. */
  interrupted: string;
  /** Accessible names. */
  regionLabel: string;
  logLabel: string;
  inputLabel: string;
}

export function outputLine(text: string): OutputLine {
  return { kind: "output", text };
}
export function errorLine(text: string): OutputLine {
  return { kind: "error", text };
}
export function systemLine(text: string): OutputLine {
  return { kind: "system", text };
}

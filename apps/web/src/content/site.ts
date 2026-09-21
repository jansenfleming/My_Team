/**
 * All site-identity copy lives here so a rename is a one-file change: the site name, the
 * prompt, the welcome banner, and every string the terminal engine shows.
 *
 * The owner chose the name ZeroJance (recorded in docs/architecture/board.md; the terminal
 * form is ZEROJANCE). The prompt host, welcome banner and lore strings stay placeholders until
 * the Creative Director's screen and command specs land (D3, D4). Do not hardcode the name,
 * the prompt host, or lore strings anywhere else in apps/web/src; import them from this
 * module. (index.html keeps a neutral <title> as a fallback; the runtime title comes from
 * PAGE_TITLE.)
 */
import type { TerminalText } from "../terminal";

export const SITE_NAME = "ZeroJance";
export const PAGE_TITLE = SITE_NAME;

/** Shown in front of every command line. */
export const PROMPT_USER = "guest";
export const PROMPT_HOST = "[PLACEHOLDER: host]";
export const PROMPT = `${PROMPT_USER}@${PROMPT_HOST}$`;

/** Printed once when the terminal loads. */
export const WELCOME_LINES: readonly string[] = [
  "[PLACEHOLDER: welcome banner]",
  "Type help to list commands.",
];

/** Engine messages and accessible names. */
export const terminalText: TerminalText = {
  unknownCommand: (name) => `Unknown command: ${name}. Type help to list commands.`,
  inputTooLong: (max) => `Input too long (limit ${max} characters).`,
  unterminatedQuote: "Unterminated quote.",
  trailingEscape: "Line ends with a lone backslash.",
  commandFailed: "That command failed. Try again.",
  interrupted: "Interrupted.",
  regionLabel: "Terminal",
  logLabel: "Terminal output",
  inputLabel: "Command input",
};

/** Placeholder command copy (task F2). Task F4 replaces this with the design spec's strings. */
export const commandText = {
  help: { usage: "help", summary: "List available commands." },
  clear: { usage: "clear", summary: "Clear the screen (or press Ctrl+L)." },
  helpHeader: "Available commands:",
} as const;

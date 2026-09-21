export { Terminal } from "./Terminal";
export type { TerminalProps } from "./Terminal";
export { useTerminal } from "./useTerminal";
export type { TerminalApi, UseTerminalOptions } from "./useTerminal";
export { createRegistry } from "./registry";
export type { CommandRegistry } from "./registry";
export { parseInput, MAX_INPUT_LENGTH } from "./parser";
export type { ParseError, ParseResult } from "./parser";
export { CommandHistory } from "./history";
export { dispatch } from "./dispatch";
export { errorLine, outputLine, systemLine } from "./types";
export type {
  CommandContext,
  CommandDefinition,
  CommandInfo,
  CommandResult,
  Line,
  LineKind,
  OutputLine,
  TerminalText,
} from "./types";

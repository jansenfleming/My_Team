/** Longest command line accepted, in UTF-16 code units (JS `.length`, same unit as the API contract). */
export const MAX_INPUT_LENGTH = 1024;

export type ParseError = "too_long" | "unterminated_quote" | "trailing_escape";
export type ParseResult =
  | { readonly ok: true; readonly args: string[] }
  | { readonly ok: false; readonly error: ParseError };

const WHITESPACE = /\s/u;

/**
 * Split a command line into arguments, shell-style but with no expansion of any kind:
 * - whitespace (Unicode `\s`) separates arguments;
 * - 'single quotes' are literal;
 * - "double quotes" allow \" and \\ (any other backslash is kept as written);
 * - outside quotes a backslash makes the next character literal;
 * - adjacent quoted and unquoted parts join into one argument, and "" is an empty argument.
 * Characters are never dropped or altered, so control characters and lookalike escape
 * sequences (for example the text "\x1b[31m") stay ordinary text. Iterates by code point.
 */
export function parseInput(raw: string, maxLength: number = MAX_INPUT_LENGTH): ParseResult {
  if (raw.length > maxLength) return { ok: false, error: "too_long" };

  const args: string[] = [];
  let current = "";
  let inArg = false;
  let quote: '"' | "'" | null = null;
  let escaped = false; // previous character was a backslash outside quotes
  let dqEscaped = false; // previous character was a backslash inside double quotes

  for (const ch of raw) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (dqEscaped) {
      current += ch === '"' || ch === "\\" ? ch : `\\${ch}`;
      dqEscaped = false;
      continue;
    }
    if (quote === "'") {
      if (ch === "'") quote = null;
      else current += ch;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') quote = null;
      else if (ch === "\\") dqEscaped = true;
      else current += ch;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      inArg = true;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      inArg = true;
    } else if (WHITESPACE.test(ch)) {
      if (inArg) {
        args.push(current);
        current = "";
        inArg = false;
      }
    } else {
      current += ch;
      inArg = true;
    }
  }

  if (escaped) return { ok: false, error: "trailing_escape" };
  if (dqEscaped || quote !== null) return { ok: false, error: "unterminated_quote" };
  if (inArg) args.push(current);
  return { ok: true, args };
}

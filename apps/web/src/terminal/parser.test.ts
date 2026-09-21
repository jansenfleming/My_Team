import { describe, expect, it } from "vitest";
import { MAX_INPUT_LENGTH, parseInput } from "./parser";

const args = (raw: string, max?: number) => {
  const result = parseInput(raw, max);
  if (!result.ok) throw new Error(`expected ok, got ${result.error}`);
  return result.args;
};
const error = (raw: string, max?: number) => {
  const result = parseInput(raw, max);
  return result.ok ? null : result.error;
};

describe("parseInput: splitting", () => {
  it("returns no arguments for empty and whitespace-only input", () => {
    expect(args("")).toEqual([]);
    expect(args("   \t  ")).toEqual([]);
  });

  it("splits on runs of spaces and tabs and ignores leading and trailing whitespace", () => {
    expect(args("  guestbook   sign\tghost  ")).toEqual(["guestbook", "sign", "ghost"]);
  });

  it("keeps a single word as one argument", () => {
    expect(args("help")).toEqual(["help"]);
  });
});

describe("parseInput: quotes and escapes", () => {
  it("keeps double-quoted text together, including spaces", () => {
    expect(args('guestbook sign ghost "hello  grid"')).toEqual(["guestbook", "sign", "ghost", "hello  grid"]);
  });

  it("treats single quotes as literal, including backslashes and double quotes", () => {
    expect(args(`say 'a "b" \\n c'`)).toEqual(["say", 'a "b" \\n c']);
  });

  it("allows \\\" and \\\\ inside double quotes and keeps other backslashes as written", () => {
    expect(args('say "she said \\"hi\\" \\\\ \\n"')).toEqual(["say", 'she said "hi" \\ \\n']);
  });

  it("lets a backslash make the next character literal outside quotes", () => {
    expect(args("say hello\\ world \\'quoted\\'")).toEqual(["say", "hello world", "'quoted'"]);
  });

  it("joins adjacent quoted and unquoted parts into one argument", () => {
    expect(args('a"b c"d')).toEqual(["ab cd"]);
  });

  it("produces an empty argument for empty quotes", () => {
    expect(args('login ""')).toEqual(["login", ""]);
    expect(args("x '' y")).toEqual(["x", "", "y"]);
  });

  it("rejects an unterminated quote", () => {
    expect(error('say "hello')).toBe("unterminated_quote");
    expect(error("say 'hello")).toBe("unterminated_quote");
    expect(error('say "hello\\')).toBe("unterminated_quote");
  });

  it("rejects a trailing backslash outside quotes", () => {
    expect(error("say hello\\")).toBe("trailing_escape");
  });
});

describe("parseInput: unicode and hostile text", () => {
  it("keeps astral characters intact", () => {
    expect(args('say "😀 ok" 𝒳')).toEqual(["say", "😀 ok", "𝒳"]);
  });

  it("handles CJK, right-to-left, and combining characters", () => {
    expect(args("say こんにちは שלום é")).toEqual(["say", "こんにちは", "שלום", "é"]);
  });

  it("splits on Unicode whitespace such as no-break and ideographic spaces", () => {
    expect(args("a b　c")).toEqual(["a", "b", "c"]);
  });

  it("does not treat zero-width or bidi characters as whitespace or strip them", () => {
    expect(args("a​b ‮evil")).toEqual(["a​b", "‮evil"]);
  });

  it("never expands or interprets anything: markup, shell syntax, and escape lookalikes stay text", () => {
    expect(args("<img src=x onerror=alert(1)>")).toEqual(["<img", "src=x", "onerror=alert(1)>"]);
    expect(args("echo $HOME `id` $(id) ~ * ; | &&")).toEqual(["echo", "$HOME", "`id`", "$(id)", "~", "*", ";", "|", "&&"]);
    expect(args("say \\x1b[31mred \u001b[0m")).toEqual(["say", "x1b[31mred", "\u001b[0m"]);
  });
});

describe("parseInput: length limit", () => {
  it("accepts input of exactly the limit and rejects one unit more", () => {
    expect(error("a".repeat(MAX_INPUT_LENGTH))).toBeNull();
    expect(error("a".repeat(MAX_INPUT_LENGTH + 1))).toBe("too_long");
  });

  it("rejects 10 kB of input by default without tokenizing it", () => {
    expect(error("a ".repeat(5 * 1024))).toBe("too_long");
  });

  it("parses 10 kB when the limit is raised, and stays fast", () => {
    const raw = "word ".repeat(2048); // 10 kB
    expect(raw.length).toBe(10240);
    const started = performance.now();
    const parsed = args(raw, 20_000);
    expect(parsed).toHaveLength(2048);
    expect(performance.now() - started).toBeLessThan(500);
  });

  it("counts UTF-16 code units, so an astral character counts as two", () => {
    expect(error("😀".repeat(5), 10)).toBeNull();
    expect(error("😀".repeat(5), 9)).toBe("too_long");
  });
});

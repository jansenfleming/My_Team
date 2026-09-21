import { describe, expect, it } from "vitest";
import {
  CreateGuestbookRequestSchema,
  HANDLE_MAX,
  HANDLE_MIN,
  HandleSchema,
  MESSAGE_MAX,
  MessageSchema,
  toValidationDetails,
} from "./index";

const ok = (s: { safeParse: (v: unknown) => { success: boolean } }, v: unknown) =>
  s.safeParse(v).success;

describe("HandleSchema", () => {
  it.each([
    [1, false],
    [HANDLE_MIN, true],
    [HANDLE_MAX, true],
    [HANDLE_MAX + 1, false],
    [0, false],
  ])("length %i -> accepted=%s", (len, accepted) => {
    expect(ok(HandleSchema, "a".repeat(len))).toBe(accepted);
  });

  it("accepts the full charset", () => {
    expect(HandleSchema.parse("Ghost_42-x")).toBe("Ghost_42-x");
    expect(HandleSchema.parse("AZaz09_-")).toBe("AZaz09_-");
  });

  it.each([
    "ab cd",
    " ab",
    "ab ",
    "ab\n",
    "\nab",
    "ab\t",
    "a.b",
    "a@b",
    "<script>",
    "'; DROP TABLE x;--",
    "ghöst",
    "ａｂ",
    "ab‮",
    "a\u0000b",
    "a​b",
  ])("rejects bad charset %j", (h) => {
    expect(ok(HandleSchema, h)).toBe(false);
  });

  it.each([undefined, null, 42, true, {}, [], ["ab"]])("rejects non-string %j", (v) => {
    expect(ok(HandleSchema, v)).toBe(false);
  });

  it("does not trim", () => {
    expect(ok(HandleSchema, "  ab  ")).toBe(false);
  });
});

describe("MessageSchema length and trimming", () => {
  it.each([
    [0, false],
    [1, true],
    [MESSAGE_MAX, true],
    [MESSAGE_MAX + 1, false],
  ])("length %i -> accepted=%s", (len, accepted) => {
    expect(ok(MessageSchema, "x".repeat(len))).toBe(accepted);
  });

  it("rejects whitespace-only input (0 chars after trimming)", () => {
    expect(ok(MessageSchema, "   ")).toBe(false);
    expect(ok(MessageSchema, "  ")).toBe(false);
  });

  it("trims spaces and returns the trimmed value", () => {
    expect(MessageSchema.parse("  hello grid  ")).toBe("hello grid");
  });

  it("counts length after trimming: 280 chars plus padding is accepted, 281 is not", () => {
    expect(ok(MessageSchema, ` ${"x".repeat(MESSAGE_MAX)} `)).toBe(true);
    expect(ok(MessageSchema, ` ${"x".repeat(MESSAGE_MAX + 1)} `)).toBe(false);
  });

  it("counts UTF-16 code units, not code points", () => {
    // U+1F600 is 2 UTF-16 code units: 140 of them = 280 (ok), 141 = 282 (rejected).
    expect(ok(MessageSchema, "\u{1F600}".repeat(140))).toBe(true);
    expect(ok(MessageSchema, "\u{1F600}".repeat(141))).toBe(false);
  });

  it.each([undefined, null, 42, {}, ["hi"]])("rejects non-string %j", (v) => {
    expect(ok(MessageSchema, v)).toBe(false);
  });

  it("stores everything else verbatim (SQLi, HTML, unicode)", () => {
    for (const m of [
      "'; DROP TABLE guestbook_entries;--",
      "<img src=x onerror=alert(1)>",
      "<script>alert(1)</script>",
      "a & b \" ' `",
      "héllo 世界 \u{1F680}",
      "${process.env.SECRET} {{7*7}} %s %n",
    ]) {
      expect(MessageSchema.parse(m)).toBe(m);
    }
  });
});

describe("MessageSchema forbidden characters", () => {
  const cases: [string, string][] = [
    ["newline U+000A", "\n"],
    ["carriage return U+000D", "\r"],
    ["tab U+0009", "\t"],
    ["NUL U+0000", "\u0000"],
    ["ESC U+001B", "\u001b"],
    ["C0 end U+001F", "\u001f"],
    ["DEL U+007F", "\u007f"],
    ["C1 start U+0080", "\u0080"],
    ["NEL U+0085", "\u0085"],
    ["C1 end U+009F", "\u009f"],
    ["line separator U+2028", " "],
    ["paragraph separator U+2029", " "],
    ["LRE U+202A", "‪"],
    ["RLE U+202B", "‫"],
    ["PDF U+202C", "‬"],
    ["LRO U+202D", "‭"],
    ["RLO U+202E", "‮"],
    ["LRI U+2066", "⁦"],
    ["RLI U+2067", "⁧"],
    ["FSI U+2068", "⁨"],
    ["PDI U+2069", "⁩"],
    ["LRM U+200E", "‎"],
    ["RLM U+200F", "‏"],
    ["ALM U+061C", "؜"],
    ["lone high surrogate U+D800", "\ud800"],
    ["lone low surrogate U+DFFF", "\udfff"],
  ];

  it.each(cases)("rejects %s in the middle", (_name, ch) => {
    expect(ok(MessageSchema, `ab${ch}cd`)).toBe(false);
  });

  it.each(cases)("rejects %s alone and at the ends (checked before trimming)", (_name, ch) => {
    expect(ok(MessageSchema, ch)).toBe(false);
    expect(ok(MessageSchema, `hi${ch}`)).toBe(false);
    expect(ok(MessageSchema, `${ch}hi`)).toBe(false);
  });

  it("reports a single fixed-message issue for a forbidden character", () => {
    const r = MessageSchema.safeParse("hi\n");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues).toHaveLength(1);
  });

  it("accepts characters just outside the forbidden ranges", () => {
    for (const ch of [" ", " ", "¡", "‧", " ", "⁥", "⁪", "؛", "؝"]) {
      expect(MessageSchema.parse(`a${ch}b`)).toBe(`a${ch}b`);
    }
  });

  it("accepts zero-width characters and emoji sequences (ZWJ, ZWSP, variation selector)", () => {
    const family = "\u{1F468}‍\u{1F469}‍\u{1F467}";
    expect(MessageSchema.parse(family)).toBe(family);
    expect(MessageSchema.parse("a​b")).toBe("a​b");
    expect(MessageSchema.parse("❤️")).toBe("❤️");
  });

  it("accepts valid surrogate pairs (astral characters)", () => {
    expect(MessageSchema.parse("\u{1F680}")).toBe("\u{1F680}");
    expect(MessageSchema.parse("🚀")).toBe("\u{1F680}");
  });

  it("rejects a reversed surrogate pair (low then high)", () => {
    expect(ok(MessageSchema, "\ude80\ud83d")).toBe(false);
  });
});

describe("CreateGuestbookRequestSchema", () => {
  it("accepts a valid request and returns the trimmed message", () => {
    expect(CreateGuestbookRequestSchema.parse({ handle: "ghost_42", message: " hello grid " })).toEqual({
      handle: "ghost_42",
      message: "hello grid",
    });
  });

  it("strips unknown keys (mass assignment)", () => {
    const out = CreateGuestbookRequestSchema.parse({
      handle: "ghost_42",
      message: "hi",
      id: 999,
      createdAt: "2000-01-01T00:00:00.000Z",
      __proto__: { admin: true },
      role: "operator",
    });
    expect(Object.keys(out).sort()).toEqual(["handle", "message"]);
  });

  it.each([
    ["missing handle", { message: "hi" }],
    ["missing message", { handle: "ab" }],
    ["empty object", {}],
    ["null", null],
    ["array", []],
    ["string", "handle=ab&message=hi"],
    ["number", 1],
    ["undefined", undefined],
  ])("rejects %s", (_n, v) => {
    expect(ok(CreateGuestbookRequestSchema, v)).toBe(false);
  });

  it("reports field paths for every invalid field", () => {
    const r = CreateGuestbookRequestSchema.safeParse({ handle: "a", message: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const details = toValidationDetails(r.error);
      expect(details.map((d) => d.path).sort()).toEqual(["handle", "message"]);
    }
  });
});

describe("toValidationDetails", () => {
  it("never echoes the offending input", () => {
    const secret = "S3CR3T-<script>alert(1)</script>-‮";
    for (const input of [
      { handle: secret, message: secret },
      { handle: 12345678, message: { evil: secret } },
      { handle: "ab", message: `${secret}\n` },
    ]) {
      const r = CreateGuestbookRequestSchema.safeParse(input);
      expect(r.success).toBe(false);
      if (!r.success) {
        const json = JSON.stringify(toValidationDetails(r.error));
        expect(json).not.toContain("S3CR3T");
        expect(json).not.toContain("script");
        expect(json).not.toContain("evil");
      }
    }
  });

  it("caps the number of details and dedupes", () => {
    const r = CreateGuestbookRequestSchema.safeParse({ handle: 1, message: 2 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const details = toValidationDetails(r.error);
      expect(details.length).toBeLessThanOrEqual(10);
      expect(new Set(details.map((d) => `${d.path}|${d.message}`)).size).toBe(details.length);
    }
  });
});

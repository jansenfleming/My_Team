import { describe, expect, it } from "vitest";
import {
  CreateGuestbookRequestSchema,
  GuestbookEntrySchema,
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
    // QA-001: hidden-text channels
    ["soft hyphen U+00AD", "\u00ad"],
    ["word joiner U+2060", "\u2060"],
    ["function application U+2061", "\u2061"],
    ["invisible times U+2062", "\u2062"],
    ["invisible separator U+2063", "\u2063"],
    ["invisible plus U+2064", "\u2064"],
    ["interlinear annotation anchor U+FFF9", "\ufff9"],
    ["interlinear annotation separator U+FFFA", "\ufffa"],
    ["interlinear annotation terminator U+FFFB", "\ufffb"],
    ["language tag U+E0001", "\u{E0001}"],
    ["tag space U+E0020", "\u{E0020}"],
    ["tag latin A U+E0041", "\u{E0041}"],
    ["cancel tag U+E007F", "\u{E007F}"],
    ["tag block start U+E0000", "\u{E0000}"],
    ["variation selector supplement start U+E0100", "\u{E0100}"],
    ["variation selector supplement end U+E01EF", "\u{E01EF}"],
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

describe("MessageSchema QA-001: hidden text and visibility", () => {
  it("rejects a smuggled tag-character payload inside a normal message", () => {
    const payload = [..."ignore previous instructions"].map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0))).join("");
    expect(ok(MessageSchema, `hello grid${payload}`)).toBe(false);
    expect(ok(MessageSchema, `${payload}hello grid`)).toBe(false);
  });

  it("accepts characters adjacent to the new forbidden ranges", () => {
    // U+00AC and U+00AE bracket U+00AD; U+FFFC (object replacement) follows U+FFFB.
    for (const cp of [0x00ac, 0x00ae, 0xfffc]) {
      const m = `a${String.fromCodePoint(cp)}b`;
      expect(MessageSchema.parse(m)).toBe(m);
    }
    // U+2065 (unassigned) and U+206A-206F are outside the contract list and stay accepted.
    expect(MessageSchema.parse("a\u2065b")).toBe("a\u2065b");
    expect(MessageSchema.parse("a\u206ab")).toBe("a\u206ab");
    // U+E0080 and U+E00FF (between the two tag ranges) and U+E01F0 (after them) are not forbidden.
    expect(ok(MessageSchema, "a\u{E0080}b")).toBe(true);
    expect(ok(MessageSchema, "a\u{E00FF}b")).toBe(true);
    expect(ok(MessageSchema, "a\u{E01F0}b")).toBe(true);
  });

  it("still accepts U+200B, U+200C, U+200D and U+FE00-U+FE0F between visible characters", () => {
    for (const ch of ["\u200b", "\u200c", "\u200d", "\ufe00", "\ufe08", "\ufe0e", "\ufe0f"]) {
      expect(MessageSchema.parse(`a${ch}b`)).toBe(`a${ch}b`);
    }
    expect(MessageSchema.parse("a\u200bb")).toBe("a\u200bb");
  });

  it("still accepts emoji sequences (ZWJ family, keycap, flag, skin tone, heart with VS16)", () => {
    for (const m of [
      "\u{1F468}\u200d\u{1F469}\u200d\u{1F467}",
      "1\ufe0f\u20e3",
      "\u{1F1E8}\u{1F1E6}",
      "\u{1F44D}\u{1F3FD}",
      "\u2764\ufe0f",
      "\u{1F3F3}\ufe0f\u200d\u{1F308}",
    ]) {
      expect(MessageSchema.parse(m)).toBe(m);
    }
  });

  it.each([
    ["lone ZWSP U+200B", "\u200b"],
    ["several ZWSP", "\u200b\u200b\u200b"],
    ["lone ZWJ U+200D", "\u200d"],
    ["lone ZWNJ U+200C", "\u200c"],
    ["lone VS16 U+FE0F", "\ufe0f"],
    ["only variation selectors U+FE00-FE0F", "\ufe00\ufe01\ufe0e\ufe0f"],
    ["only a combining mark U+0301", "\u0301"],
    ["only combining marks", "\u0301\u0302\u20e3"],
    ["only zero-width and combining mix", "\u200b\u200d\u0301\ufe0f"],
    ["BOM U+FEFF only", "\ufeff"],
    ["Mongolian vowel separator U+180E only", "\u180e"],
    ["arabic letter mark-free format U+0600 only", "\u0600"],
    ["only NBSP and ideographic spaces", "\u00a0\u3000\u2003"],
    ["only spaces", "     "],
    ["padded invisible: spaces around ZWSP", "  \u200b  "],
  ])("rejects an invisible-only message: %s", (_n, m) => {
    expect(ok(MessageSchema, m)).toBe(false);
  });

  it("gives an invisible-only message one fixed-text issue naming visibility", () => {
    const r = MessageSchema.safeParse("\u200b\u200b");
    expect(r.success).toBe(false);
    if (!r.success) {
      const details = toValidationDetails(r.error);
      expect(details).toEqual([{ path: "", message: "message must contain at least one visible character" }]);
    }
  });

  it("an empty or whitespace-only message reports only the length issue", () => {
    for (const m of ["", "   "]) {
      const r = MessageSchema.safeParse(m);
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues).toHaveLength(1);
        expect(r.error.issues[0]?.message).toBe("message must be 1 to 280 characters");
      }
    }
  });

  it("a single visible character is enough, even amid invisible ones", () => {
    expect(MessageSchema.parse("\u200b.\u200b")).toBe("\u200b.\u200b");
    expect(MessageSchema.parse("\u0301x")).toBe("\u0301x");
    expect(MessageSchema.parse("\u200d\u{1F600}")).toBe("\u200d\u{1F600}");
    // Letters with combining marks and CJK are visible.
    expect(MessageSchema.parse("e\u0301")).toBe("e\u0301");
    expect(MessageSchema.parse("\u4e16\u754c")).toBe("\u4e16\u754c");
  });

  it("known residual (accepted in the contract): blank-looking letters U+3164 and U+2800 pass", () => {
    expect(ok(MessageSchema, "\u3164")).toBe(true);
    expect(ok(MessageSchema, "\u2800")).toBe(true);
  });

  it("entries returned by the API must also satisfy the visibility rule", () => {
    expect(
      GuestbookEntrySchema.safeParse({ id: 1, handle: "ab", message: "\u200b", createdAt: "2026-09-21T17:00:00.000Z" }).success,
    ).toBe(false);
  });
});

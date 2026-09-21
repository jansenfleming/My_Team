import { describe, expect, it } from "vitest";
import {
  GUESTBOOK_PAGE_DEFAULT,
  GUESTBOOK_PAGE_MAX,
  GuestbookIdParamsSchema,
  GuestbookQuerySchema,
  LoginRequestSchema,
  PASSWORD_MAX,
  USERNAME_MAX,
  toValidationDetails,
} from "./index";

const okQ = (v: unknown) => GuestbookQuerySchema.safeParse(v).success;

describe("GuestbookQuerySchema", () => {
  it("defaults limit to 20 and leaves before undefined", () => {
    expect(GuestbookQuerySchema.parse({})).toEqual({ limit: GUESTBOOK_PAGE_DEFAULT });
    expect(GuestbookQuerySchema.parse({}).before).toBeUndefined();
  });

  it("parses digit strings to numbers", () => {
    expect(GuestbookQuerySchema.parse({ limit: "5", before: "42" })).toEqual({ limit: 5, before: 42 });
  });

  it.each([
    ["0", false],
    ["1", true],
    [String(GUESTBOOK_PAGE_MAX), true],
    [String(GUESTBOOK_PAGE_MAX + 1), false],
    ["-1", false],
    ["1.5", false],
    ["1e1", false],
    ["0x10", false],
    ["", false],
    [" ", false],
    [" 5", false],
    ["5 ", false],
    ["+5", false],
    ["abc", false],
    ["NaN", false],
    ["Infinity", false],
    ["5; DROP TABLE x", false],
    ["9".repeat(30), false],
  ])("limit=%j -> accepted=%s", (limit, accepted) => {
    expect(okQ({ limit })).toBe(accepted);
  });

  it.each([
    ["0", false],
    ["1", true],
    ["9007199254740991", true],
    ["9007199254740992", false],
    ["99999999999999999", false],
    ["-5", false],
    ["2.0", false],
    ["", false],
    ["null", false],
  ])("before=%j -> accepted=%s", (before, accepted) => {
    expect(okQ({ before })).toBe(accepted);
  });

  it("rejects repeated params (array) and non-string values", () => {
    expect(okQ({ limit: ["1", "2"] })).toBe(false);
    expect(okQ({ before: ["1", "2"] })).toBe(false);
    expect(okQ({ limit: { $gt: "1" } })).toBe(false);
    expect(okQ({ limit: 5 })).toBe(false);
    expect(okQ({ limit: null })).toBe(false);
  });

  it("ignores unknown query params (cache busters)", () => {
    expect(GuestbookQuerySchema.parse({ _: "123", limit: "3" })).toEqual({ limit: 3 });
  });

  it("gives fixed messages with the field path", () => {
    const r = GuestbookQuerySchema.safeParse({ limit: "abc<script>", before: "0" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const details = toValidationDetails(r.error);
      expect(details.map((d) => d.path).sort()).toEqual(["before", "limit"]);
      expect(JSON.stringify(details)).not.toContain("script");
    }
  });
});

describe("GuestbookIdParamsSchema", () => {
  it("parses a positive integer id", () => {
    expect(GuestbookIdParamsSchema.parse({ id: "7" })).toEqual({ id: 7 });
  });
  it.each(["0", "-1", "1.5", "1e2", "abc", "", " ", "7 ", "0x7", "../../etc/passwd", "1;2", "9007199254740992"])(
    "rejects id %j",
    (id) => {
      expect(GuestbookIdParamsSchema.safeParse({ id }).success).toBe(false);
    },
  );
  it("rejects a missing id", () => {
    expect(GuestbookIdParamsSchema.safeParse({}).success).toBe(false);
  });
});

describe("LoginRequestSchema", () => {
  const okL = (v: unknown) => LoginRequestSchema.safeParse(v).success;

  it("accepts boundary lengths", () => {
    expect(okL({ username: "u", password: "p" })).toBe(true);
    expect(okL({ username: "u".repeat(USERNAME_MAX), password: "p".repeat(PASSWORD_MAX) })).toBe(true);
  });

  it("rejects empty and over-long values", () => {
    expect(okL({ username: "", password: "p" })).toBe(false);
    expect(okL({ username: "u", password: "" })).toBe(false);
    expect(okL({ username: "u".repeat(USERNAME_MAX + 1), password: "p" })).toBe(false);
    expect(okL({ username: "u", password: "p".repeat(PASSWORD_MAX + 1) })).toBe(false);
  });

  it("rejects missing or non-string fields", () => {
    expect(okL({ username: "u" })).toBe(false);
    expect(okL({ password: "p" })).toBe(false);
    expect(okL({ username: 1, password: "p" })).toBe(false);
    expect(okL({ username: "u", password: { $ne: "" } })).toBe(false);
    expect(okL(null)).toBe(false);
    expect(okL("u:p")).toBe(false);
  });

  it("never trims or alters the password or username", () => {
    const r = LoginRequestSchema.parse({ username: " op ", password: "  pass word \n" });
    expect(r).toEqual({ username: " op ", password: "  pass word \n" });
  });

  it("strips unknown keys", () => {
    const r = LoginRequestSchema.parse({ username: "u", password: "p", role: "operator", remember: true });
    expect(Object.keys(r).sort()).toEqual(["password", "username"]);
  });

  it("does not echo the password in validation details", () => {
    const pw = "hunter2-".repeat(40);
    const r = LoginRequestSchema.safeParse({ username: "", password: pw });
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(toValidationDetails(r.error))).not.toContain("hunter2");
  });
});

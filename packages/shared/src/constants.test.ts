import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as shared from "./index";
import * as constantsOnly from "./constants";

describe("constants match api-contract.md", () => {
  it("section 5 values", () => {
    expect(shared).toMatchObject({
      HANDLE_MIN: 2,
      HANDLE_MAX: 24,
      MESSAGE_MAX: 280,
      GUESTBOOK_PAGE_DEFAULT: 20,
      GUESTBOOK_PAGE_MAX: 50,
      USERNAME_MAX: 64,
      PASSWORD_MAX: 256,
    });
  });
  it("other contract values", () => {
    expect(shared.CONTRACT_VERSION).toBe("1.0");
    expect(shared.API_BASE_PATH).toBe("/api");
    expect(shared.BODY_LIMIT_BYTES).toBe(4096);
    expect(shared.SESSION_COOKIE_NAME).toBe("sid");
    expect(shared.SESSION_MAX_AGE_SECONDS).toBe(8 * 60 * 60);
    expect(shared.ROLES).toEqual(["operator"]);
    expect(shared.RATE_LIMITS).toEqual({
      global: { max: 120, windowMs: 60_000 },
      login: { max: 5, windowMs: 60_000 },
      guestbookPost: { max: 3, windowMs: 10 * 60_000 },
    });
  });
  it("error codes and HTTP statuses match the section 2 table", () => {
    expect(shared.ERROR_HTTP_STATUS).toEqual({
      validation_error: 400,
      invalid_credentials: 401,
      unauthenticated: 401,
      origin_rejected: 403,
      forbidden: 403,
      not_found: 404,
      payload_too_large: 413,
      unsupported_media_type: 415,
      rate_limited: 429,
      unavailable: 503,
      internal_error: 500,
    });
    expect([...shared.ERROR_CODES].sort()).toEqual(Object.keys(shared.ERROR_HTTP_STATUS).sort());
  });
  it("HANDLE_PATTERN matches the contract regex source", () => {
    expect(shared.HANDLE_PATTERN.source).toBe("^[A-Za-z0-9_-]+$");
  });
  it("the ./constants subpath re-exports the same values", () => {
    expect(constantsOnly.HANDLE_MAX).toBe(shared.HANDLE_MAX);
    expect(constantsOnly.ERROR_CODES).toBe(shared.ERROR_CODES);
  });
  it("constants.ts has no imports, so the web app can use it without zod", () => {
    const src = readFileSync(new URL("./constants.ts", import.meta.url), "utf8");
    const code = src
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
      .join("\n");
    expect(code).not.toMatch(/^\s*import\b/m);
    expect(code).not.toMatch(/\brequire\(/);
    expect(code).not.toMatch(/^\s*export\s+.*\bfrom\b/m);
  });
});

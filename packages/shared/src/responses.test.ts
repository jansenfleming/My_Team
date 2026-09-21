import { describe, expect, it } from "vitest";
import {
  ApiErrorSchema,
  CreateGuestbookResponseSchema,
  DiagnosticsResponseSchema,
  ERROR_CODES,
  GuestbookEntrySchema,
  GuestbookListResponseSchema,
  HealthResponseSchema,
  LoginResponseSchema,
  MeResponseSchema,
  UserSchema,
} from "./index";

const TS = "2026-09-21T17:00:00.000Z";
const entry = { id: 7, handle: "ghost_42", message: "hello grid", createdAt: TS };
const bad = (s: { safeParse: (v: unknown) => { success: boolean } }, v: unknown) => s.safeParse(v).success;

describe("contract examples parse (sections 2 and 6)", () => {
  it("health", () => {
    expect(HealthResponseSchema.parse({ status: "ok", version: "0.1.0", contract: "1.0", time: TS })).toBeTruthy();
  });
  it("login and me", () => {
    const user = { username: "operator", role: "operator" };
    expect(LoginResponseSchema.parse({ user })).toEqual({ user });
    expect(MeResponseSchema.parse({ user })).toEqual({ user });
    expect(MeResponseSchema.parse({ user: null })).toEqual({ user: null });
  });
  it("guestbook list and create", () => {
    expect(GuestbookListResponseSchema.parse({ items: [entry], nextBefore: 7 })).toEqual({ items: [entry], nextBefore: 7 });
    expect(GuestbookListResponseSchema.parse({ items: [], nextBefore: null })).toEqual({ items: [], nextBefore: null });
    expect(CreateGuestbookResponseSchema.parse({ entry })).toEqual({ entry });
  });
  it("diagnostics", () => {
    const d = { uptimeSeconds: 1234, startedAt: TS, nodeVersion: "v22.12.0", db: "ok", guestbookCount: 12, activeSessions: 1 };
    expect(DiagnosticsResponseSchema.parse(d)).toEqual(d);
  });
  it("error bodies, one per code", () => {
    for (const code of ERROR_CODES) {
      expect(ApiErrorSchema.safeParse({ error: { code, message: "Something went wrong.", requestId: "abc-123" } }).success).toBe(true);
    }
    const v = { error: { code: "validation_error", message: "Invalid input.", requestId: "r1", details: [{ path: "handle", message: "too short" }] } };
    expect(ApiErrorSchema.parse(v)).toEqual(v);
  });
});

describe("responses are additive-friendly but exact on required fields", () => {
  it("ignores unknown response fields", () => {
    const parsed = GuestbookEntrySchema.parse({ ...entry, future: "field" });
    expect(parsed).toEqual(entry);
  });
  it("requires every field", () => {
    for (const k of Object.keys(entry)) {
      const { [k as keyof typeof entry]: _omit, ...rest } = entry;
      expect(bad(GuestbookEntrySchema, rest)).toBe(false);
    }
  });
});

describe("responses reject invalid data", () => {
  it("timestamps must be ISO-8601 UTC with milliseconds", () => {
    for (const createdAt of [
      "2026-09-21",
      "2026-09-21T17:00:00Z",
      "2026-09-21T17:00:00.000+02:00",
      "2026-09-21T17:00:00.000",
      "2026-13-40T17:00:00.000Z",
      "yesterday",
      "",
      1758474000000,
      null,
    ]) {
      expect(bad(GuestbookEntrySchema, { ...entry, createdAt })).toBe(false);
    }
  });
  it("entry ids must be positive integers", () => {
    for (const id of [0, -1, 1.5, "7", null, Number.NaN, Infinity]) {
      expect(bad(GuestbookEntrySchema, { ...entry, id })).toBe(false);
    }
  });
  it("entries must satisfy the handle and message rules", () => {
    expect(bad(GuestbookEntrySchema, { ...entry, handle: "a" })).toBe(false);
    expect(bad(GuestbookEntrySchema, { ...entry, handle: "<b>" })).toBe(false);
    expect(bad(GuestbookEntrySchema, { ...entry, message: "line1\nline2" })).toBe(false);
    expect(bad(GuestbookEntrySchema, { ...entry, message: "x".repeat(281) })).toBe(false);
  });
  it("list: nextBefore must be a positive int or null, items an array", () => {
    for (const nextBefore of [0, -1, "7", undefined, 1.5]) {
      expect(bad(GuestbookListResponseSchema, { items: [], nextBefore })).toBe(false);
    }
    expect(bad(GuestbookListResponseSchema, { items: entry, nextBefore: null })).toBe(false);
    expect(bad(GuestbookListResponseSchema, { items: [{ ...entry, id: 0 }], nextBefore: null })).toBe(false);
  });
  it("user role must be operator; me.user must be present (null when anonymous)", () => {
    expect(bad(UserSchema, { username: "x", role: "admin" })).toBe(false);
    expect(bad(UserSchema, { username: "", role: "operator" })).toBe(false);
    expect(bad(MeResponseSchema, {})).toBe(false);
    expect(bad(LoginResponseSchema, { user: null })).toBe(false);
  });
  it("health: status must be ok, time must be a timestamp", () => {
    const h = { status: "ok", version: "0.1.0", contract: "1.0", time: TS };
    expect(bad(HealthResponseSchema, { ...h, status: "degraded" })).toBe(false);
    expect(bad(HealthResponseSchema, { ...h, time: "now" })).toBe(false);
    expect(bad(HealthResponseSchema, { ...h, version: "" })).toBe(false);
  });
  it("diagnostics: counts are non-negative integers, db is ok", () => {
    const d = { uptimeSeconds: 1, startedAt: TS, nodeVersion: "v22", db: "ok", guestbookCount: 0, activeSessions: 0 };
    expect(bad(DiagnosticsResponseSchema, d)).toBe(true);
    expect(bad(DiagnosticsResponseSchema, { ...d, uptimeSeconds: -1 })).toBe(false);
    expect(bad(DiagnosticsResponseSchema, { ...d, guestbookCount: 1.5 })).toBe(false);
    expect(bad(DiagnosticsResponseSchema, { ...d, activeSessions: "1" })).toBe(false);
    expect(bad(DiagnosticsResponseSchema, { ...d, db: "down" })).toBe(false);
  });
  it("errors: unknown code, missing requestId, and details on a non-validation error are rejected", () => {
    const base = { code: "not_found", message: "Not found.", requestId: "r1" };
    expect(bad(ApiErrorSchema, { error: { ...base, code: "teapot" } })).toBe(false);
    expect(bad(ApiErrorSchema, { error: { code: "not_found", message: "x" } })).toBe(false);
    expect(bad(ApiErrorSchema, { error: { ...base, message: "" } })).toBe(false);
    expect(bad(ApiErrorSchema, { error: { ...base, details: [{ path: "a", message: "b" }] } })).toBe(false);
    expect(bad(ApiErrorSchema, { error: { ...base, code: "validation_error", details: [{ path: "a" }] } })).toBe(false);
    expect(bad(ApiErrorSchema, base)).toBe(false);
  });
});

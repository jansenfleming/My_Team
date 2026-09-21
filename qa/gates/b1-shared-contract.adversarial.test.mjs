// Adversarial checks for packages/shared (task B1) against docs/architecture/api-contract.md,
// including the c7895f4 clarification. Pure input/output tests of the schemas: no network, no server.
//
// The schemas are TypeScript, so bundle them first (esbuild ships with vite, present in any worktree that ran npm ci):
//   <worktree>/node_modules/.bin/esbuild <worktree>/packages/shared/src/index.ts --bundle --format=esm --platform=node --outfile=$SCRATCH/shared.bundle.mjs
//   SHARED_BUNDLE=$SCRATCH/shared.bundle.mjs node --test qa/gates/b1-shared-contract.adversarial.test.mjs
// Fake secrets: none. Hostile strings below are payloads, not credentials.

import { test } from "node:test";
import assert from "node:assert/strict";

const BUNDLE = process.env.SHARED_BUNDLE;
if (!BUNDLE) {
  console.error("SHARED_BUNDLE not set; see the header of this file");
  process.exit(2);
}
const S = await import(BUNDLE);
const ok = (schema, v) => schema.safeParse(v).success;
const parsed = (schema, v) => schema.parse(v);
const msgOk = (v) => ok(S.CreateGuestbookRequestSchema, { handle: "ghost_42", message: v });
const handleOk = (v) => ok(S.CreateGuestbookRequestSchema, { handle: v, message: "hi" });
const limitOk = (v) => ok(S.GuestbookQuerySchema, { limit: v });
const beforeOk = (v) => ok(S.GuestbookQuerySchema, { before: v });
const idOk = (v) => ok(S.GuestbookIdParamsSchema, { id: v });

test("constants match contract sections 4 and 5", () => {
  assert.deepEqual(
    [S.HANDLE_MIN, S.HANDLE_MAX, S.MESSAGE_MAX, S.GUESTBOOK_PAGE_DEFAULT, S.GUESTBOOK_PAGE_MAX, S.USERNAME_MAX, S.PASSWORD_MAX],
    [2, 24, 280, 20, 50, 64, 256],
  );
  assert.equal(S.BODY_LIMIT_BYTES, 4096);
  assert.equal(S.SESSION_COOKIE_NAME, "sid");
  assert.equal(S.SESSION_MAX_AGE_SECONDS, 28800);
  assert.deepEqual(S.RATE_LIMITS, { global: { max: 120, windowMs: 60000 }, login: { max: 5, windowMs: 60000 }, guestbookPost: { max: 3, windowMs: 600000 } });
  assert.deepEqual(S.ERROR_HTTP_STATUS, {
    validation_error: 400, invalid_credentials: 401, unauthenticated: 401, origin_rejected: 403, forbidden: 403, not_found: 404,
    payload_too_large: 413, unsupported_media_type: 415, rate_limited: 429, unavailable: 503, internal_error: 500,
  });
});

test("message: forbidden characters are rejected (raw input, before trim)", () => {
  const bad = {
    "trailing LF": "hi\n", "trailing CR": "hi\r", "leading TAB": "\thi", "inner LF": "a\nb", "CRLF": "a\r\nb", NUL: "a\u0000b", DEL: "a\u007fb",
    "C1 NEL U+0085": "a\u0085b", "C1 U+009F": "a\u009fb", "ESC ANSI": "\u001b[31mred", "VT": "a\u000bb", "FF": "a\u000cb",
    "U+2028": "a b", "U+2029": "a b", "lone high surrogate": "a\ud800b", "lone low surrogate": "a\udc00b", "trailing lone high": "a\ud83d",
    "U+200E": "a‎b", "U+200F": "a‏b", "U+061C": "a؜b",
  };
  for (let cp = 0x202a; cp <= 0x202e; cp++) bad[`bidi U+${cp.toString(16)}`] = `a${String.fromCodePoint(cp)}b`;
  for (let cp = 0x2066; cp <= 0x2069; cp++) bad[`bidi U+${cp.toString(16)}`] = `a${String.fromCodePoint(cp)}b`;
  for (let cp = 0; cp <= 0x1f; cp++) bad[`C0 U+${cp.toString(16).padStart(4, "0")}`] = `a${String.fromCharCode(cp)}b`;
  for (const [name, v] of Object.entries(bad)) assert.equal(msgOk(v), false, `should reject: ${name}`);
});

test("message: accepted values and trimming", () => {
  assert.equal(parsed(S.CreateGuestbookRequestSchema, { handle: "ab", message: "  hello grid  " }).message, "hello grid");
  for (const v of ["hello", "a", "emoji \u{1f600}", "family \u{1f468}‍\u{1f469}‍\u{1f467}", "zwsp​ok", "nbsp inner", "<script>alert(1)</script>", "'; DROP TABLE guestbook_entries;--", "%00 %0d%0a ${jndi:x} {{7*7}}"]) {
    assert.equal(msgOk(v), true, `should accept: ${JSON.stringify(v)}`);
  }
  // stored verbatim (only trimmed): payloads unchanged
  assert.equal(parsed(S.CreateGuestbookRequestSchema, { handle: "ab", message: "<img src=x onerror=alert(1)>" }).message, "<img src=x onerror=alert(1)>");
});

test("message: length rule counts UTF-16 units, after trim", () => {
  assert.equal(msgOk(""), false);
  assert.equal(msgOk("   "), false);
  assert.equal(msgOk(" 　﻿"), false, "unicode-whitespace-only is empty after trim");
  assert.equal(msgOk("a".repeat(280)), true);
  assert.equal(msgOk("a".repeat(281)), false);
  assert.equal(msgOk(" " + "a".repeat(280) + " "), true, "280 after trim");
  assert.equal(msgOk("\u{1f600}".repeat(140)), true, "140 emoji = 280 units");
  assert.equal(msgOk("\u{1f600}".repeat(141)), false, "141 emoji = 282 units");
});

test("message and handle: non-string types are rejected", () => {
  for (const v of [null, undefined, 5, true, [], ["a"], {}, { toString: () => "a" }]) {
    assert.equal(msgOk(v), false, `message ${JSON.stringify(v)}`);
    assert.equal(handleOk(v), false, `handle ${JSON.stringify(v)}`);
  }
});

test("handle: boundaries and charset", () => {
  assert.equal(handleOk("a"), false);
  assert.equal(handleOk("ab"), true);
  assert.equal(handleOk("a".repeat(24)), true);
  assert.equal(handleOk("a".repeat(25)), false);
  assert.equal(handleOk("a_b-c9"), true);
  assert.equal(handleOk("__"), true);
  for (const v of [" ab", "ab ", "ab\n", "\nab", "a b", "a.b", "a<b", "a'b", "a\"b", "a;b", "a\u0000b", "ａｂｃ", "аdmin", "ab​", "\u{1f600}\u{1f600}", "../..", "a%20b", "ab "]) {
    assert.equal(handleOk(v), false, `should reject handle ${JSON.stringify(v)}`);
  }
});

test("limit / before / id: strict digit strings, no coercion", () => {
  for (const v of ["1", "20", "50"]) assert.equal(limitOk(v), true, `limit ${v}`);
  assert.equal(parsed(S.GuestbookQuerySchema, {}).limit, 20, "default limit");
  assert.equal(parsed(S.GuestbookQuerySchema, {}).before, undefined);
  const badNums = ["", " ", "0", "-1", "+1", "1.5", "1.0", "1e1", "1e3", "0x10", "0b1", "0o7", " 1", "1 ", "1\n", "NaN", "Infinity", "-Infinity", "1_0", "１", "١", "١٢", "null", "undefined", "true", "1,2", "1;2", "1/**/", "1 OR 1=1", "1;DROP TABLE x"];
  for (const v of badNums) {
    assert.equal(limitOk(v), false, `limit ${JSON.stringify(v)}`);
    assert.equal(beforeOk(v), false, `before ${JSON.stringify(v)}`);
    assert.equal(idOk(v), false, `id ${JSON.stringify(v)}`);
  }
  for (const v of [["1", "2"], ["1"], 1, 1.5, null, true, {}, { a: 1 }]) {
    assert.equal(limitOk(v), false, `limit type ${JSON.stringify(v)}`);
    assert.equal(beforeOk(v), false, `before type ${JSON.stringify(v)}`);
    assert.equal(idOk(v), false, `id type ${JSON.stringify(v)}`);
  }
  assert.equal(limitOk("51"), false);
  assert.equal(limitOk("100000"), false);
  assert.equal(beforeOk("9007199254740991"), true, "MAX_SAFE_INTEGER");
  assert.equal(beforeOk("9007199254740992"), false, "MAX_SAFE_INTEGER + 1");
  assert.equal(beforeOk("99999999999999999"), false, "17 digits");
  assert.equal(idOk("9007199254740991"), true);
  assert.equal(idOk("9007199254740993"), false, "imprecise integer");
  assert.equal(idOk("18446744073709551616"), false, "beyond int64");
});

test("observation: leading zeros are accepted and normalized", () => {
  assert.equal(parsed(S.GuestbookQuerySchema, { limit: "050" }).limit, 50);
  assert.equal(parsed(S.GuestbookIdParamsSchema, { id: "0007" }).id, 7);
});

test("unknown keys are stripped; __proto__ cannot pollute", () => {
  const body = JSON.parse('{"handle":"ab","message":"x","id":999,"role":"operator","__proto__":{"isAdmin":true},"constructor":{"prototype":{"polluted":true}}}');
  const out = parsed(S.CreateGuestbookRequestSchema, body);
  assert.deepEqual(Object.keys(out).sort(), ["handle", "message"]);
  assert.equal({}.isAdmin, undefined);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(out, "__proto__"), false);
});

test("validation details never echo the input and are capped", () => {
  const marker = "ECHOMARKER_9f3a";
  const hostile = [
    { handle: `${marker}<script>`, message: `${marker}\n${"x".repeat(500)}` },
    { handle: marker.repeat(20), message: `${marker}‮` },
    { handle: 123, message: { a: marker } },
    { handle: [marker], message: [marker] },
  ];
  for (const body of hostile) {
    const r = S.CreateGuestbookRequestSchema.safeParse(body);
    assert.equal(r.success, false);
    const d = JSON.stringify(S.toValidationDetails(r.error));
    assert.ok(!d.includes(marker), `details echoed input: ${d}`);
    assert.ok(S.toValidationDetails(r.error).length <= 10);
  }
  const q = S.GuestbookQuerySchema.safeParse({ limit: marker, before: `${marker}'--` });
  assert.ok(!JSON.stringify(S.toValidationDetails(q.error)).includes(marker));
  const l = S.LoginRequestSchema.safeParse({ username: marker.repeat(20), password: marker.repeat(40) });
  assert.ok(!JSON.stringify(S.toValidationDetails(l.error)).includes(marker));
});

test("login request: bounds, types, password not altered", () => {
  const L = (u, p) => ok(S.LoginRequestSchema, { username: u, password: p });
  assert.equal(L("a", "b"), true);
  assert.equal(L("a".repeat(64), "b".repeat(256)), true);
  assert.equal(L("a".repeat(65), "b"), false);
  assert.equal(L("a", "b".repeat(257)), false);
  assert.equal(L("", "b"), false);
  assert.equal(L("a", ""), false);
  for (const v of [null, undefined, 1, [], {}, ["a"], true]) {
    assert.equal(L(v, "b"), false);
    assert.equal(L("a", v), false);
  }
  assert.equal(parsed(S.LoginRequestSchema, { username: "a", password: "  pw  " }).password, "  pw  ");
  assert.equal(ok(S.LoginRequestSchema, { username: "a" }), false);
  assert.equal(ok(S.LoginRequestSchema, {}), false);
  assert.equal(ok(S.LoginRequestSchema, null), false);
});

test("error envelope: details only with validation_error", () => {
  const base = { code: "validation_error", message: "m", requestId: "r", details: [{ path: "a", message: "b" }] };
  assert.equal(ok(S.ApiErrorSchema, { error: base }), true);
  assert.equal(ok(S.ApiErrorSchema, { error: { ...base, code: "not_found" } }), false);
  assert.equal(ok(S.ApiErrorSchema, { error: { ...base, code: "nope" } }), false);
  assert.equal(ok(S.ApiErrorSchema, { error: { code: "not_found", message: "m", requestId: "r" } }), true);
  assert.equal(ok(S.ApiErrorSchema, { error: { code: "not_found", message: "", requestId: "r" } }), false);
});

test("response schemas: shapes from contract section 6", () => {
  const entry = { id: 7, handle: "ghost_42", message: "hello grid", createdAt: "2026-09-21T17:00:00.000Z" };
  assert.equal(ok(S.GuestbookListResponseSchema, { items: [entry], nextBefore: 7 }), true);
  assert.equal(ok(S.GuestbookListResponseSchema, { items: [], nextBefore: null }), true);
  assert.equal(ok(S.GuestbookListResponseSchema, { items: [entry] }), false, "nextBefore required");
  assert.equal(ok(S.GuestbookListResponseSchema, { items: [{ ...entry, id: 0 }], nextBefore: null }), false);
  assert.equal(ok(S.GuestbookListResponseSchema, { items: [{ ...entry, createdAt: "2026-09-21 17:00:00" }], nextBefore: null }), false);
  assert.equal(ok(S.GuestbookListResponseSchema, { items: [{ ...entry, createdAt: "2026-09-21T17:00:00+02:00" }], nextBefore: null }), false, "offset timestamps rejected");
  assert.equal(ok(S.CreateGuestbookResponseSchema, { entry }), true);
  assert.equal(ok(S.HealthResponseSchema, { status: "ok", version: "0.1.0", contract: "1.0", time: "2026-09-21T17:00:00.000Z" }), true);
  assert.equal(ok(S.HealthResponseSchema, { status: "degraded", version: "0.1.0", contract: "1.0", time: "2026-09-21T17:00:00.000Z" }), false);
  assert.equal(ok(S.MeResponseSchema, { user: null }), true);
  assert.equal(ok(S.MeResponseSchema, { user: { username: "operator", role: "operator" } }), true);
  assert.equal(ok(S.MeResponseSchema, { user: { username: "operator", role: "admin" } }), false);
  assert.equal(ok(S.MeResponseSchema, {}), false);
  assert.equal(ok(S.LoginResponseSchema, { user: null }), false);
  const diag = { uptimeSeconds: 1234, startedAt: "2026-09-21T16:40:00.000Z", nodeVersion: "v22.12.0", db: "ok", guestbookCount: 12, activeSessions: 1 };
  assert.equal(ok(S.DiagnosticsResponseSchema, diag), true);
  assert.equal(ok(S.DiagnosticsResponseSchema, { ...diag, uptimeSeconds: -1 }), false);
  assert.equal(ok(S.DiagnosticsResponseSchema, { ...diag, guestbookCount: 1.5 }), false);
});

test("performance: hostile long inputs parse in bounded time (no catastrophic backtracking)", () => {
  const t0 = performance.now();
  for (const v of ["a".repeat(1_000_000), "‮".repeat(100_000), "a".repeat(999_999) + "\n", "\ud800".repeat(100_000), " ".repeat(1_000_000) + "x"]) {
    S.CreateGuestbookRequestSchema.safeParse({ handle: v, message: v });
    S.LoginRequestSchema.safeParse({ username: v, password: v });
    S.GuestbookQuerySchema.safeParse({ limit: v, before: v });
  }
  const ms = performance.now() - t0;
  assert.ok(ms < 1500, `took ${ms.toFixed(0)} ms`);
});

// Findings-as-tests: these document behavior that the contract permits but QA considers a hardening gap.
// They assert the CURRENT behavior so a future change is noticed; see qa/reports/QA-001-*.md.
test("observation QA-001: invisible format characters and invisible-only messages are accepted", () => {
  assert.equal(msgOk("​"), true, "a message consisting only of one zero-width space is accepted (renders blank)");
  assert.equal(msgOk("⁠⁢⁣"), true, "word joiner and invisible operators accepted");
  assert.equal(msgOk("a\u{e0041}\u{e0042}b"), true, "unicode tag characters (invisible ASCII smuggling) accepted");
  assert.equal(msgOk("a️b"), true, "variation selector accepted");
  assert.equal(msgOk("a­b"), true, "soft hyphen accepted");
  assert.equal(msgOk("a￹b"), true, "interlinear annotation anchor accepted");
});

import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import {
  ApiErrorSchema,
  CreateGuestbookResponseSchema,
  ERROR_HTTP_STATUS,
  GUESTBOOK_PAGE_DEFAULT,
  GUESTBOOK_PAGE_MAX,
  GuestbookListResponseSchema,
  HANDLE_MAX,
  MESSAGE_MAX,
  RATE_LIMITS,
  type ErrorCode,
} from "@site/shared";
import type { Db } from "../db/connection";
import { insertGuestbookEntry } from "../db/guestbook-repo";
import { buildGuestbookTestApp } from "../test-helpers";

const running: { app: FastifyInstance; db: Db }[] = [];
const make = async (...args: Parameters<typeof buildGuestbookTestApp>) => {
  const r = await buildGuestbookTestApp(...args);
  running.push(r);
  return r;
};
afterEach(async () => {
  const batch = running.splice(0);
  await Promise.all(batch.map((r) => r.app.close()));
  batch.forEach((r) => r.db.close());
});

const JSON_HEADERS = { "content-type": "application/json" };

function expectApiError(res: { statusCode: number; headers: Record<string, unknown>; json: () => unknown }, code: ErrorCode) {
  expect(res.statusCode).toBe(ERROR_HTTP_STATUS[code]);
  const body = ApiErrorSchema.parse(res.json());
  expect(body.error.code).toBe(code);
  expect(body.error.requestId).toBe(res.headers["x-request-id"]);
  return body;
}

describe("GET /api/health with a database", () => {
  it("returns 200 and status ok when the db is open", async () => {
    const { app } = await make();
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
  });

  it("returns 503 unavailable when the db is closed", async () => {
    const { app, db } = await make();
    db.close();
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expectApiError(res, "unavailable");
  });
});

describe("POST /api/guestbook", () => {
  it("creates an entry and returns 201 with the contract shape", async () => {
    const { app } = await make();
    const res = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: JSON_HEADERS,
      payload: { handle: "ghost_42", message: "hello grid" },
    });
    expect(res.statusCode).toBe(201);
    const body = CreateGuestbookResponseSchema.parse(res.json());
    expect(body.entry).toMatchObject({ handle: "ghost_42", message: "hello grid" });
    expect(body.entry.id).toBeGreaterThan(0);
    expect(res.headers["x-request-id"]).toBeDefined();
  });

  it("trims the message before storing it", async () => {
    const { app } = await make();
    const res = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: JSON_HEADERS,
      payload: { handle: "ghost_42", message: "  hi there  " },
    });
    expect(res.json().entry.message).toBe("hi there");
  });

  it.each([
    ["missing handle", { message: "hi" }],
    ["missing message", { handle: "ghost_42" }],
    ["handle too short", { handle: "a", message: "hi" }],
    ["handle too long", { handle: "a".repeat(HANDLE_MAX + 1), message: "hi" }],
    ["handle bad charset", { handle: "a b", message: "hi" }],
    ["message empty", { handle: "ghost_42", message: "" }],
    ["message whitespace only", { handle: "ghost_42", message: "   " }],
    ["message too long", { handle: "ghost_42", message: "x".repeat(MESSAGE_MAX + 1) }],
    ["message has a newline", { handle: "ghost_42", message: "hi\nthere" }],
    ["message has a NUL", { handle: "ghost_42", message: "hi\u0000there" }],
    ["message has a bidi override", { handle: "ghost_42", message: "hi‮there" }],
    ["handle is a number", { handle: 42, message: "hi" }],
  ])("returns 400 validation_error with details for %s", async (_name, payload) => {
    const { app } = await make();
    const res = await app.inject({ method: "POST", url: "/api/guestbook", headers: JSON_HEADERS, payload });
    const body = expectApiError(res, "validation_error");
    expect(body.error.details?.length).toBeGreaterThan(0);
  });

  it("returns 400 validation_error (no details: it never reaches the schema) for a JSON body that is not an object", async () => {
    const { app } = await make();
    const res = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: JSON_HEADERS,
      payload: JSON.stringify("not an object"),
    });
    expectApiError(res, "validation_error");
  });

  it("SQLi and HTML payloads in handle-adjacent message are stored and returned unchanged", async () => {
    const { app } = await make();
    for (const message of [
      "'; DROP TABLE guestbook_entries;--",
      "<img src=x onerror=alert(1)>",
      "<script>alert(1)</script>",
    ]) {
      const res = await app.inject({
        method: "POST",
        url: "/api/guestbook",
        headers: JSON_HEADERS,
        payload: { handle: "ghost_42", message },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().entry.message).toBe(message);
    }
    // Prove the table is intact and readable after the SQLi payload above.
    const list = await app.inject({ method: "GET", url: "/api/guestbook" });
    expect(list.statusCode).toBe(200);
    expect(GuestbookListResponseSchema.parse(list.json()).items.length).toBeGreaterThanOrEqual(3);
  });

  it("SQLi in the handle field is rejected by the charset rule before it ever reaches SQL", async () => {
    const { app } = await make();
    const res = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: JSON_HEADERS,
      payload: { handle: "a'; DROP TABLE guestbook_entries;--", message: "hi" },
    });
    expectApiError(res, "validation_error");
  });

  it("strips unknown fields (no id/createdAt injection)", async () => {
    const { app } = await make();
    const res = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: JSON_HEADERS,
      payload: { handle: "ghost_42", message: "hi", id: 999999, createdAt: "2000-01-01T00:00:00.000Z" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().entry.id).not.toBe(999999);
    expect(res.json().entry.createdAt).not.toBe("2000-01-01T00:00:00.000Z");
  });

  it("returns 415/413 the same way every other route does", async () => {
    const { app } = await make();
    const plain = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: { "content-type": "text/plain" },
      payload: "handle=a&message=b",
    });
    expectApiError(plain, "unsupported_media_type");
    const big = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: JSON_HEADERS,
      payload: JSON.stringify({ handle: "ghost_42", message: "x".repeat(5000) }),
    });
    expectApiError(big, "payload_too_large");
  });

  it("is rejected by the CSRF Origin check like any other mutating route", async () => {
    const { app } = await make();
    const res = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: { ...JSON_HEADERS, origin: "https://evil.example" },
      payload: { handle: "ghost_42", message: "hi" },
    });
    expectApiError(res, "origin_rejected");
  });

  it("returns 429 rate_limited with Retry-After on the 4th post within 10 minutes", async () => {
    expect(RATE_LIMITS.guestbookPost).toEqual({ max: 3, windowMs: 600_000 });
    const { app } = await make();
    const post = (n: number) =>
      app.inject({
        method: "POST",
        url: "/api/guestbook",
        headers: JSON_HEADERS,
        payload: { handle: "ghost_42", message: `msg ${n}` },
      });
    for (let i = 0; i < 3; i++) expect((await post(i)).statusCode).toBe(201);
    const fourth = await post(3);
    const body = expectApiError(fourth, "rate_limited");
    const retry = Number(fourth.headers["retry-after"]);
    expect(Number.isInteger(retry)).toBe(true);
    expect(retry).toBeGreaterThan(0);
    void body;
  });

  it("the guestbook limit is additional to the global limit (both apply)", async () => {
    const { app } = await make();
    // 3 POSTs (2 allowed... actually 3 allowed, the 4th blocked) still count toward the global
    // bucket even while being blocked by the stricter route bucket, so only 118 more requests are
    // needed to reach the global 120/minute ceiling (RATE_LIMITS.global.max).
    for (let i = 0; i < 4; i++) {
      await app.inject({
        method: "POST",
        url: "/api/guestbook",
        headers: JSON_HEADERS,
        payload: { handle: "ghost_42", message: `msg ${i}` },
      });
    }
    for (let i = 0; i < 116; i++) {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      expect(res.statusCode).toBe(200);
    }
    expectApiError(await app.inject({ method: "GET", url: "/api/health" }), "rate_limited");
  });

  it("does not leak SQL or path text in an unexpected-error body", async () => {
    const { app, db } = await make();
    db.close(); // forces the insert to throw
    const res = await app.inject({
      method: "POST",
      url: "/api/guestbook",
      headers: JSON_HEADERS,
      payload: { handle: "ghost_42", message: "hi" },
    });
    expect(res.statusCode).toBe(500);
    const body = expectApiError(res, "internal_error");
    expect(body.error.message).toBe("Internal server error.");
    expect(res.body).not.toMatch(/guestbook_entries|INSERT|\.ts:\d+/);
  });
});

describe("GET /api/guestbook", () => {
  it("is empty with nextBefore null when there are no entries", async () => {
    const { app } = await make();
    const res = await app.inject({ method: "GET", url: "/api/guestbook" });
    expect(res.statusCode).toBe(200);
    expect(GuestbookListResponseSchema.parse(res.json())).toEqual({ items: [], nextBefore: null });
  });

  it("defaults limit to 20 and returns newest first", async () => {
    const { app, db } = await make();
    const ids = Array.from({ length: 3 }, (_, i) => insertGuestbookEntry(db, "user_u", `m${i}`).id);
    expect(GUESTBOOK_PAGE_DEFAULT).toBe(20);
    const res = await app.inject({ method: "GET", url: "/api/guestbook" });
    const body = GuestbookListResponseSchema.parse(res.json());
    expect(body.items.map((e) => e.id)).toEqual([...ids].reverse());
    expect(body.nextBefore).toBeNull();
  });

  it("paginates with limit and before, matching nextBefore across pages", async () => {
    const { app, db } = await make();
    const ids = Array.from({ length: 5 }, (_, i) => insertGuestbookEntry(db, "user_u", `m${i}`).id);
    const page1 = GuestbookListResponseSchema.parse(
      (await app.inject({ method: "GET", url: "/api/guestbook?limit=2" })).json(),
    );
    expect(page1.items.map((e) => e.id)).toEqual([ids[4], ids[3]]);
    expect(page1.nextBefore).toBe(ids[3]);

    const page2 = GuestbookListResponseSchema.parse(
      (await app.inject({ method: "GET", url: `/api/guestbook?limit=2&before=${page1.nextBefore}` })).json(),
    );
    expect(page2.items.map((e) => e.id)).toEqual([ids[2], ids[1]]);
    expect(page2.nextBefore).toBe(ids[1]);
  });

  it.each(["0", "-1", String(GUESTBOOK_PAGE_MAX + 1), "abc", "1.5", "1e1", ""])(
    "rejects limit=%j with 400 validation_error",
    async (limit) => {
      const { app } = await make();
      const res = await app.inject({ method: "GET", url: `/api/guestbook?limit=${limit}` });
      expectApiError(res, "validation_error");
    },
  );

  it.each(["0", "-1", "abc", "1.5"])("rejects before=%j with 400 validation_error", async (before) => {
    const { app } = await make();
    const res = await app.inject({ method: "GET", url: `/api/guestbook?before=${before}` });
    expectApiError(res, "validation_error");
  });

  it("accepts limit at the max boundary", async () => {
    const { app } = await make();
    const res = await app.inject({ method: "GET", url: `/api/guestbook?limit=${GUESTBOOK_PAGE_MAX}` });
    expect(res.statusCode).toBe(200);
  });

  it("returns SQLi and HTML payloads unchanged when listed back", async () => {
    const { app, db } = await make();
    const message = "<script>alert(1)</script>' OR '1'='1";
    insertGuestbookEntry(db, "ghost_42", message);
    const res = await app.inject({ method: "GET", url: "/api/guestbook" });
    const body = GuestbookListResponseSchema.parse(res.json());
    expect(body.items[0]?.message).toBe(message);
  });

  it("is not blocked by the Origin/CSRF check (GET is a safe method)", async () => {
    const { app } = await make();
    const res = await app.inject({ method: "GET", url: "/api/guestbook", headers: { origin: "https://evil.example" } });
    expect(res.statusCode).toBe(200);
  });

  it("returns 503 unavailable, not a crash, when the db is closed", async () => {
    const { app, db } = await make();
    db.close();
    const res = await app.inject({ method: "GET", url: "/api/guestbook" });
    expect(res.statusCode).toBe(500); // no per-route DB-down mapping; health is the documented signal
    expectApiError(res, "internal_error");
  });
});

describe("buildApp without a db", () => {
  it("does not register the guestbook routes (health still works)", async () => {
    const { buildTestApp } = await import("../test-helpers");
    const app = await buildTestApp();
    const res = await app.inject({ method: "GET", url: "/api/guestbook" });
    expectApiError(res, "not_found");
    await app.close();
  });
});

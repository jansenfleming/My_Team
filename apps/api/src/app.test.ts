import { readFileSync } from "node:fs";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import {
  ApiErrorSchema,
  BODY_LIMIT_BYTES,
  CONTRACT_VERSION,
  ERROR_HTTP_STATUS,
  HealthResponseSchema,
  RATE_LIMITS,
  type ErrorCode,
} from "@site/shared";
import { buildApp } from "./app";
import { buildTestApp, testConfig } from "./test-helpers";
import { APP_VERSION } from "./version";

const apps: FastifyInstance[] = [];
const make = async (...args: Parameters<typeof buildTestApp>) => {
  const app = await buildTestApp(...args);
  apps.push(app);
  return app;
};
afterEach(async () => {
  await Promise.all(apps.splice(0).map((a) => a.close()));
});

const JSON_HEADERS = { "content-type": "application/json" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Assert a response is a contract error: status, body shape, requestId equals the header. */
function expectApiError(res: { statusCode: number; headers: Record<string, unknown>; json: () => unknown }, code: ErrorCode) {
  expect(res.statusCode).toBe(ERROR_HTTP_STATUS[code]);
  expect(String(res.headers["content-type"])).toContain("application/json");
  const body = ApiErrorSchema.parse(res.json());
  expect(body.error.code).toBe(code);
  expect(body.error.requestId).toBe(res.headers["x-request-id"]);
  // Only the four documented keys, and never a stack, path or SQL.
  expect(Object.keys(body.error).sort()).toEqual(code === "validation_error" && body.error.details ? ["code", "details", "message", "requestId"] : ["code", "message", "requestId"]);
  const text = JSON.stringify(body);
  expect(text).not.toMatch(/at\s+\S+\s+\(|node_modules|\/etc\/passwd|SELECT|\.ts:\d+/);
  return body;
}

describe("GET /api/health", () => {
  it("returns the contract body", async () => {
    const app = await make();
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(String(res.headers["content-type"])).toContain("application/json");
    const body = HealthResponseSchema.parse(res.json());
    expect(body).toMatchObject({ status: "ok", version: "0.1.0", contract: "1.0" });
    expect(Object.keys(body).sort()).toEqual(["contract", "status", "time", "version"]);
    expect(Math.abs(Date.parse(body.time) - Date.now())).toBeLessThan(5_000);
  });

  it("reports the package version and contract version", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
    expect(APP_VERSION).toBe(pkg.version);
    expect(CONTRACT_VERSION).toBe("1.0");
  });

  it("answers HEAD too", async () => {
    const app = await make();
    const res = await app.inject({ method: "HEAD", url: "/api/health" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("");
  });

  it("returns 503 unavailable when a dependency check fails, returns false or throws", async () => {
    for (const check of [() => false, () => Promise.resolve(false), () => { throw new Error("db path /var/secret.db locked"); }]) {
      const app = await make({}, { healthChecks: [check] });
      const res = await app.inject({ method: "GET", url: "/api/health" });
      expectApiError(res, "unavailable");
      expect(res.body).not.toContain("secret.db");
    }
  });

  it("is 200 when every dependency check passes", async () => {
    const app = await make({}, { healthChecks: [() => true, async () => true] });
    expect((await app.inject({ method: "GET", url: "/api/health" })).statusCode).toBe(200);
  });
});

describe("X-Request-Id", () => {
  it("is a fresh uuid on every response", async () => {
    const app = await make();
    const a = await app.inject({ method: "GET", url: "/api/health" });
    const b = await app.inject({ method: "GET", url: "/api/health" });
    expect(a.headers["x-request-id"]).toMatch(UUID);
    expect(b.headers["x-request-id"]).toMatch(UUID);
    expect(a.headers["x-request-id"]).not.toBe(b.headers["x-request-id"]);
  });

  it("ignores a client-supplied X-Request-Id (no log or response injection)", async () => {
    const app = await make();
    const res = await app.inject({ method: "GET", url: "/api/health", headers: { "x-request-id": "evil\r\nX-Injected: 1" } });
    expect(res.headers["x-request-id"]).toMatch(UUID);
    expect(res.headers["x-injected"]).toBeUndefined();
  });

  it("is on success and 404 responses (expectApiError also checks it on every other error test)", async () => {
    const app = await make();
    for (const url of ["/api/health", "/api/nope"]) {
      const res = await app.inject({ method: "GET", url });
      expect(res.headers["x-request-id"]).toMatch(UUID);
    }
  });
});

describe("security headers", () => {
  it("sets helmet headers and a locked-down CSP on success and error responses", async () => {
    const app = await make();
    for (const url of ["/api/health", "/api/nope"]) {
      const h = (await app.inject({ method: "GET", url })).headers;
      expect(h["content-security-policy"]).toBe("default-src 'none';frame-ancestors 'none'");
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["referrer-policy"]).toBe("no-referrer");
      expect(h["cross-origin-resource-policy"]).toBe("same-origin");
      expect(h["cross-origin-opener-policy"]).toBe("same-origin");
      expect(h["strict-transport-security"]).toBeDefined();
    }
  });

  it("never sends X-Powered-By or Server", async () => {
    const app = await make();
    const h = (await app.inject({ method: "GET", url: "/api/health" })).headers;
    expect(h["x-powered-by"]).toBeUndefined();
    expect(h["server"]).toBeUndefined();
  });

  it("sends no CORS headers, even for a preflight or a foreign Origin", async () => {
    const app = await make();
    const cases = [
      { method: "GET" as const, url: "/api/health", headers: { origin: "http://localhost:5173" } },
      { method: "GET" as const, url: "/api/health", headers: { origin: "https://evil.example" } },
      { method: "OPTIONS" as const, url: "/api/health", headers: { origin: "http://localhost:5173", "access-control-request-method": "POST" } },
    ];
    for (const c of cases) {
      const res = await app.inject(c);
      expect(Object.keys(res.headers).filter((k) => k.startsWith("access-control-"))).toEqual([]);
    }
  });
});

describe("unknown routes", () => {
  it.each(["GET", "POST", "PUT", "PATCH", "DELETE"] as const)("%s /api/does-not-exist -> 404 not_found", async (method) => {
    const app = await make();
    const res = await app.inject({ method, url: "/api/does-not-exist", ...(method === "GET" ? {} : { headers: JSON_HEADERS, payload: "{}" }) });
    expectApiError(res, "not_found");
  });

  it("does not echo the path in the body", async () => {
    const app = await make();
    const res = await app.inject({ method: "GET", url: "/api/%3Cscript%3Ealert(1)%3C/script%3E?x=SECRETQ" });
    expectApiError(res, "not_found");
    expect(res.body).not.toContain("script");
    expect(res.body).not.toContain("SECRETQ");
  });

  it("returns 404 for a wrong method on a known path", async () => {
    const app = await make();
    expectApiError(await app.inject({ method: "POST", url: "/api/health", headers: JSON_HEADERS, payload: "{}" }), "not_found");
  });

  it("returns a contract error (not a raw framework body) for a malformed URL", async () => {
    const app = await make();
    const res = await app.inject({ method: "GET", url: "/api/%E0%A4%A" });
    expectApiError(res, "validation_error");
    expect(res.headers["x-request-id"]).toMatch(UUID);
  });
});

describe("request body handling", () => {
  it("accepts a JSON body up to the limit and echoes it", async () => {
    const app = await make();
    const res = await app.inject({ method: "POST", url: "/api/_test/echo", headers: JSON_HEADERS, payload: { a: 1 } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ received: { a: 1 } });
  });

  it("accepts a POST with no body and no content-type (idempotent endpoints like logout)", async () => {
    const app = await make();
    const res = await app.inject({ method: "POST", url: "/api/_test/echo" });
    expect(res.statusCode).toBe(200);
  });

  it("returns 413 payload_too_large above 4 KB", async () => {
    const app = await make();
    expect(BODY_LIMIT_BYTES).toBe(4096);
    const payload = JSON.stringify({ pad: "x".repeat(BODY_LIMIT_BYTES) });
    const res = await app.inject({ method: "POST", url: "/api/_test/echo", headers: JSON_HEADERS, payload });
    expectApiError(res, "payload_too_large");
  });

  it("accepts a body just under the limit and rejects one just over", async () => {
    const app = await make();
    const wrap = (n: number) => JSON.stringify({ p: "x".repeat(n) });
    const overhead = wrap(0).length;
    const ok = await app.inject({ method: "POST", url: "/api/_test/echo", headers: JSON_HEADERS, payload: wrap(BODY_LIMIT_BYTES - overhead) });
    expect(ok.statusCode).toBe(200);
    const over = await app.inject({ method: "POST", url: "/api/_test/echo", headers: JSON_HEADERS, payload: wrap(BODY_LIMIT_BYTES - overhead + 1) });
    expectApiError(over, "payload_too_large");
  });

  it("returns 413 for an oversize body regardless of the declared Content-Length", async () => {
    const app = await make();
    const res = await app.inject({
      method: "POST",
      url: "/api/_test/echo",
      headers: { ...JSON_HEADERS, "content-length": "10" },
      payload: JSON.stringify({ pad: "x".repeat(6000) }),
    });
    expectApiError(res, "payload_too_large");
  });

  it.each(["text/plain", "application/x-www-form-urlencoded", "multipart/form-data; boundary=x", "application/xml", "text/html"])(
    "returns 415 unsupported_media_type for %s",
    async (type) => {
      const app = await make();
      const res = await app.inject({ method: "POST", url: "/api/_test/echo", headers: { "content-type": type }, payload: "a=b" });
      expectApiError(res, "unsupported_media_type");
    },
  );

  it("returns 415 for a body sent without any content-type", async () => {
    const app = await make();
    const res = await app.inject({ method: "POST", url: "/api/_test/echo", payload: '{"a":1}', headers: { "content-type": "" } });
    expectApiError(res, "unsupported_media_type");
  });

  it("returns 400 validation_error for malformed JSON without echoing it", async () => {
    const app = await make();
    const res = await app.inject({ method: "POST", url: "/api/_test/echo", headers: JSON_HEADERS, payload: '{"a": "SECRET<script>' });
    expectApiError(res, "validation_error");
    expect(res.body).not.toContain("SECRET");
    expect(res.body).not.toContain("script");
  });

  it("returns 400 for an empty body sent as JSON", async () => {
    const app = await make();
    expectApiError(await app.inject({ method: "POST", url: "/api/_test/echo", headers: JSON_HEADERS, payload: "" }), "validation_error");
  });

  it("rejects prototype-pollution payloads with 400 validation_error", async () => {
    const app = await make();
    for (const payload of ['{"__proto__":{"admin":true}}', '{"a":{"__proto__":{"admin":true}}}', '{"constructor":{"prototype":{"admin":true}}}']) {
      const res = await app.inject({ method: "POST", url: "/api/_test/echo", headers: JSON_HEADERS, payload });
      expectApiError(res, "validation_error");
    }
    expect(({} as Record<string, unknown>).admin).toBeUndefined();
  });

  it("formats zod errors thrown by a route as validation_error with details and no echo", async () => {
    const app = await make();
    const res = await app.inject({
      method: "POST",
      url: "/api/_test/validate",
      headers: JSON_HEADERS,
      payload: { handle: "a<script>SECRET", message: "hi\nthere" },
    });
    const body = expectApiError(res, "validation_error");
    expect(body.error.details?.map((d) => d.path).sort()).toEqual(["handle", "message"]);
    expect(res.body).not.toContain("SECRET");
    expect(res.body).not.toContain("script");
    const ok = await app.inject({ method: "POST", url: "/api/_test/validate", headers: JSON_HEADERS, payload: { handle: "ghost_42", message: " hello " } });
    expect(ok.json()).toEqual({ handle: "ghost_42", message: "hello" });
  });
});

describe("unexpected errors", () => {
  it("returns a generic 500 internal_error with no message, stack, path or SQL", async () => {
    const app = await make();
    const res = await app.inject({ method: "GET", url: "/api/_test/boom" });
    const body = expectApiError(res, "internal_error");
    expect(body.error.message).toBe("Internal server error.");
    expect(res.body).not.toContain("secret");
  });
});

describe("Origin / Sec-Fetch-Site check (CSRF layer 2)", () => {
  const post = (app: FastifyInstance, headers: Record<string, string>, method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST") =>
    app.inject({ method, url: "/api/_test/echo", headers: method === "POST" ? { ...JSON_HEADERS, ...headers } : headers, ...(method === "POST" ? { payload: "{}" } : {}) });

  it("allows mutating requests with no Origin (curl, tests)", async () => {
    const app = await make();
    expect((await post(app, {})).statusCode).toBe(200);
  });

  it.each(["http://localhost:5173", "http://127.0.0.1:5173"])("allows Origin %s", async (origin) => {
    const app = await make();
    expect((await post(app, { origin })).statusCode).toBe(200);
  });

  it.each([
    "https://evil.example",
    "http://localhost:5174",
    "http://localhost",
    "https://localhost:5173",
    "http://localhost:5173.evil.example",
    "http://evil.example/http://localhost:5173",
    "http://LOCALHOST:5173",
    "http://localhost:5173/",
    "null",
    "*",
    "file://",
    "",
  ])("rejects Origin %j with 403 origin_rejected", async (origin) => {
    const app = await make();
    expectApiError(await post(app, { origin }), "origin_rejected");
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"] as const)("checks %s", async (method) => {
    const app = await make();
    expectApiError(await post(app, { origin: "https://evil.example" }, method), "origin_rejected");
    expect((await post(app, { origin: "http://localhost:5173" }, method)).statusCode).toBe(200);
  });

  it("rejects Sec-Fetch-Site: cross-site even with an allowed Origin or none", async () => {
    const app = await make();
    expectApiError(await post(app, { "sec-fetch-site": "cross-site" }), "origin_rejected");
    expectApiError(await post(app, { "sec-fetch-site": "Cross-Site", origin: "http://localhost:5173" }), "origin_rejected");
  });

  it("allows same-origin, same-site and none for Sec-Fetch-Site", async () => {
    const app = await make();
    for (const v of ["same-origin", "same-site", "none"]) {
      expect((await post(app, { "sec-fetch-site": v, origin: "http://localhost:5173" })).statusCode).toBe(200);
    }
  });

  it("does not restrict safe methods (GET/HEAD/OPTIONS)", async () => {
    const app = await make();
    for (const method of ["GET", "HEAD"] as const) {
      const res = await app.inject({ method, url: "/api/health", headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" } });
      expect(res.statusCode).toBe(200);
    }
  });

  it("also rejects on unknown routes (the check runs before routing)", async () => {
    const app = await make();
    const res = await app.inject({ method: "POST", url: "/api/nope", headers: { ...JSON_HEADERS, origin: "https://evil.example" }, payload: "{}" });
    expectApiError(res, "origin_rejected");
  });

  it("uses WEB_ORIGIN from config", async () => {
    const app = await make({ webOrigins: ["https://site.example"] });
    expect((await post(app, { origin: "https://site.example" })).statusCode).toBe(200);
    expectApiError(await post(app, { origin: "http://localhost:5173" }), "origin_rejected");
  });
});

describe("global rate limit (120 requests / minute per IP)", () => {
  it("returns 429 rate_limited with Retry-After on the 121st request", async () => {
    const app = await make();
    expect(RATE_LIMITS.global.max).toBe(120);
    for (let i = 0; i < 120; i++) {
      const res = await app.inject({ method: "GET", url: "/api/health" });
      expect(res.statusCode).toBe(200);
    }
    const res = await app.inject({ method: "GET", url: "/api/health" });
    expectApiError(res, "rate_limited");
    const retry = Number(res.headers["retry-after"]);
    expect(Number.isInteger(retry)).toBe(true);
    expect(retry).toBeGreaterThanOrEqual(1);
    expect(retry).toBeLessThanOrEqual(60);
  });

  it("counts unknown routes and origin-rejected requests too", async () => {
    const app = await make();
    for (let i = 0; i < 60; i++) await app.inject({ method: "GET", url: "/api/nope" });
    for (let i = 0; i < 60; i++) {
      await app.inject({ method: "POST", url: "/api/_test/echo", headers: { ...JSON_HEADERS, origin: "https://evil.example" }, payload: "{}" });
    }
    expectApiError(await app.inject({ method: "GET", url: "/api/health" }), "rate_limited");
  });

  it("keys on the socket IP and ignores X-Forwarded-For unless TRUST_PROXY=true", async () => {
    const app = await make({ trustProxy: false });
    for (let i = 0; i < 120; i++) await app.inject({ method: "GET", url: "/api/health", headers: { "x-forwarded-for": `10.0.0.${i}` } });
    expectApiError(await app.inject({ method: "GET", url: "/api/health", headers: { "x-forwarded-for": "10.9.9.9" } }), "rate_limited");
  });

  it("with TRUST_PROXY=true, different forwarded clients get separate buckets", async () => {
    const app = await make({ trustProxy: true });
    for (let i = 0; i < 120; i++) await app.inject({ method: "GET", url: "/api/health", headers: { "x-forwarded-for": "10.0.0.1" } });
    expectApiError(await app.inject({ method: "GET", url: "/api/health", headers: { "x-forwarded-for": "10.0.0.1" } }), "rate_limited");
    expect((await app.inject({ method: "GET", url: "/api/health", headers: { "x-forwarded-for": "10.0.0.2" } })).statusCode).toBe(200);
  });

  it("gives each app instance its own counters", async () => {
    const a = await make();
    for (let i = 0; i < 121; i++) await a.inject({ method: "GET", url: "/api/health" });
    const b = await make();
    expect((await b.inject({ method: "GET", url: "/api/health" })).statusCode).toBe(200);
  });
});

describe("buildApp", () => {
  it("returns an instance that is not listening (inject only)", async () => {
    const app = await buildApp(testConfig());
    apps.push(app);
    expect(app.server.listening).toBe(false);
  });
});

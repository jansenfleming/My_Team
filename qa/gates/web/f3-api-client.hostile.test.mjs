// Hostile-response and leak checks for the F3 API client (feat/api-client). fetch is a local fake: no network is used.
// Cases: non-JSON, empty and off-contract bodies map to a network-style ApiError (A-CON-2 consumer side, QA-003 shape),
// no password or body text leaks into errors or console, timeout and abort behave, path/query safety.
import { afterEach, describe, expect, it, vi } from "vitest";

const WEB = process.env.QA_WEB_DIR;
const { createApiClient } = await import(`${WEB}/src/api/client.ts`);
const { ApiError } = await import(`${WEB}/src/api/errors.ts`);

const MARK = "BODYMARKER_f3_77";
const PW = "Pa55-QAFAKE-f3";

function res(status, body, headers = {}) {
  const h = new Headers(headers);
  const text = body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, headers: h, text: async () => text };
}
const client = (fetchImpl, extra = {}) => createApiClient({ fetch: fetchImpl, timeoutMs: 400, ...extra });
const once = (r) => vi.fn(async () => r);
async function fails(promise) {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error("expected a rejection");
}
const ENTRY = { id: 1, handle: "ab", message: "hi", createdAt: "2026-09-21T17:00:00.000Z" };
const CALLS = {
  getHealth: (c) => c.getHealth(),
  login: (c) => c.login("op", PW),
  logout: (c) => c.logout(),
  getMe: (c) => c.getMe(),
  listGuestbook: (c) => c.listGuestbook({ limit: 5 }),
  createGuestbookEntry: (c) => c.createGuestbookEntry({ handle: "ab", message: "hi" }),
  deleteGuestbookEntry: (c) => c.deleteGuestbookEntry(3),
  getDiagnostics: (c) => c.getDiagnostics(),
};

afterEach(() => vi.restoreAllMocks());

describe("non-JSON, empty and off-contract error bodies become network_error and never echo the body", () => {
  const bad = {
    "dev proxy bare 500 text/plain, empty": [500, ""],
    "500 plain text": [500, `Internal ${MARK}`],
    "502 html": [502, `<html><body>${MARK}</body></html>`],
    "504 html": [504, `<h1>${MARK}</h1>`],
    "400 fastify client-error shape (QA-003)": [400, { error: "Bad Request", message: `Client Error ${MARK}`, statusCode: 400 }],
    "431 fastify shape": [431, { error: "Request Header Fields Too Large", message: MARK, statusCode: 431 }],
    "403 unknown code": [403, { error: { code: "totally_new", message: MARK, requestId: "r" } }],
    "403 code not a string": [403, { error: { code: 5, message: MARK } }],
    "403 empty message": [403, { error: { code: "forbidden", message: "" } }],
    "403 message not a string": [403, { error: { code: "forbidden", message: { a: MARK } } }],
    "401 error is an array": [401, { error: [MARK] }],
    "401 top-level array": [401, [MARK]],
    "401 null": [401, "null"],
    "404 number": [404, "42"],
    "429 empty": [429, ""],
    "500 truncated json": [500, `{"error":{"code":"internal_error","message":"${MARK}`],
    "500 json with BOM": [500, `\ufeff{"error":{"code":"internal_error","message":"x","requestId":"r"}}`],
    "302 with body": [302, `moved ${MARK}`],
  };
  for (const [name, [status, body]] of Object.entries(bad)) {
    it(name, async () => {
      for (const [call, fn] of Object.entries(CALLS)) {
        const c = client(once(res(status, body, { "X-Request-Id": "req-from-header" })));
        const e = await fails(fn(c));
        expect(e, `${call}`).toBeInstanceOf(ApiError);
        expect(e.code, `${call} code`).toBe("network_error");
        expect(e.isNetworkFailure).toBe(true);
        expect(String(e.message) + JSON.stringify({ ...e }) + String(e.stack ?? "").split("\n")[0]).not.toContain(MARK);
        expect(e.message).not.toContain(MARK);
        expect(e.status).toBe(status);
        expect(e.details).toBeUndefined();
      }
    });
  }
});

describe("2xx with an unexpected body is a network_error, not a crash or a fake success", () => {
  const badOk = {
    "html": "<!doctype html><title>SPA fallback</title>",
    "empty": "",
    "empty object": {},
    "array": [],
    "null": "null",
    "string": '"ok"',
  };
  for (const [name, body] of Object.entries(badOk)) {
    it(name, async () => {
      for (const call of ["getHealth", "getMe", "listGuestbook", "getDiagnostics", "login", "createGuestbookEntry"]) {
        const e = await fails(CALLS[call](client(once(res(200, body)))));
        expect(e.code, call).toBe("network_error");
        expect(e.status).toBe(200);
      }
    });
  }
  it("wrong field types and roles are rejected", async () => {
    const cases = [
      ["login", { user: { username: "op", role: "admin" } }],
      ["login", { user: { username: 5, role: "operator" } }],
      ["login", { user: null }],
      ["getMe", { user: { username: "op", role: "root" } }],
      ["getMe", {}],
      ["createGuestbookEntry", { entry: { ...ENTRY, id: "1" } }],
      ["createGuestbookEntry", { entry: { ...ENTRY, id: 0 } }],
      ["createGuestbookEntry", { entry: { ...ENTRY, id: 1.5 } }],
      ["listGuestbook", { items: [{ ...ENTRY, message: 5 }], nextBefore: null }],
      ["listGuestbook", { items: [ENTRY], nextBefore: 0 }],
      ["listGuestbook", { items: "x", nextBefore: null }],
      ["listGuestbook", { items: [ENTRY] }],
      ["getHealth", { status: "degraded", version: "1", contract: "1.0", time: "t" }],
      ["getDiagnostics", { uptimeSeconds: -1, startedAt: "t", nodeVersion: "v", db: "ok", guestbookCount: 0, activeSessions: 0 }],
      ["getDiagnostics", { uptimeSeconds: 1, startedAt: "t", nodeVersion: "v", db: "down", guestbookCount: 0, activeSessions: 0 }],
    ];
    for (const [call, body] of cases) {
      const e = await fails(CALLS[call](client(once(res(200, body)))));
      expect(e.code, `${call} ${JSON.stringify(body).slice(0, 50)}`).toBe("network_error");
    }
  });
  it("valid bodies pass, unknown extra fields are ignored, and prototype-poisoned JSON does not pollute", async () => {
    const c = client(once(res(200, `{"user":null,"__proto__":{"polluted":true},"extra":1}`)));
    expect(await c.getMe()).toBeNull();
    expect({}.polluted).toBeUndefined();
    const list = await client(once(res(200, { items: [ENTRY], nextBefore: 1, extra: {} }))).listGuestbook();
    expect(list).toEqual({ items: [ENTRY], nextBefore: 1 });
    expect(await client(once(res(204, undefined))).logout()).toBeUndefined();
    expect(await client(once(res(204, undefined))).deleteGuestbookEntry(9)).toBeUndefined();
  });
});

describe("contract error bodies map faithfully", () => {
  it("keeps code, status, safe message, requestId, Retry-After and details; truncates oversize fields", async () => {
    const body = { error: { code: "rate_limited", message: "M".repeat(500), requestId: "R".repeat(500), details: [{ path: "a", message: "b" }, { path: 1 }, "x", null] } };
    const e = await fails(client(once(res(429, body, { "Retry-After": "60" }))).getHealth());
    expect(e.code).toBe("rate_limited");
    expect(e.status).toBe(429);
    expect(e.retryAfter).toBe(60);
    expect(e.message.length).toBe(200);
    expect(e.requestId.length).toBe(128);
    expect(e.details).toEqual([{ path: "a", message: "b" }]);
    expect(e.isNetworkFailure).toBe(false);
  });
  it("Retry-After only accepts up to 7 digits; other forms are ignored", async () => {
    for (const [v, want] of [["60", 60], [" 5 ", 5], ["-1", undefined], ["abc", undefined], ["1e3", undefined], ["Wed, 21 Oct 2015 07:28:00 GMT", undefined], ["99999999", undefined], ["", undefined], ["0x10", undefined]]) {
      const e = await fails(client(once(res(429, { error: { code: "rate_limited", message: "m", requestId: "r" } }, { "Retry-After": v }))).getHealth());
      expect(e.retryAfter, JSON.stringify(v)).toBe(want);
    }
  });
  it("uses the X-Request-Id header when the body has none, and truncates it", async () => {
    const e = await fails(client(once(res(500, { error: { code: "internal_error", message: "m" } }, { "X-Request-Id": "H".repeat(300) }))).getHealth());
    expect(e.requestId).toBe("H".repeat(128));
    const e2 = await fails(client(once(res(500, "boom", { "X-Request-Id": "abc" }))).getHealth());
    expect(e2.requestId).toBe("abc");
    expect(e2.code).toBe("network_error");
  });
});

describe("no password, body or underlying error text leaks", () => {
  it("login: password only in the JSON body; not in URL, headers, ApiError, or console; fetch errors are swallowed", async () => {
    const spies = ["log", "info", "warn", "error", "debug"].map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const seen = [];
    const fetchImpl = vi.fn(async (url, init) => {
      seen.push({ url, init });
      throw new TypeError(`fetch failed for ${url} with body ${init.body} ${PW}`);
    });
    const e = await fails(client(fetchImpl).login("op", PW));
    expect(e.code).toBe("network_error");
    const dump = e.message + JSON.stringify({ ...e }) + e.stack + String(e.cause ?? "");
    expect(dump).not.toContain(PW);
    expect(dump).not.toContain("fetch failed");
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe("/api/auth/login");
    expect(seen[0].init.method).toBe("POST");
    expect(seen[0].init.credentials).toBe("same-origin");
    expect(seen[0].init.cache).toBe("no-store");
    expect(JSON.parse(seen[0].init.body)).toEqual({ username: "op", password: PW });
    expect(Object.keys(seen[0].init.headers).sort()).toEqual(["Accept", "Content-Type"]);
    for (const spy of spies) expect(JSON.stringify(spy.mock.calls)).not.toContain(PW);
    // server-side failures too
    for (const r of [res(401, { error: { code: "invalid_credentials", message: "Invalid username or password.", requestId: "r" } }), res(500, `echo ${PW}`), res(200, `{"echo":"${PW}"}`)]) {
      const err = await fails(client(once(r)).login("op", PW));
      expect(err.message + JSON.stringify({ ...err }) + err.stack).not.toContain(PW);
    }
    for (const spy of spies) expect(JSON.stringify(spy.mock.calls)).not.toContain(PW);
  });
  it("requests carry no cookies or credentials of their own and GETs have no body or Content-Type", async () => {
    const f = once(res(200, { user: null }));
    await client(f).getMe();
    const init = f.mock.calls[0][1];
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Accept: "application/json" });
    expect(init.credentials).toBe("same-origin");
  });
});

describe("path and query safety", () => {
  it("deleteGuestbookEntry only accepts positive safe integers and never calls fetch otherwise", async () => {
    const f = vi.fn();
    const c = client(f);
    for (const id of [0, -1, 1.5, NaN, Infinity, -Infinity, 2 ** 53, 1e21, "1", "1/../../admin/diagnostics", "1?x=y", null, undefined, {}, [], true]) {
      const e = await fails(c.deleteGuestbookEntry(id));
      expect(e.code, String(id)).toBe("validation_error");
    }
    expect(f).not.toHaveBeenCalled();
    const ok = vi.fn(async () => res(204, undefined));
    await client(ok).deleteGuestbookEntry(12);
    expect(ok.mock.calls[0][0]).toBe("/api/admin/guestbook/12");
    expect(ok.mock.calls[0][1].method).toBe("DELETE");
  });
  it("list query values are URL-encoded; a smuggled string cannot add parameters or change the path", async () => {
    const f = vi.fn(async () => res(200, { items: [], nextBefore: null }));
    const c = client(f);
    await c.listGuestbook({ limit: 5, before: 9 });
    expect(f.mock.calls[0][0]).toBe("/api/guestbook?limit=5&before=9");
    await c.listGuestbook({ limit: "5&admin=1#x", before: "../x" });
    const url = f.mock.calls[1][0];
    expect(url.startsWith("/api/guestbook?")).toBe(true);
    expect(url).not.toMatch(/&admin=1/);
    expect(url).not.toContain("#");
    await c.listGuestbook();
    expect(f.mock.calls[2][0]).toBe("/api/guestbook");
  });
});

describe("timeout and abort", () => {
  it("timeout when fetch never settles, when fetch ignores the signal, and when the body read stalls", async () => {
    const hang = () => new Promise(() => {});
    let e = await fails(createApiClient({ fetch: hang, timeoutMs: 80 }).getHealth());
    expect(e.code).toBe("timeout");
    expect(e.isNetworkFailure).toBe(true);
    const stall = async () => ({ ok: true, status: 200, headers: new Headers(), text: () => new Promise(() => {}) });
    e = await fails(createApiClient({ fetch: stall, timeoutMs: 80 }).getHealth());
    expect(e.code).toBe("timeout");
  });
  it("external abort gives 'aborted'; a pre-aborted signal never calls fetch; abort after completion is harmless", async () => {
    const f = vi.fn(() => new Promise(() => {}));
    const ctrl = new AbortController();
    const p = fails(createApiClient({ fetch: f, timeoutMs: 5000 }).getHealth({ signal: ctrl.signal }));
    setTimeout(() => ctrl.abort(), 20);
    expect((await p).code).toBe("aborted");
    const pre = new AbortController();
    pre.abort();
    const g = vi.fn();
    expect((await fails(createApiClient({ fetch: g }).getHealth({ signal: pre.signal }))).code).toBe("aborted");
    expect(g).not.toHaveBeenCalled();
    const okc = new AbortController();
    const c = client(once(res(200, { status: "ok", version: "1", contract: "1.0", time: "t" })));
    await c.getHealth({ signal: okc.signal });
    okc.abort();
  });
  it("a late rejection after timeout does not become an unhandled rejection", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const late = () => new Promise((_r, rej) => setTimeout(() => rej(new Error(PW)), 150));
    const e = await fails(createApiClient({ fetch: late, timeoutMs: 40 }).getHealth());
    expect(e.code).toBe("timeout");
    await new Promise((r) => setTimeout(r, 250));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
  it("huge and deeply nested bodies do not crash the client", async () => {
    const big = "x".repeat(5_000_000);
    expect((await fails(client(once(res(500, big))).getHealth())).code).toBe("network_error");
    const deep = "[".repeat(50_000) + "]".repeat(50_000);
    expect((await fails(client(once(res(500, deep))).getHealth())).code).toBe("network_error");
    expect((await fails(client(once(res(200, deep))).getHealth())).code).toBe("network_error");
  });
});

// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "./client";
import type { ApiClient } from "./client";
import { ApiError } from "./errors";

const ENTRY = { id: 7, handle: "ghost_42", message: "hello grid", createdAt: "2026-09-21T17:00:00.000Z" };
const USER = { username: "operator", role: "operator" } as const;

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}
function apiError(code: string, status: number, extra: Record<string, unknown> = {}, headers: Record<string, string> = {}): Response {
  return json({ error: { code, message: `generic ${code}`, requestId: "req-123", ...extra } }, status, headers);
}

function setup(respond: () => Response | Promise<Response>, options: { timeoutMs?: number } = {}) {
  const fetchMock: FetchMock = vi.fn<typeof fetch>(async () => respond());
  const client: ApiClient = createApiClient({ fetch: fetchMock, ...options });
  const lastCall = () => {
    const call = fetchMock.mock.calls.at(-1);
    if (!call) throw new Error("fetch was not called");
    return { url: String(call[0]), init: call[1] ?? {} };
  };
  return { client, fetchMock, lastCall };
}

const failure = async (promise: Promise<unknown>): Promise<ApiError> => {
  try {
    await promise;
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    return e as ApiError;
  }
  throw new Error("expected the call to reject");
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("requests", () => {
  it("getHealth: GET /api/health, same-origin credentials, no-store, JSON accept, no body", async () => {
    const health = { status: "ok", version: "0.1.0", contract: "1.0", time: "2026-09-21T17:00:00.000Z" };
    const { client, lastCall } = setup(() => json(health));
    expect(await client.getHealth()).toEqual(health);
    const { url, init } = lastCall();
    expect(url).toBe("/api/health");
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("same-origin");
    expect(init.cache).toBe("no-store");
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  it("login: POST JSON body to /api/auth/login, returns the user, keeps the password out of the URL", async () => {
    const { client, lastCall } = setup(() => json({ user: USER }));
    expect(await client.login("operator", "p@ss w0rd/&?")).toEqual(USER);
    const { url, init } = lastCall();
    expect(url).toBe("/api/auth/login");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Accept: "application/json", "Content-Type": "application/json" });
    expect(JSON.parse(String(init.body))).toEqual({ username: "operator", password: "p@ss w0rd/&?" });
    expect(url).not.toContain("w0rd");
  });

  it("logout: POST with no body and no content type, resolves on 204", async () => {
    const { client, lastCall } = setup(() => new Response(null, { status: 204 }));
    await expect(client.logout()).resolves.toBeUndefined();
    const { url, init } = lastCall();
    expect(url).toBe("/api/auth/logout");
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  it("getMe: returns the user, or null when anonymous", async () => {
    expect(await setup(() => json({ user: USER })).client.getMe()).toEqual(USER);
    const anonymous = setup(() => json({ user: null }));
    expect(await anonymous.client.getMe()).toBeNull();
    expect(anonymous.lastCall().url).toBe("/api/auth/me");
  });

  it("listGuestbook: no params, then limit and before", async () => {
    const page = { items: [ENTRY], nextBefore: 7 };
    const { client, lastCall } = setup(() => json(page));
    expect(await client.listGuestbook()).toEqual(page);
    expect(lastCall().url).toBe("/api/guestbook");
    await client.listGuestbook({ limit: 5, before: 40 });
    expect(lastCall().url).toBe("/api/guestbook?limit=5&before=40");
    await client.listGuestbook({ before: 9 });
    expect(lastCall().url).toBe("/api/guestbook?before=9");
  });

  it("listGuestbook: accepts nextBefore null and an empty page", async () => {
    const { client } = setup(() => json({ items: [], nextBefore: null }));
    expect(await client.listGuestbook()).toEqual({ items: [], nextBefore: null });
  });

  it("createGuestbookEntry: POST only handle and message, returns the entry (201)", async () => {
    const { client, lastCall } = setup(() => json({ entry: ENTRY }, 201));
    const extra = { handle: "ghost_42", message: "hello grid", id: 999 } as { handle: string; message: string };
    expect(await client.createGuestbookEntry(extra)).toEqual(ENTRY);
    const { url, init } = lastCall();
    expect(url).toBe("/api/guestbook");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ handle: "ghost_42", message: "hello grid" });
  });

  it("createGuestbookEntry: sends text exactly as given (the server is the authority on characters)", async () => {
    const message = "<img src=x onerror=alert(1)> '; DROP TABLE x;-- ‮";
    const { client, lastCall } = setup(() => json({ entry: { ...ENTRY, message } }, 201));
    const created = await client.createGuestbookEntry({ handle: "ghost_42", message });
    expect(JSON.parse(String(lastCall().init.body)).message).toBe(message);
    expect(created.message).toBe(message);
  });

  it("deleteGuestbookEntry: DELETE /api/admin/guestbook/:id, resolves on 204", async () => {
    const { client, lastCall } = setup(() => new Response(null, { status: 204 }));
    await expect(client.deleteGuestbookEntry(7)).resolves.toBeUndefined();
    expect(lastCall().url).toBe("/api/admin/guestbook/7");
    expect(lastCall().init.method).toBe("DELETE");
  });

  it("deleteGuestbookEntry: refuses ids that are not positive integers before any request is made", async () => {
    const { client, fetchMock } = setup(() => new Response(null, { status: 204 }));
    for (const bad of [0, -1, 1.5, Number.NaN, Infinity, 2 ** 60, "../auth/logout" as unknown as number, "7/../8" as unknown as number]) {
      const err = await failure(client.deleteGuestbookEntry(bad));
      expect(err.code).toBe("validation_error");
      expect(err.status).toBe(0);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("getDiagnostics: GET /api/admin/diagnostics", async () => {
    const diagnostics = {
      uptimeSeconds: 1234,
      startedAt: "2026-09-21T16:40:00.000Z",
      nodeVersion: "v22.12.0",
      db: "ok",
      guestbookCount: 12,
      activeSessions: 1,
    };
    const { client, lastCall } = setup(() => json(diagnostics));
    expect(await client.getDiagnostics()).toEqual(diagnostics);
    expect(lastCall().url).toBe("/api/admin/diagnostics");
  });

  it("ignores unknown response fields (additive contract)", async () => {
    const { client } = setup(() => json({ user: { ...USER, future: 1 }, extra: true }));
    expect(await client.getMe()).toMatchObject(USER);
  });
});

describe("server errors (contract error format)", () => {
  const table: [string, number][] = [
    ["validation_error", 400],
    ["invalid_credentials", 401],
    ["unauthenticated", 401],
    ["origin_rejected", 403],
    ["forbidden", 403],
    ["not_found", 404],
    ["payload_too_large", 413],
    ["unsupported_media_type", 415],
    ["rate_limited", 429],
    ["unavailable", 503],
    ["internal_error", 500],
  ];
  it.each(table)("maps %s (%i) to an ApiError with the server's code, message and requestId", async (code, status) => {
    const { client } = setup(() => apiError(code, status));
    const err = await failure(client.getMe());
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
    expect(err.message).toBe(`generic ${code}`);
    expect(err.requestId).toBe("req-123");
    expect(err.retryAfter).toBeUndefined();
    expect(err.isNetworkFailure).toBe(false);
  });

  it("400 validation_error carries details", async () => {
    const details = [{ path: "handle", message: "handle must be 2 to 24 characters" }];
    const { client } = setup(() => apiError("validation_error", 400, { details }));
    const err = await failure(client.createGuestbookEntry({ handle: "x", message: "hi" }));
    expect(err.code).toBe("validation_error");
    expect(err.details).toEqual(details);
  });

  it("401 invalid_credentials on login", async () => {
    const { client } = setup(() => apiError("invalid_credentials", 401));
    const err = await failure(client.login("operator", "wrong"));
    expect([err.code, err.status]).toEqual(["invalid_credentials", 401]);
  });

  it("401 unauthenticated on an admin call", async () => {
    const { client } = setup(() => apiError("unauthenticated", 401));
    const err = await failure(client.getDiagnostics());
    expect([err.code, err.status]).toEqual(["unauthenticated", 401]);
  });

  it("403 origin_rejected and 404 not_found on delete", async () => {
    expect((await failure(setup(() => apiError("origin_rejected", 403)).client.deleteGuestbookEntry(3))).code).toBe("origin_rejected");
    expect((await failure(setup(() => apiError("not_found", 404)).client.deleteGuestbookEntry(3))).code).toBe("not_found");
  });

  it("429 rate_limited exposes Retry-After as seconds", async () => {
    const { client } = setup(() => apiError("rate_limited", 429, {}, { "Retry-After": "42" }));
    const err = await failure(client.createGuestbookEntry({ handle: "ghost", message: "hi" }));
    expect(err.code).toBe("rate_limited");
    expect(err.retryAfter).toBe(42);
  });

  it("ignores a Retry-After that is not whole seconds", async () => {
    for (const value of ["soon", "-5", "1.5", "Wed, 21 Oct 2026 07:28:00 GMT", ""]) {
      const { client } = setup(() => apiError("rate_limited", 429, {}, { "Retry-After": value }));
      expect((await failure(client.getMe())).retryAfter).toBeUndefined();
    }
  });

  it("500 internal_error keeps the generic server message and never a stack", async () => {
    const { client } = setup(() => apiError("internal_error", 500));
    const err = await failure(client.getHealth());
    expect(err.code).toBe("internal_error");
    expect(err.message).toBe("generic internal_error");
  });

  it("falls back to the X-Request-Id header when the body has no requestId", async () => {
    const { client } = setup(() => json({ error: { code: "not_found", message: "nope" } }, 404, { "X-Request-Id": "hdr-9" }));
    expect((await failure(client.getMe())).requestId).toBe("hdr-9");
  });

  it("bounds the server message length", async () => {
    const { client } = setup(() => json({ error: { code: "internal_error", message: "m".repeat(5000), requestId: "r" } }, 500));
    expect((await failure(client.getMe())).message.length).toBe(200);
  });
});

describe("non-contract responses become generic network-style errors", () => {
  it("empty 500 text/plain body (the Vite proxy when the API is down)", async () => {
    const { client } = setup(() => new Response("", { status: 500, headers: { "content-type": "text/plain" } }));
    const err = await failure(client.getHealth());
    expect([err.code, err.status]).toEqual(["network_error", 500]);
    expect(err.isNetworkFailure).toBe(true);
    expect(err.requestId).toBeUndefined();
  });

  it("HTML error page from a proxy or server", async () => {
    const { client } = setup(() => new Response("<html><body>Bad Gateway</body></html>", { status: 502, headers: { "content-type": "text/html" } }));
    const err = await failure(client.getMe());
    expect([err.code, err.status]).toEqual(["network_error", 502]);
    expect(err.message).not.toContain("Bad Gateway");
  });

  it("JSON that is not the contract's error shape, or has an unknown code", async () => {
    for (const body of [{ message: "boom" }, { error: "boom" }, { error: { code: "made_up", message: "m", requestId: "r" } }, { error: { code: "not_found", message: "" } }, [], null, "text"]) {
      const { client } = setup(() => json(body, 500));
      expect((await failure(client.getMe())).code).toBe("network_error");
    }
  });

  it("a 2xx response with an HTML or empty body", async () => {
    const html = setup(() => new Response("<!doctype html><title>spa</title>", { status: 200, headers: { "content-type": "text/html" } }));
    expect((await failure(html.client.getMe())).code).toBe("network_error");
    const empty = setup(() => new Response("", { status: 200 }));
    expect((await failure(empty.client.getHealth())).code).toBe("network_error");
  });

  it("a 2xx response with JSON of the wrong shape", async () => {
    expect((await failure(setup(() => json({ status: "ok" })).client.getHealth())).code).toBe("network_error");
    expect((await failure(setup(() => json({ user: { username: 5, role: "operator" } })).client.getMe())).code).toBe("network_error");
    expect((await failure(setup(() => json({ items: [{ id: "1" }], nextBefore: null })).client.listGuestbook())).code).toBe("network_error");
    expect((await failure(setup(() => json({ entry: { id: 0 } }, 201)).client.createGuestbookEntry({ handle: "aa", message: "m" }))).code).toBe("network_error");
    expect((await failure(setup(() => json({ user: { username: "a", role: "root" } })).client.login("a", "b"))).code).toBe("network_error");
  });

  it("a network failure (fetch rejects) is network_error with status 0 and no underlying text", async () => {
    const { client } = setup(() => Promise.reject(new TypeError("Failed to fetch https://internal.example/secret")));
    const err = await failure(client.getMe());
    expect([err.code, err.status]).toEqual(["network_error", 0]);
    expect(err.message).not.toContain("internal.example");
    expect(err.isNetworkFailure).toBe(true);
  });

  it("a body that fails while being read is a network_error", async () => {
    const broken = new Response(new ReadableStream({ start: (c) => c.error(new Error("connection reset")) }), { status: 200 });
    const err = await failure(setup(() => broken).client.getMe());
    expect(err.code).toBe("network_error");
  });
});

describe("timeout and abort", () => {
  /** A fetch that never answers but rejects like the real one when its signal aborts. */
  const abortAware = () =>
    vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );

  it("times out after 8 s by default with code timeout", async () => {
    vi.useFakeTimers();
    const fetchMock = abortAware();
    const client = createApiClient({ fetch: fetchMock });
    const outcome = failure(client.getHealth());
    await vi.advanceTimersByTimeAsync(7999);
    let settled = false;
    void outcome.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const err = await outcome;
    expect([err.code, err.status]).toEqual(["timeout", 0]);
    expect(err.isNetworkFailure).toBe(true);
  });

  it("honours a custom timeout", async () => {
    vi.useFakeTimers();
    const client = createApiClient({ fetch: abortAware(), timeoutMs: 50 });
    const outcome = failure(client.getMe());
    await vi.advanceTimersByTimeAsync(50);
    expect((await outcome).code).toBe("timeout");
  });

  it("times out even when fetch ignores the abort signal and never settles", async () => {
    vi.useFakeTimers();
    const client = createApiClient({ fetch: vi.fn<typeof fetch>(() => new Promise<Response>(() => undefined)), timeoutMs: 10 });
    const outcome = failure(client.getMe());
    await vi.advanceTimersByTimeAsync(10);
    expect((await outcome).code).toBe("timeout");
  });

  it("times out while the response body is still being read", async () => {
    vi.useFakeTimers();
    const stalled = new Response(new ReadableStream({ start: () => undefined }), { status: 200 });
    const client = createApiClient({ fetch: vi.fn<typeof fetch>(async () => stalled), timeoutMs: 10 });
    const outcome = failure(client.getMe());
    await vi.advanceTimersByTimeAsync(10);
    expect((await outcome).code).toBe("timeout");
  });

  it("clears its timer after a normal response", async () => {
    vi.useFakeTimers();
    const client = createApiClient({ fetch: vi.fn<typeof fetch>(async () => json({ user: null })) });
    await client.getMe();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects with code aborted when the caller's signal fires, and cancels the fetch", async () => {
    const fetchMock = abortAware();
    const client = createApiClient({ fetch: fetchMock });
    const controller = new AbortController();
    const outcome = failure(client.getMe({ signal: controller.signal }));
    controller.abort();
    const err = await outcome;
    expect([err.code, err.status]).toEqual(["aborted", 0]);
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it("does not call fetch at all when the signal is already aborted", async () => {
    const { client, fetchMock } = setup(() => json({ user: null }));
    const controller = new AbortController();
    controller.abort();
    expect((await failure(client.getMe({ signal: controller.signal }))).code).toBe("aborted");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("no leaking", () => {
  it("never logs, and errors carry no request or response body or password", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => undefined));
    const password = "correct-horse-battery-staple";
    const outcomes: ApiError[] = [];
    for (const respond of [
      () => apiError("invalid_credentials", 401),
      () => new Response(`echo ${password}`, { status: 500 }),
      () => Promise.reject(new TypeError(`failed ${password}`)),
    ]) {
      const { client } = setup(respond);
      outcomes.push(await failure(client.login("operator", password)));
    }
    for (const err of outcomes) {
      const dump = JSON.stringify({ ...err, message: err.message, stack: err.stack });
      expect(dump).not.toContain(password);
    }
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});

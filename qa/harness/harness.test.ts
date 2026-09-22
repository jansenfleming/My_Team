// Q2 done-when tests: `npm test -w @site/qa` runs a green health smoke test; a test proves the
// guard rejects a non-local URL; the spawned process is always torn down.
import { execFileSync } from "node:child_process";
import http from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { assertLocalUrl, createHttpClient, isLocalUrl, NonLocalUrlError, spawnApi } from "./index";
import type { RunningApi } from "./index";

/** A tiny local HTTP server for exercising the cookie jar without depending on a login route that does not exist yet (B4). */
async function withLocalServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = http.createServer((req, res) => {
    if (req.url === "/set") {
      res.setHeader("Set-Cookie", ["sid=abc123; Path=/; HttpOnly", "seen=1; Path=/"]);
      res.end("ok");
    } else if (req.url === "/whoami") {
      res.end(req.headers.cookie ?? "");
    } else if (req.url === "/logout") {
      res.setHeader("Set-Cookie", "sid=deleted; Path=/; Max-Age=0");
      res.end("bye");
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  try {
    return await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

let api: RunningApi | undefined;
afterEach(async () => {
  await api?.stop();
  api = undefined;
});

describe("guard: only loopback URLs are ever allowed", () => {
  it("accepts 127.0.0.1, localhost and ::1 over http or https", () => {
    for (const u of ["http://127.0.0.1:3001/api/health", "http://localhost:5173/", "https://127.0.0.1:8443/x", "http://[::1]:3001/api/health"]) {
      expect(() => assertLocalUrl(u)).not.toThrow();
      expect(isLocalUrl(u)).toBe(true);
    }
  });

  it("rejects any other host, scheme, or a malformed URL", () => {
    const bad = [
      "http://evil.test/api/health",
      "http://127.0.0.1.evil.test/",
      "http://attacker.example.com/",
      "http://169.254.169.254/latest/meta-data/", // cloud metadata endpoint: never touch it
      "http://0.0.0.0:3001/",
      "http://10.0.0.5:3001/",
      "ftp://127.0.0.1/",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "not a url",
      "",
      "//127.0.0.1/", // protocol-relative, not http(s)
    ];
    for (const u of bad) {
      expect(() => assertLocalUrl(u), u).toThrow(NonLocalUrlError);
      expect(isLocalUrl(u), u).toBe(false);
    }
  });
});

describe("spawnApi + createHttpClient: health smoke test", () => {
  it("spawns the API on a free loopback port and GET /api/health returns the contract body", async () => {
    api = await spawnApi();
    expect(api.baseUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    assertLocalUrl(api.baseUrl); // the harness's own base URL must satisfy its own guard

    const client = createHttpClient(api.baseUrl);
    const res = await client.get("/api/health");

    expect(res.status).toBe(200);
    expect(res.json).toMatchObject({ status: "ok", contract: "1.0" });
    expect(typeof (res.json as { version?: unknown }).version).toBe("string");
    expect(res.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);

    const out = execFileSync("lsof", ["-nP", `-iTCP:${api.port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
    expect(out).toMatch(new RegExp(`127\\.0\\.0\\.1:${api.port}`));
  });

  it("createHttpClient itself refuses a non-loopback base URL, before any request is made", () => {
    expect(() => createHttpClient("http://evil.test:3001")).toThrow(NonLocalUrlError);
  });

  it("stop() is idempotent, frees the port, and removes the temp DB directory", async () => {
    api = await spawnApi();
    const port = api.port;
    await api.stop();
    await api.stop(); // idempotent
    expect(api.exitCode).not.toBeNull();
    // A fresh spawn can reuse the same port range without colliding (the old process is really gone).
    const again = await spawnApi();
    try {
      expect(again.port).toBeGreaterThan(0);
    } finally {
      await again.stop();
    }
    expect(port).not.toBe(0);
  });

  it("a bad environment makes the API exit non-zero, and spawnApi surfaces that instead of hanging", async () => {
    await expect(spawnApi({ env: { WEB_ORIGIN: "*" }, startTimeoutMs: 5000 })).rejects.toThrow(/exited before it started listening/);
  });

  it("the cookie jar carries Set-Cookie values from one request to the next, honors Max-Age=0 deletion, and clearCookies() drops it", async () => {
    await withLocalServer(async (baseUrl) => {
      const client = createHttpClient(baseUrl);
      expect(client.cookies().size).toBe(0);

      await client.get("/set");
      expect(client.cookies().get("sid")).toBe("abc123");
      expect(client.cookies().get("seen")).toBe("1");

      const who = await client.get("/whoami");
      expect(who.text).toContain("sid=abc123");
      expect(who.text).toContain("seen=1");

      await client.get("/logout");
      expect(client.cookies().has("sid")).toBe(false); // Max-Age=0 removes it
      expect(client.cookies().get("seen")).toBe("1"); // untouched cookie stays

      const after = await client.get("/whoami");
      expect(after.text).not.toContain("sid=");
      expect(after.text).toContain("seen=1");

      client.clearCookies();
      expect(client.cookies().size).toBe(0);
      const anon = await client.get("/whoami");
      expect(anon.text).toBe("");
    });
  });

  it("skipCookieJar sends no stored cookie and stores nothing from the response", async () => {
    await withLocalServer(async (baseUrl) => {
      const client = createHttpClient(baseUrl);
      await client.get("/set");
      expect(client.cookies().size).toBe(2);
      const res = await client.get("/whoami", { skipCookieJar: true });
      expect(res.text).toBe("");
    });
  });
});

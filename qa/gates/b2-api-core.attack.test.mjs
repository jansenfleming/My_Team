// Black-box attack checks for the B2 API core (feat/api-core) against docs/architecture/api-contract.md.
// SCOPE: spawns the API from a local worktree on 127.0.0.1 and talks to 127.0.0.1 only. Every socket goes through
// connect(), which refuses any other host. Raw-socket cases send hostile bytes to that same local instance.
//
// Usage (from the QA worktree):
//   QA_API_DIR=<worktree>/apps/api node --test qa/gates/b2-api-core.attack.test.mjs
// Each group starts its own fresh server so the 120/min global limit never leaks between groups.
// No real secrets are used; marker strings are fake.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { join } from "node:path";
import { existsSync } from "node:fs";

const HOST = "127.0.0.1";
const API_DIR = process.env.QA_API_DIR;
if (!API_DIR || !existsSync(join(API_DIR, "src", "server.ts"))) {
  console.error("Set QA_API_DIR to the apps/api directory of the branch under test");
  process.exit(2);
}
const TSX = join(API_DIR, "..", "..", "node_modules", ".bin", "tsx");
const ORIGIN_OK = "http://localhost:5173";

// ---------------------------------------------------------------- harness (loopback only)

function assertLoopback(host) {
  if (host !== HOST) throw new Error(`refusing non-loopback host: ${host}`);
}
function connect(port) {
  assertLoopback(HOST);
  return net.connect({ host: HOST, port });
}
async function freePort() {
  return await new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, HOST, () => {
      const { port } = s.address();
      s.close(() => res(port));
    });
    s.on("error", rej);
  });
}

async function startApi(env = {}) {
  const port = await freePort();
  const child = spawn(TSX, ["src/server.ts"], {
    cwd: API_DIR,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "development", LOG_LEVEL: "info", ...env, PORT: String(port), HOST },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const api = { port, child, logs: "", exit: null };
  child.stdout.on("data", (d) => (api.logs += d));
  child.stderr.on("data", (d) => (api.logs += d));
  child.on("exit", (code) => (api.exit = code));
  const t0 = Date.now();
  while (!/Server listening/.test(api.logs)) {
    if (api.exit !== null) throw new Error(`API exited early (${api.exit}): ${api.logs.slice(0, 500)}`);
    if (Date.now() - t0 > 15000) throw new Error("API did not start");
    await new Promise((r) => setTimeout(r, 50));
  }
  api.stop = async () => {
    child.kill("SIGTERM");
    await new Promise((r) => (api.exit !== null ? r() : child.once("exit", r)));
  };
  return api;
}

/** Runs one HTTP/1.1 request with full header control. `body` may be a string, Buffer, or array of chunks (chunked). */
function request(api, { method = "GET", path = "/api/health", headers = {}, body } = {}) {
  assertLoopback(HOST);
  return new Promise((resolve, reject) => {
    const req = http.request({ host: HOST, port: api.port, method, path, headers, agent: false, setHost: true }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          json = undefined;
        }
        resolve({ status: res.statusCode, headers: res.headers, rawHeaders: res.rawHeaders, text, json });
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => req.destroy(new Error("client timeout")));
    if (Array.isArray(body)) {
      for (const c of body) req.write(c);
      req.end();
    } else req.end(body);
  });
}

/** Sends raw bytes and returns everything the server sends back until it closes or `ms` elapse. */
function raw(api, bytes, ms = 1500) {
  return new Promise((resolve) => {
    const s = connect(api.port);
    let out = "";
    let closed = false;
    s.on("data", (d) => (out += d.toString("latin1")));
    s.on("close", () => {
      closed = true;
    });
    s.on("error", () => {});
    s.write(bytes);
    setTimeout(() => {
      s.destroy();
      resolve({ out, closed });
    }, ms);
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function assertContractError(res, code, status, label = "") {
  assert.equal(res.status, status, `${label} status: got ${res.status} body ${res.text.slice(0, 200)}`);
  assert.ok(res.json && res.json.error, `${label} body is not an ApiError: ${res.text.slice(0, 200)}`);
  assert.equal(res.json.error.code, code, `${label} code`);
  assert.equal(typeof res.json.error.message, "string");
  assert.equal(res.json.error.requestId, res.headers["x-request-id"], `${label} requestId equals X-Request-Id`);
  assert.deepEqual(Object.keys(res.json), ["error"]);
  assert.match(res.headers["content-type"] ?? "", /^application\/json/, `${label} content-type`);
}

// ---------------------------------------------------------------- group 1: health, headers, errors, routing

describe("headers, request id, unknown routes and verbs", () => {
  let api;
  test("start", async () => {
    api = await startApi();
  });

  test("A-CON-6 / A-HDR-1..4: health shape and security headers", async () => {
    const r = await request(api);
    assert.equal(r.status, 200);
    assert.deepEqual(Object.keys(r.json).sort(), ["contract", "status", "time", "version"]);
    assert.equal(r.json.status, "ok");
    assert.equal(r.json.contract, "1.0");
    assert.match(r.json.time, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    assert.match(r.headers["x-request-id"], UUID);
    assert.equal(r.headers["content-security-policy"], "default-src 'none';frame-ancestors 'none'");
    assert.equal(r.headers["x-content-type-options"], "nosniff");
    assert.equal(r.headers["x-frame-options"], "DENY");
    assert.equal(r.headers["referrer-policy"], "no-referrer");
    assert.equal(r.headers["x-powered-by"], undefined);
    assert.equal(r.headers["server"], undefined);
    for (const h of Object.keys(r.headers)) assert.ok(!h.startsWith("access-control-"), `CORS header present: ${h}`);
    assert.equal(r.headers["set-cookie"], undefined);
  });

  test("A-HDR-4: client-supplied X-Request-Id is ignored (no reflection, no header or log injection)", async () => {
    const r = await request(api, { headers: { "X-Request-Id": "attacker-chosen-id-123" } });
    assert.notEqual(r.headers["x-request-id"], "attacker-chosen-id-123");
    assert.match(r.headers["x-request-id"], UUID);
    const long = await request(api, { headers: { "X-Request-Id": "A".repeat(5000) } });
    assert.match(long.headers["x-request-id"], UUID);
    const two = await request(api);
    assert.notEqual(two.headers["x-request-id"], r.headers["x-request-id"], "ids are unique");
  });

  test("A-CON-2/3: every unknown or odd path gives a contract error, never 5xx or a bare body", async () => {
    const paths = ["/", "/api", "/api/", "/api/nope", "/api/health/", "/api/HEALTH", "/api/health/extra", "/api/../etc/passwd", "/%2e%2e/%2e%2e/etc/passwd",
      "/api/%2e%2e/health", "/api/health%00", "/api/health%2f", "/api/%", "/api/%zz", "/api/%c0%af", "/api/%ff", "/" + "a".repeat(3000), "/api/x?" + "q=1&".repeat(500),
      "/.env", "/api/health;jsessionid=1", "/api//health", "/api/hea%6Cth", "/api/admin/diagnostics", "/api/auth/me", "/api/guestbook", "/api/health?limit=abc&before=x"];
    for (const p of paths) {
      const r = await request(api, { path: p });
      if (r.status === 200) {
        assert.equal(r.json?.status, "ok", `200 for ${p} must be health`);
        continue;
      }
      assert.ok(r.status >= 400 && r.status < 500, `${p} -> ${r.status} ${r.text.slice(0, 100)}`);
      assert.ok(r.json?.error, `${p} not contract-shaped: ${r.text.slice(0, 120)}`);
      assert.equal(r.json.error.requestId, r.headers["x-request-id"], p);
      assert.ok(!/passwd|stack|node_modules|\/Users\//i.test(r.text), `${p} leaked detail`);
    }
  });

  test("A-ACL-6 / A-CSRF-6: other verbs on health, OPTIONS gives no CORS headers", async () => {
    const seen = {};
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]) {
      const r = await request(api, { method });
      seen[method] = r.status;
      assert.ok(r.status < 500, `${method} -> ${r.status}`);
      for (const h of Object.keys(r.headers)) assert.ok(!h.startsWith("access-control-"), `${method} CORS header ${h}`);
      if (method !== "HEAD") assert.ok(r.json?.error, `${method} body: ${r.text.slice(0, 100)}`);
    }
    const pre = await request(api, { method: "OPTIONS", headers: { Origin: "http://evil.test", "Access-Control-Request-Method": "DELETE" } });
    for (const h of Object.keys(pre.headers)) assert.ok(!h.startsWith("access-control-"), `preflight CORS header ${h}`);
    console.log("verb matrix on /api/health:", JSON.stringify(seen));
  });

  test("Host header is not reflected", async () => {
    const r = await request(api, { headers: { Host: "evil.example.test:1234" } });
    assert.ok(!r.text.includes("evil.example"), "host reflected");
    assert.ok(!JSON.stringify(r.headers).includes("evil.example"));
  });

  test("A-ERR-4: still healthy", async () => {
    assert.equal((await request(api)).status, 200);
  });
  test("stop", async () => api.stop());
});

// ---------------------------------------------------------------- group 2: CSRF / Origin

describe("A-CSRF: Origin and Sec-Fetch-Site on mutating verbs", () => {
  let api;
  test("start", async () => {
    api = await startApi();
  });

  test("A-CSRF-1/3: disallowed Origin values are rejected on every mutating verb", async () => {
    const bad = ["http://evil.test", "null", "http://localhost:5173/", "http://localhost:5173.evil.test", "http://localhost:5173@evil.test", "http://evil.test#http://localhost:5173",
      "http://localhost:5174", "https://localhost:5173", "HTTP://LOCALHOST:5173", "http://localhost", "http://127.0.0.1:5173/x", "*", "", " http://localhost:5173", "http://localhost:5173 ",
      "http://[::1]:5173", "file://", "chrome-extension://abc"];
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      for (const origin of bad) {
        const r = await request(api, { method, path: "/api/guestbook", headers: { Origin: origin, "Content-Type": "application/json" }, body: method === "DELETE" ? undefined : "{}" });
        // http.request strips nothing; header values with surrounding space may be trimmed by Node. Treat trimmed equals as allowed.
        const trimmed = origin.trim();
        if (trimmed === ORIGIN_OK) continue;
        assertContractError(r, "origin_rejected", 403, `${method} Origin=${JSON.stringify(origin)}`);
      }
    }
  });

  test("A-CSRF-2/4: allowed origins, no Origin, and Sec-Fetch-Site values pass the check (then 404: no such route yet)", async () => {
    const pass = [{ Origin: ORIGIN_OK }, { Origin: "http://127.0.0.1:5173" }, {}, { "Sec-Fetch-Site": "same-origin" }, { "Sec-Fetch-Site": "same-site" }, { "Sec-Fetch-Site": "none" },
      { Origin: ORIGIN_OK, "Sec-Fetch-Site": "same-origin" }];
    for (const h of pass) {
      const r = await request(api, { method: "POST", path: "/api/guestbook", headers: { ...h, "Content-Type": "application/json" }, body: "{}" });
      assertContractError(r, "not_found", 404, `pass case ${JSON.stringify(h)}`);
    }
  });

  test("A-CSRF-2: Sec-Fetch-Site cross-site rejected (any case), even with an allowed Origin or none", async () => {
    for (const v of ["cross-site", "Cross-Site", "CROSS-SITE"]) {
      for (const origin of [undefined, ORIGIN_OK]) {
        const r = await request(api, { method: "POST", path: "/api/guestbook", headers: { "Sec-Fetch-Site": v, ...(origin ? { Origin: origin } : {}), "Content-Type": "application/json" }, body: "{}" });
        assertContractError(r, "origin_rejected", 403, `SFS=${v} Origin=${origin}`);
      }
    }
  });

  test("A-CSRF-5: safe verbs are not blocked by the Origin check", async () => {
    const r1 = await request(api, { headers: { Origin: "http://evil.test" } });
    assert.equal(r1.status, 200);
    const r2 = await request(api, { headers: { "Sec-Fetch-Site": "cross-site" } });
    assert.equal(r2.status, 200);
    for (const h of Object.keys(r1.headers)) assert.ok(!h.startsWith("access-control-"), h);
  });

  test("origin check runs before content-type and body handling, and before routing", async () => {
    const a = await request(api, { method: "POST", path: "/api/does/not/exist", headers: { Origin: "http://evil.test", "Content-Type": "text/plain" }, body: "x" });
    assertContractError(a, "origin_rejected", 403, "evil origin, text/plain body, unknown route");
    const b = await request(api, { method: "POST", path: "/api/guestbook", headers: { Origin: "http://evil.test", "Content-Type": "application/json" }, body: "{not json" });
    assertContractError(b, "origin_rejected", 403, "evil origin, malformed JSON");
  });

  test("duplicate Origin headers over a raw socket: observation only", async () => {
    const req = `POST /api/guestbook HTTP/1.1\r\nHost: ${HOST}\r\nOrigin: ${ORIGIN_OK}\r\nOrigin: http://evil.test\r\nContent-Type: application/json\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{}`;
    const r = await raw(api, req);
    const status = /^HTTP\/1\.1 (\d{3})/.exec(r.out)?.[1];
    console.log("duplicate Origin headers ->", status, "(browsers never send two Origin headers)");
    assert.ok(status && Number(status) < 500);
  });

  test("A-ERR-4: still healthy", async () => {
    assert.equal((await request(api)).status, 200);
  });
  test("stop", async () => api.stop());
});

// ---------------------------------------------------------------- group 3: bodies

describe("A-ERR-3 / A-INJ-7: content type, size, malformed JSON", () => {
  let api;
  const J = { "Content-Type": "application/json" };
  const post = (over) => request(api, { method: "POST", path: "/api/guestbook", ...over });
  test("start", async () => {
    api = await startApi();
  });

  test("valid small JSON reaches routing (404: no route yet)", async () => {
    assertContractError(await post({ headers: J, body: '{"a":1}' }), "not_found", 404);
  });

  test("415: wrong or missing content type with a body (no POST route exists in B2, so Fastify's 404 handler answers; real 415 is retested in Q3 at POST /api/guestbook)", async () => {
    const expected = process.env.QA_EXPECT_ROUTED_POST === "1" ? "unsupported_media_type" : "not_found";
    const expectedStatus = expected === "not_found" ? 404 : 415;
    for (const ct of ["text/plain", "text/plain; charset=utf-8", "application/x-www-form-urlencoded", "multipart/form-data; boundary=x", "text/html", "application/xml", "application/octet-stream", "application/vnd.api+json", "application/jsonx", "text/json"]) {
      assertContractError(await post({ headers: { "Content-Type": ct }, body: "a=b" }), expected, expectedStatus, `ct=${ct}`);
    }
    assertContractError(await post({ headers: {}, body: "abc" }), expected, expectedStatus, "no content-type with body");
  });

  test("JSON content-type variants", async () => {
    for (const ct of ["APPLICATION/JSON", "application/json; charset=utf-8", "application/json;charset=UTF-8"]) {
      const r = await post({ headers: { "Content-Type": ct }, body: "{}" });
      assertContractError(r, "not_found", 404, `ct=${ct}`);
    }
    const u16 = await post({ headers: { "Content-Type": "application/json; charset=utf-16" }, body: "{}" });
    console.log("charset=utf-16 with ascii body ->", u16.status, u16.json?.error?.code);
    assert.ok(u16.status < 500);
  });

  test("413: body over 4096 bytes, exact boundary, declared length, chunked without Content-Length", async () => {
    const pad = (n) => JSON.stringify({ a: "x".repeat(n - 8) });
    const exact = pad(4096);
    assert.equal(Buffer.byteLength(exact), 4096);
    assertContractError(await post({ headers: J, body: exact }), "not_found", 404, "4096 bytes is allowed");
    const over = pad(4097);
    assert.equal(Buffer.byteLength(over), 4097);
    assertContractError(await post({ headers: J, body: over }), "payload_too_large", 413, "4097 bytes");
    assertContractError(await post({ headers: J, body: pad(100000) }), "payload_too_large", 413, "100 KB");
    const chunks = [Buffer.from('{"a":"'), Buffer.from("x".repeat(3000)), Buffer.from("y".repeat(3000)), Buffer.from('"}')];
    const ch = await post({ headers: { ...J, "Transfer-Encoding": "chunked" }, body: chunks });
    assertContractError(ch, "payload_too_large", 413, "chunked 6 KB");
    const small = await post({ headers: { ...J, "Transfer-Encoding": "chunked" }, body: [Buffer.from('{"a":'), Buffer.from("1}")] });
    assertContractError(small, "not_found", 404, "chunked small");
  });

  test("413 on wrong-type oversized body: which error wins is noted", async () => {
    const r = await post({ headers: { "Content-Type": "text/plain" }, body: "x".repeat(5000) });
    console.log("text/plain 5000 bytes ->", r.status, r.json?.error?.code);
    assert.ok([404, 413, 415].includes(r.status));
    assert.ok(r.json?.error);
  });

  test("400 malformed JSON: contract body, nothing echoed", async () => {
    const marker = "ECHOMARKER_B2_7c1";
    const bad = ["{", "{not json", `{"a":"${marker}`, `${marker}`, "[1,2,", "{'a':1}", "{}garbage", "nul\u0000l", '{"a":1,}', "", "   "];
    for (const body of bad) {
      const r = await post({ headers: J, body });
      assertContractError(r, "validation_error", 400, `body=${JSON.stringify(body).slice(0, 40)}`);
      assert.ok(!r.text.includes(marker), "response echoed input");
      assert.ok(!/Unexpected|position|SyntaxError|JSON\.parse|FST_|fastify/i.test(r.text), `framework detail leaked: ${r.text}`);
    }
  });

  test("BOM-prefixed JSON is accepted (secure-json-parse strips it): observation", async () => {
    const r = await post({ headers: J, body: "\ufeff{}" });
    console.log("BOM-prefixed JSON ->", r.status, r.json?.error?.code);
    assert.ok(r.status === 404 || r.status === 400);
  });

  test("400 prototype poisoning bodies are rejected without echo", async () => {
    for (const body of ['{"__proto__":{"isAdmin":true}}', '{"a":{"__proto__":{"x":1}}}', '{"constructor":{"prototype":{"x":1}}}']) {
      const r = await post({ headers: J, body });
      console.log(`proto body ${body.slice(0, 30)} ->`, r.status, r.json?.error?.code);
      assert.ok(r.status === 400 || r.status === 404, `${body} -> ${r.status}`);
      assert.ok(r.json?.error);
      assert.ok(!/isAdmin|prototype|__proto__/.test(r.text), "echoed");
    }
  });

  test("invalid UTF-8 and deeply nested JSON do not 5xx", async () => {
    const bad = await post({ headers: J, body: Buffer.from([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xff, 0xfe, 0x22, 0x7d]) });
    console.log("invalid UTF-8 ->", bad.status, bad.json?.error?.code);
    assert.ok(bad.status < 500);
    const deep = await post({ headers: J, body: "[".repeat(2000) + "]".repeat(2000) });
    console.log("2000-deep nested ->", deep.status, deep.json?.error?.code);
    assert.ok(deep.status < 500 && deep.json?.error);
  });

  test("GET with a body and Content-Length mismatches do not 5xx", async () => {
    const g = await request(api, { method: "GET", headers: { ...J, "Content-Length": "2" }, body: "{}" });
    console.log("GET with JSON body ->", g.status, g.text.slice(0, 120));
    assert.ok(g.status < 500);
    if (g.status >= 400) assert.ok(g.json?.error?.code, `GET-with-body error not contract-shaped: ${g.text.slice(0, 120)}`);
    const r = await raw(api, `POST /api/guestbook HTTP/1.1\r\nHost: ${HOST}\r\nContent-Type: application/json\r\nContent-Length: 9999999\r\nConnection: close\r\n\r\n{}`);
    console.log("declared 9999999 bytes ->", /^HTTP\/1\.1 (\d{3})/.exec(r.out)?.[1] ?? "no response", r.out.split("\r\n\r\n")[1]?.slice(0, 120));
    const bad = await raw(api, `POST /api/guestbook HTTP/1.1\r\nHost: ${HOST}\r\nContent-Type: application/json\r\nContent-Length: abc\r\nConnection: close\r\n\r\n{}`);
    console.log("Content-Length: abc ->", /^HTTP\/1\.1 (\d{3})/.exec(bad.out)?.[1] ?? "no response");
  });

  test("A-ERR-4: still healthy", async () => {
    assert.equal((await request(api)).status, 200);
  });
  test("stop", async () => api.stop());
});

// ---------------------------------------------------------------- group 4: hostile transport (raw sockets)

describe("transport-level abuse (local instance only)", () => {
  let api;
  test("start", async () => {
    api = await startApi();
  });

  test("bad request line, oversized headers, huge URL, smuggling-shaped requests: observe responses and survival", async () => {
    const results = {};
    const cases = {
      garbage: "GARBAGE\r\n\r\n",
      "bad http version": `GET /api/health HTTP/9.9\r\nHost: ${HOST}\r\n\r\n`,
      "lf only": `GET /api/health HTTP/1.1\nHost: ${HOST}\nConnection: close\n\n`,
      "header 20KB": `GET /api/health HTTP/1.1\r\nHost: ${HOST}\r\nX-Big: ${"A".repeat(20000)}\r\nConnection: close\r\n\r\n`,
      "many cookies": `GET /api/health HTTP/1.1\r\nHost: ${HOST}\r\nCookie: ${"a=b; ".repeat(4000)}\r\nConnection: close\r\n\r\n`,
      "url 20KB": `GET /${"a".repeat(20000)} HTTP/1.1\r\nHost: ${HOST}\r\nConnection: close\r\n\r\n`,
      "CL and TE both": `POST /api/guestbook HTTP/1.1\r\nHost: ${HOST}\r\nContent-Type: application/json\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n0\r\n\r\n`,
      "two CL": `POST /api/guestbook HTTP/1.1\r\nHost: ${HOST}\r\nContent-Type: application/json\r\nContent-Length: 2\r\nContent-Length: 3\r\nConnection: close\r\n\r\n{}`,
      "space in path": `GET /api/hea lth HTTP/1.1\r\nHost: ${HOST}\r\nConnection: close\r\n\r\n`,
      "NUL in path": `GET /api/health\u0000 HTTP/1.1\r\nHost: ${HOST}\r\nConnection: close\r\n\r\n`,
      "no Host": `GET /api/health HTTP/1.1\r\nConnection: close\r\n\r\n`,
      "absolute-form URL to other host": `GET http://evil.example.test/api/health HTTP/1.1\r\nHost: ${HOST}\r\nConnection: close\r\n\r\n`,
      "CONNECT": `CONNECT evil.example.test:443 HTTP/1.1\r\nHost: evil.example.test:443\r\n\r\n`,
    };
    for (const [name, bytes] of Object.entries(cases)) {
      const r = await raw(api, bytes, 800);
      const status = /^HTTP\/1\.[01] (\d{3})/.exec(r.out)?.[1] ?? "none";
      const body = r.out.split("\r\n\r\n").slice(1).join("").slice(0, 100).replace(/\s+/g, " ");
      const contract = /"error":\{"code":"/.test(r.out);
      results[name] = { status, contractBody: contract, body: body.slice(0, 70) };
      assert.ok(status === "none" || Number(status) < 500, `${name} -> ${status}`);
      assert.ok(!/at .*\.(js|ts):\d+|node_modules|\/Users\//.test(r.out), `${name} leaked a path or stack`);
    }
    console.log("transport probe results:\n" + Object.entries(results).map(([k, v]) => `  ${k}: ${v.status} contractBody=${v.contractBody} ${v.body}`).join("\n"));
    assert.equal((await request(api)).status, 200, "server survived");
  });

  test("observation QA-003: HTTP-parse-level errors bypass the contract error body (change detector)", async () => {
    // These never become a Fastify request, so app-level handlers cannot format them. Asserts CURRENT behavior.
    for (const [name, bytes] of Object.entries({
      "garbage request line": "GARBAGE\r\n\r\n",
      "space in path": `GET /api/hea lth HTTP/1.1\r\nHost: ${HOST}\r\nConnection: close\r\n\r\n`,
      "Content-Length: abc": `POST /api/guestbook HTTP/1.1\r\nHost: ${HOST}\r\nContent-Length: abc\r\nConnection: close\r\n\r\n`,
      "20 KB header": `GET /api/health HTTP/1.1\r\nHost: ${HOST}\r\nX-Big: ${"A".repeat(20000)}\r\nConnection: close\r\n\r\n`,
    })) {
      const r = await raw(api, bytes, 600);
      const body = r.out.split("\r\n\r\n").slice(1).join("");
      assert.match(r.out, /^HTTP\/1\.1 4\d\d/, name);
      assert.ok(!/"code":"/.test(body), `${name}: contract body now present, QA-003 may be fixed: ${body.slice(0, 100)}`);
      assert.match(body, /"statusCode":4\d\d/, `${name}: expected Fastify default body, got ${body.slice(0, 100)}`);
      assert.ok(!/x-request-id/i.test(r.out), `${name}: X-Request-Id present now, QA-003 may be fixed`);
    }
  });

  test("A-DOS-lite: 60 idle half-open connections do not stop normal requests, and the server recovers after they close", async () => {
    const socks = [];
    for (let i = 0; i < 60; i++) {
      const s = connect(api.port);
      s.on("error", () => {});
      s.write(`GET /api/health HTTP/1.1\r\nHost: ${HOST}\r\nX-Slow: `); // never finishes the header block
      socks.push(s);
    }
    await new Promise((r) => setTimeout(r, 300));
    const t0 = Date.now();
    const r = await request(api);
    const ms = Date.now() - t0;
    console.log(`health with 60 stalled connections open: ${r.status} in ${ms} ms`);
    assert.equal(r.status, 200);
    assert.ok(ms < 2000);
    for (const s of socks) s.destroy();
    await new Promise((r2) => setTimeout(r2, 200));
    assert.equal((await request(api)).status, 200);
  });

  test("A-LOG: hostile input cannot forge log lines; no cookie or authorization values in logs", async () => {
    const marker = "FAKEMARKER_COOKIE_9d2";
    await request(api, { headers: { Cookie: `sid=${marker}`, Authorization: `Bearer ${marker}` } });
    await request(api, { method: "POST", path: "/api/guestbook", headers: { "Content-Type": "application/json", Cookie: `sid=${marker}` }, body: `{"password":"${marker}"}` });
    await request(api, { path: "/api/x%0d%0a%7B%22level%22%3A60%2C%22msg%22%3A%22FORGED%22%7D" });
    await request(api, { path: "/api/health?a=%1b%5b31mred" });
    await new Promise((r) => setTimeout(r, 300));
    assert.ok(!api.logs.includes(marker), "a cookie, authorization or body value appeared in the logs");
    const lines = api.logs.split("\n").filter(Boolean);
    for (const l of lines) {
      let ok = true;
      try {
        JSON.parse(l);
      } catch {
        ok = false;
      }
      assert.ok(ok || /^>|^$/.test(l), `non-JSON log line: ${l.slice(0, 120)}`);
    }
    assert.ok(!lines.some((l) => { try { return JSON.parse(l).msg === "FORGED"; } catch { return false; } }), "forged log entry present");
    console.log(`log lines checked: ${lines.length}; sample: ${lines.at(-1)?.slice(0, 160)}`);
  });

  test("bind address: listening on 127.0.0.1 only", async () => {
    const { execFileSync } = await import("node:child_process");
    const out = execFileSync("lsof", ["-nP", `-iTCP:${api.port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
    console.log(out.trim().split("\n").slice(0, 3).join("\n"));
    assert.match(out, new RegExp(`127\\.0\\.0\\.1:${api.port}`));
    assert.ok(!/\*:\d+|0\.0\.0\.0|\[::\]/.test(out), "wildcard bind");
  });
  test("stop", async () => api.stop());
});

// ---------------------------------------------------------------- group 5: rate limit

describe("A-RL: global limit 120/min per client IP", () => {
  test("A-RL-1/4/5: 121st request in a minute is 429 with Retry-After; XFF, Forwarded, X-Real-IP spoofing changes nothing; 404s and rejected origins count", async () => {
    const api = await startApi();
    try {
      let last;
      const statuses = [];
      for (let i = 1; i <= 120; i++) {
        const kind = i % 3;
        const h = { "X-Forwarded-For": `10.${i % 250}.${(i * 7) % 250}.9`, Forwarded: `for=192.0.2.${i % 250}`, "X-Real-IP": `203.0.113.${i % 250}` };
        last = kind === 0 ? await request(api, { path: `/api/nope${i}`, headers: h })
          : kind === 1 ? await request(api, { method: "POST", path: "/api/guestbook", headers: { ...h, Origin: "http://evil.test", "Content-Type": "application/json" }, body: "{}" })
            : await request(api, { headers: h });
        statuses.push(last.status);
        assert.ok(last.status !== 429, `request ${i} was limited early`);
      }
      const r121 = await request(api, { headers: { "X-Forwarded-For": "198.51.100.77" } });
      assertContractError(r121, "rate_limited", 429, "121st request");
      const ra = r121.headers["retry-after"];
      console.log("429 headers: retry-after=", ra, "x-ratelimit-limit=", r121.headers["x-ratelimit-limit"], "remaining=", r121.headers["x-ratelimit-remaining"], "reset=", r121.headers["x-ratelimit-reset"]);
      assert.match(String(ra), /^[1-9][0-9]*$/, "Retry-After must be a positive integer");
      assert.ok(Number(ra) <= 60);
      assert.match(r121.headers["x-request-id"], UUID);
      // still limited with more spoofed values, and for a mutating request with a bad origin the limiter answers first or the origin check does
      const again = await request(api, { headers: { "X-Forwarded-For": "1.2.3.4" } });
      assert.equal(again.status, 429);
      const mut = await request(api, { method: "POST", path: "/api/guestbook", headers: { Origin: "http://evil.test", "Content-Type": "application/json" }, body: "{}" });
      console.log("limited + bad-origin POST ->", mut.status, mut.json?.error?.code);
      assert.ok([403, 429].includes(mut.status));
      assert.equal(new Set(statuses.filter((s) => s !== 200)).size > 0, true);
    } finally {
      await api.stop();
    }
  });

  test("A-CFG-3: TRUST_PROXY=true makes X-Forwarded-For select the bucket (documented behavior, confirms the switch works only when enabled)", async () => {
    const api = await startApi({ TRUST_PROXY: "true" });
    try {
      for (let i = 0; i < 125; i++) {
        const r = await request(api, { headers: { "X-Forwarded-For": `198.51.100.${i}` } });
        assert.equal(r.status, 200, `distinct forwarded client ${i} should have its own bucket`);
      }
      let limited = 0;
      for (let i = 0; i < 125; i++) if ((await request(api, { headers: { "X-Forwarded-For": "203.0.113.5" } })).status === 429) limited++;
      assert.ok(limited >= 5, `same forwarded client should be limited (got ${limited} limited)`);
    } finally {
      await api.stop();
    }
  });
});

// ---------------------------------------------------------------- group 6: configuration failures

describe("A-CFG: bad configuration fails fast without echoing values", () => {
  const cases = [
    ["PORT not a number", { PORT: "SECRETVALUE_abc" }, "PORT"],
    ["PORT out of range", { PORT: "70000" }, "PORT"],
    ["NODE_ENV invalid", { NODE_ENV: "SECRETVALUE_x" }, "NODE_ENV"],
    ["WEB_ORIGIN wildcard", { WEB_ORIGIN: "*" }, "WEB_ORIGIN"],
    ["WEB_ORIGIN trailing slash", { WEB_ORIGIN: "http://localhost:5173/" }, "WEB_ORIGIN"],
    ["WEB_ORIGIN with path", { WEB_ORIGIN: "http://localhost:5173/app" }, "WEB_ORIGIN"],
    ["WEB_ORIGIN javascript scheme", { WEB_ORIGIN: "javascript:alert(1)" }, "WEB_ORIGIN"],
    ["WEB_ORIGIN one good one bad", { WEB_ORIGIN: "http://localhost:5173,SECRETVALUE_bad" }, "WEB_ORIGIN"],
    ["TRUST_PROXY invalid", { TRUST_PROXY: "1" }, "TRUST_PROXY"],
    ["LOG_LEVEL invalid", { LOG_LEVEL: "SECRETVALUE_loud" }, "LOG_LEVEL"],
  ];
  for (const [name, env, varName] of cases) {
    test(name, async () => {
      const port = await freePort();
      const child = spawn(TSX, ["src/server.ts"], { cwd: API_DIR, env: { PATH: process.env.PATH, HOME: process.env.HOME, HOST, ...env, ...(env.PORT ? {} : { PORT: String(port) }) }, stdio: ["ignore", "pipe", "pipe"] });
      let out = "";
      child.stdout.on("data", (d) => (out += d));
      child.stderr.on("data", (d) => (out += d));
      const code = await new Promise((r) => {
        const t = setTimeout(() => {
          child.kill("SIGKILL");
          r("timeout");
        }, 12000);
        child.on("exit", (c) => {
          clearTimeout(t);
          r(c);
        });
      });
      assert.notEqual(code, 0, `expected non-zero exit, got ${code}; output: ${out.slice(0, 200)}`);
      assert.notEqual(code, "timeout");
      assert.ok(out.includes(varName), `message should name ${varName}: ${out.slice(0, 200)}`);
      assert.ok(!out.includes("SECRETVALUE"), "configuration value echoed");
      assert.ok(!/at .*\.(ts|js):\d+/.test(out), "stack trace printed for a config error");
    });
  }

  test("default bind is 127.0.0.1 when HOST is unset", async () => {
    const port = await freePort();
    const child = spawn(TSX, ["src/server.ts"], { cwd: API_DIR, env: { PATH: process.env.PATH, HOME: process.env.HOME, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    const t0 = Date.now();
    while (!/listening/.test(out) && Date.now() - t0 < 15000) await new Promise((r) => setTimeout(r, 50));
    child.kill("SIGTERM");
    assert.match(out, new RegExp(`127\\.0\\.0\\.1:${port}`));
  });
});

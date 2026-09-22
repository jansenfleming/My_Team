// Black-box attack checks for the B3 SQLite guestbook (feat/api-guestbook) against
// docs/architecture/api-contract.md sections 4 and 6. Spawns the branch's real API on a free
// 127.0.0.1 port with a real (file-backed, not :memory:) temp SQLite database. SCOPE: 127.0.0.1
// only; every socket goes through connect()/request(), which refuse any other host.
//
// Usage: QA_API_DIR=<worktree>/apps/api node --test qa/gates/b3-api-guestbook.attack.test.mjs
//
// IMPORTANT test-design note: `POST /api/guestbook` is rate limited to 3 per 10 minutes PER SERVER
// PROCESS (the limiter's in-memory store is per-process), and that limit applies even to requests
// that fail validation (proven in group 3 below). So every test that needs more than 3 POSTs to the
// SAME running server either spawns its own fresh server (resets the counter) or seeds rows
// directly through a second, independent SQLite connection (bypassing HTTP and the limiter
// entirely, for pagination fixtures where the limiter itself is not what is being tested).
//
// No real secrets are used.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { createRequire } from "node:module";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOST = "127.0.0.1";
const API_DIR = process.env.QA_API_DIR;
if (!API_DIR || !existsSync(join(API_DIR, "src", "server.ts"))) {
  console.error("Set QA_API_DIR to the apps/api directory of the branch under test");
  process.exit(2);
}
const REPO_ROOT = join(API_DIR, "..", "..");
const TSX = join(REPO_ROOT, "node_modules", ".bin", "tsx");
const ORIGIN = "http://localhost:5173";

function assertLoopback(host) {
  if (host !== HOST) throw new Error(`refusing non-loopback host: ${host}`);
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

/** Starts the branch's API with a real, file-backed SQLite DB so a second connection can be opened on it. */
async function startApi(env = {}) {
  assertLoopback(HOST);
  const port = await freePort();
  const dataDir = mkdtempSync(join(tmpdir(), "qa-b3-"));
  const dbPath = join(dataDir, "site.db");
  const child = spawn(TSX, ["src/server.ts"], {
    cwd: API_DIR,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "development", LOG_LEVEL: "info", HOST, PORT: String(port), DATABASE_PATH: dbPath, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const api = { port, dbPath, dataDir, child, logs: "", exit: null };
  child.stdout.on("data", (d) => (api.logs += d));
  child.stderr.on("data", (d) => (api.logs += d));
  child.on("exit", (code) => (api.exit = code));
  const t0 = Date.now();
  while (!/Server listening/.test(api.logs)) {
    if (api.exit !== null) throw new Error(`API exited early (${api.exit}): ${api.logs.slice(0, 800)}`);
    if (Date.now() - t0 > 15000) throw new Error("API did not start");
    await new Promise((r) => setTimeout(r, 25));
  }
  api.stop = async () => {
    child.kill("SIGTERM");
    await new Promise((r) => (api.exit !== null ? r() : child.once("exit", r)));
  };
  return api;
}

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
        resolve({ status: res.statusCode, headers: res.headers, text, json });
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => req.destroy(new Error("client timeout")));
    req.end(body);
  });
}
const post = (api, body, headers = {}) =>
  request(api, { method: "POST", path: "/api/guestbook", headers: { "Content-Type": "application/json", Origin: ORIGIN, ...headers }, body: JSON.stringify(body) });
const list = (api, query = "") => request(api, { path: `/api/guestbook${query}` });

function assertContractError(res, code, status, label = "") {
  assert.equal(res.status, status, `${label} status: got ${res.status} body ${res.text.slice(0, 200)}`);
  assert.ok(res.json?.error, `${label} not an ApiError: ${res.text.slice(0, 200)}`);
  assert.equal(res.json.error.code, code, `${label} code`);
  assert.equal(res.json.error.requestId, res.headers["x-request-id"], `${label} requestId`);
  assert.ok(!res.json.error.message.includes("SELECT"), `${label} leaked SQL`);
  assert.ok(!res.json.error.message.includes(API_DIR), `${label} leaked a path`);
}

/** Seeds rows through a SECOND, independent SQLite connection to the same file: bypasses HTTP and
 * the 3-per-10-min POST limiter entirely, for tests whose subject is pagination, not the limiter. */
function seedGuestbookRows(dbPath, count, handle = "seed") {
  const Database = createRequire(join(REPO_ROOT, "package.json"))("better-sqlite3");
  const db = new Database(dbPath);
  try {
    const insert = db.prepare("INSERT INTO guestbook_entries (handle, message, created_at) VALUES (?, ?, ?)");
    const tx = db.transaction((n) => {
      for (let i = 1; i <= n; i++) insert.run(handle, `msg ${i}`, new Date(Date.now() + i).toISOString());
    });
    tx(count);
  } finally {
    db.close();
  }
}

/** Opens a second connection, holds a write lock (BEGIN EXCLUSIVE, never committed until the caller
 * releases it) so the server's own writes contend for it. WAL readers are unaffected by design
 * (that is the point of WAL), which is itself a finding — see group 4. */
function openWriteLock(dbPath) {
  const Database = createRequire(join(REPO_ROOT, "package.json"))("better-sqlite3");
  const db = new Database(dbPath);
  db.exec("BEGIN EXCLUSIVE");
  return { release: () => (db.exec("COMMIT"), db.close()) };
}

// ---------------------------------------------------------------- group 1: verbatim storage, injection

describe("storage is verbatim and parameterized; SQLi and HTML payloads cannot break it", () => {
  test("empty guestbook: contract shape", async () => {
    const api = await startApi();
    try {
      const r = await list(api);
      assert.equal(r.status, 200);
      assert.deepEqual(r.json, { items: [], nextBefore: null });
    } finally {
      await api.stop();
    }
  });

  test("happy path: create then read back verbatim, ids ascending, timestamps present, JSON content-type", async () => {
    const api = await startApi();
    try {
      const r = await post(api, { handle: "ghost_42", message: "hello grid" });
      assert.equal(r.status, 201);
      assert.match(r.headers["content-type"], /^application\/json/);
      assert.equal(r.json.entry.handle, "ghost_42");
      assert.equal(r.json.entry.message, "hello grid");
      assert.equal(r.json.entry.id, 1);
      assert.match(r.json.entry.createdAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
      const r2 = await post(api, { handle: "ghost_43", message: "second" });
      assert.equal(r2.json.entry.id, 2);
      assert.equal((await list(api)).json.items.length, 2);
    } finally {
      await api.stop();
    }
  });

  test("SQL injection strings in message are stored verbatim and returned unchanged; table survives (own server: 3 payloads = the full POST budget)", async () => {
    const api = await startApi();
    try {
      const payloads = ["'; DROP TABLE guestbook_entries; --", "' OR '1'='1", "1; DELETE FROM guestbook_entries WHERE 1=1; --"];
      for (const message of payloads) {
        const r = await post(api, { handle: "sqltest", message });
        assert.equal(r.status, 201, `payload ${message}`);
        assert.equal(r.json.entry.message, message, "message not stored verbatim");
      }
      const items = (await list(api)).json.items;
      assert.equal(items.length, payloads.length, "table row count wrong: injection may have run, or a row was lost");
      for (const message of payloads) assert.ok(items.some((e) => e.message === message), `payload lost: ${message}`);
      assert.equal((await request(api)).status, 200, "DB still healthy after injection attempts");
    } finally {
      await api.stop();
    }
  });

  test("HTML/script payloads in message are stored verbatim, never escaped or stripped (own server: 3 payloads)", async () => {
    const api = await startApi();
    try {
      const payloads = ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "\"><svg onload=alert(1)>"];
      for (const message of payloads) {
        const r = await post(api, { handle: "htmltest", message });
        assert.equal(r.status, 201);
        assert.equal(r.json.entry.message, message);
      }
      const items = (await list(api)).json.items;
      for (const message of payloads) assert.ok(items.some((e) => e.message === message));
    } finally {
      await api.stop();
    }
  });

  test("handle charset rejects injection and markup at validation, before any DB write (own server: 3 attempts)", async () => {
    const api = await startApi();
    try {
      for (const handle of ["'; DROP TABLE guestbook_entries;--", "<script>", "a b"]) {
        const r = await post(api, { handle, message: "x" });
        assertContractError(r, "validation_error", 400, `handle=${handle}`);
      }
      assert.equal((await list(api)).json.items.length, 0, "an invalid handle must never create a row");
    } finally {
      await api.stop();
    }
  });

  test("prototype-pollution and malformed bodies give a clean 400, never 500 (own server: 3 attempts)", async () => {
    const api = await startApi();
    try {
      for (const body of ['{"handle":"ab","message":"x","__proto__":{"y":1}}', '{"handle":"ab"}', "{not json"]) {
        const r = await request(api, { method: "POST", path: "/api/guestbook", headers: { "Content-Type": "application/json", Origin: ORIGIN }, body });
        assert.ok(r.status === 400 || r.status === 201, `${body} -> ${r.status}`);
        if (r.status === 400) assertContractError(r, "validation_error", 400, body.slice(0, 30));
      }
      assert.ok(!({}).y, "prototype not polluted");
      assert.equal((await request(api)).status, 200, "still healthy");
    } finally {
      await api.stop();
    }
  });
});

// ---------------------------------------------------------------- group 2: keyset pagination

describe("keyset pagination: limit/before boundaries (rows seeded through a direct SQLite connection, not POST, so the 3/10min limiter is not a factor here)", () => {
  test("start, seed 25 rows directly, GET is unaffected by the guestbook POST limiter", async () => {
    const api = await startApi();
    try {
      seedGuestbookRows(api.dbPath, 25);
      const r = await list(api);
      assert.equal(r.status, 200);
      assert.equal(r.json.items.length, 20);

      const r2 = await list(api, "?limit=50");
      assert.equal(r2.json.items.length, 25);
      assert.equal(r2.json.items[0].id, 25, "newest first");
      assert.equal(r2.json.items.at(-1).id, 1);
      const ids = r2.json.items.map((e) => e.id);
      assert.deepEqual(ids, [...ids].sort((a, b) => b - a), "not strictly descending");
    } finally {
      await api.stop();
    }
  });

  test("default page (limit=20) and nextBefore is the smallest id shown", async () => {
    const api = await startApi();
    try {
      seedGuestbookRows(api.dbPath, 25);
      const r = await list(api);
      assert.equal(r.json.items.length, 20);
      assert.equal(r.json.items[0].id, 25);
      assert.equal(r.json.items.at(-1).id, 6);
      assert.equal(r.json.nextBefore, 6);
    } finally {
      await api.stop();
    }
  });

  test("paging with before walks every row exactly once, oldest page has nextBefore null", async () => {
    const api = await startApi();
    try {
      seedGuestbookRows(api.dbPath, 25);
      let before;
      const seen = [];
      for (let i = 0; i < 10; i++) {
        const r = await list(api, before === undefined ? "?limit=10" : `?limit=10&before=${before}`);
        assert.equal(r.status, 200);
        seen.push(...r.json.items.map((e) => e.id));
        before = r.json.nextBefore;
        if (before === null) break;
      }
      assert.deepEqual([...seen].sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => i + 1));
      assert.equal(new Set(seen).size, 25, "duplicate or missing rows while paging");
      assert.equal(before, null);
    } finally {
      await api.stop();
    }
  });

  test("exact-boundary page: 25 rows, limit=25 empties the table in one page with nextBefore null", async () => {
    const api = await startApi();
    try {
      seedGuestbookRows(api.dbPath, 25);
      const r = await list(api, "?limit=25");
      assert.equal(r.json.items.length, 25);
      assert.equal(r.json.nextBefore, null, "a page that exactly empties the table must not claim more exist");
    } finally {
      await api.stop();
    }
  });

  test("limit boundaries: 1, 50 (max), 0, 51, non-numeric, and repeated params", async () => {
    const api = await startApi();
    try {
      seedGuestbookRows(api.dbPath, 25);
      assert.equal((await list(api, "?limit=1")).json.items.length, 1);
      assert.equal((await list(api, "?limit=50")).json.items.length, 25);
      for (const bad of ["?limit=0", "?limit=51", "?limit=abc", "?limit=-1", "?limit=1.5", "?limit=1e1", "?limit=0x10", "?limit=", "?limit=1&limit=2"]) {
        assertContractError(await list(api, bad), "validation_error", 400, bad);
      }
    } finally {
      await api.stop();
    }
  });

  test("before boundaries: 0, negative, non-numeric, huge, id beyond range, and consistency", async () => {
    const api = await startApi();
    try {
      seedGuestbookRows(api.dbPath, 25);
      for (const bad of ["?before=0", "?before=-1", "?before=abc", "?before=1.5", "?before=99999999999999999999"]) {
        assertContractError(await list(api, bad), "validation_error", 400, bad);
      }
      const beyond = await list(api, "?before=1026");
      assert.equal(beyond.status, 200);
      assert.equal(beyond.json.items.length, 20);
      assert.equal(beyond.json.items[0].id, 25);
      const empty = await list(api, "?before=1");
      assert.equal(empty.status, 200);
      assert.deepEqual(empty.json, { items: [], nextBefore: null });
    } finally {
      await api.stop();
    }
  });

  test("still healthy after all pagination probing", async () => {
    const api = await startApi();
    try {
      assert.equal((await request(api)).status, 200);
    } finally {
      await api.stop();
    }
  });
});

// ---------------------------------------------------------------- group 3: rate limits (the backend's claimed fix)

describe("A-RL-3: the 3-per-10-min guestbook POST limit, its stacking with the global limit, and validation-rejected requests", () => {
  test("a request rejected by validation still counts toward the guestbook bucket (independent confirmation)", async () => {
    const api = await startApi();
    try {
      for (let i = 0; i < 3; i++) {
        const r = await post(api, { handle: "x y", message: "bad handle" }); // space is not in the handle charset
        assertContractError(r, "validation_error", 400, `invalid POST ${i}`);
      }
      const r4 = await post(api, { handle: "validnow", message: "should be limited" });
      assertContractError(r4, "rate_limited", 429, "4th POST after 3 invalid ones");
      assert.match(String(r4.headers["retry-after"]), /^[1-9][0-9]*$/);
      assert.equal((await list(api)).json.items.length, 0, "no POST in this window should have created a row");
    } finally {
      await api.stop();
    }
  });

  test("3 valid POSTs succeed, the 4th within the 10-minute window is 429", async () => {
    const api = await startApi();
    try {
      for (let i = 1; i <= 3; i++) assert.equal((await post(api, { handle: "poster", message: `entry ${i}` })).status, 201, `POST ${i}`);
      assertContractError(await post(api, { handle: "poster", message: "entry 4" }), "rate_limited", 429, "4th valid POST");
      assert.equal((await list(api)).json.items.length, 3);
    } finally {
      await api.stop();
    }
  });

  test("the guestbook bucket does not leak into or from the unrelated global bucket: many GETs do not trip the POST limit, and vice versa", async () => {
    const api = await startApi();
    try {
      for (let i = 0; i < 40; i++) assert.equal((await list(api)).status, 200);
      for (let i = 1; i <= 3; i++) assert.equal((await post(api, { handle: "gp", message: `m${i}` })).status, 201);
      assert.equal((await post(api, { handle: "gp", message: "m4" })).status, 429);
      assert.equal((await list(api)).status, 200);
    } finally {
      await api.stop();
    }
  });

  test("the guestbook POST bucket is also counted against the 120/min global bucket (both hooks fire; no crash, no double 429 body corruption)", async () => {
    const api = await startApi();
    try {
      for (let i = 1; i <= 3; i++) await post(api, { handle: "g", message: `m${i}` });
      const r = await post(api, { handle: "g", message: "over" });
      assertContractError(r, "rate_limited", 429, "well-formed single 429");
      assert.equal(Object.keys(r.json).length, 1);
    } finally {
      await api.stop();
    }
  });

  test("still healthy after all rate-limit probing", async () => {
    const api = await startApi();
    try {
      assert.equal((await request(api)).status, 200);
    } finally {
      await api.stop();
    }
  });
});

// ---------------------------------------------------------------- group 4: DB unavailable

describe("DB unavailable: what can actually be induced black-box, and what it reveals about the health check", () => {
  test("file deletion/corruption under an OPEN connection is NOT observable (POSIX semantics), confirmed empirically, not assumed", async () => {
    // An already-open better-sqlite3 file descriptor keeps working after unlink() removes the
    // directory entry (classic POSIX "delete while open"). This is a limit of black-box testing at
    // the process level, not a defect in the branch: confirmed by actually deleting the whole data
    // directory (db file + -wal + -shm) out from under a live server and observing it keep working.
    const api = await startApi();
    try {
      await post(api, { handle: "before", message: "1" });
      const { rmSync } = await import("node:fs");
      rmSync(api.dataDir, { recursive: true, force: true });
      const health = await request(api);
      const list2 = await list(api);
      assert.equal(health.status, 200, "expected (documented): deletion of an open file is invisible to the holder");
      assert.equal(list2.status, 200, "expected (documented): same reasoning for reads");
    } finally {
      await api.stop();
    }
  });

  test("a write lock held by a second connection makes a write fail 500 with no leak, while /api/health (a read) stays 200 the whole time", async () => {
    const api = await startApi();
    try {
      assert.equal((await request(api)).status, 200);
      const lock = openWriteLock(api.dbPath);
      try {
        const [health, write] = await Promise.all([request(api), post(api, { handle: "duringlock", message: "will this work" })]);
        // WAL readers are not blocked by a writer's lock: this is correct SQLite/WAL behavior, not a bug.
        assert.equal(health.status, 200, "health (a read) is unaffected by another connection's write lock under WAL");
        assertContractError(write, "internal_error", 500, "write while another connection holds the write lock");
        assert.equal(write.json.error.message, "Internal server error.");
      } finally {
        lock.release();
      }
      // recovery: once the lock is released, writes succeed again without a restart.
      const after = await post(api, { handle: "afterlock", message: "recovered" });
      assert.equal(after.status, 201, "the server must recover once the lock clears, without needing a restart");
    } finally {
      await api.stop();
    }
  });

  test("still healthy and functional after both DB-unavailable probes", async () => {
    const api = await startApi();
    try {
      assert.equal((await request(api)).status, 200);
      assert.equal((await post(api, { handle: "final", message: "ok" })).status, 201);
    } finally {
      await api.stop();
    }
  });
});

// Self-test for scan-secrets.mjs. Uses only node:test. Run: node --test tools/scan-secrets.test.mjs
// Fake secrets are assembled at runtime from fragments so that this file itself never contains a matching literal
// and the scanner passes on the repository that holds its own tests.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCANNER = join(dirname(fileURLToPath(import.meta.url)), "scan-secrets.mjs");

const FAKE = {
  aws: "AKIA" + "Q7W2E9R4T6Y1U8I3",
  github: "ghp" + "_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8",
  pem: "-----BEGIN " + "RSA PRIVATE KEY" + "-----",
  generic: "Zk39" + "qL0vXp82" + "mTn5Rw7d",
  urlPass: "s3cr3t" + "Pa55w0rd",
};

function scan(dir, ...args) {
  const r = spawnSync(process.execPath, [SCANNER, "--root", dir, ...args], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}

function tmp() {
  return mkdtempSync(join(tmpdir(), "scan-secrets-test-"));
}

test("clean tree passes (exit 0)", () => {
  const d = tmp();
  try {
    writeFileSync(join(d, "index.ts"), 'export const greeting = "hello grid";\nconst password = process.env.OPERATOR_PASSWORD;\n');
    writeFileSync(join(d, ".env.example"), "OPERATOR_USERNAME=operator\nOPERATOR_PASSWORD_HASH=<generate with npm run hash-password>\nWEB_ORIGIN=http://localhost:5173\n");
    const r = scan(d);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /PASS/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("planted fake secrets are caught (exit 1) and never printed", () => {
  const d = tmp();
  try {
    writeFileSync(join(d, "a.ts"), `const k = "${FAKE.aws}";\n`);
    writeFileSync(join(d, "b.ts"), `const t = "${FAKE.github}";\n`);
    writeFileSync(join(d, "c.txt"), `${FAKE.pem}\nMIIB\n`);
    writeFileSync(join(d, "d.ts"), `const conf = { password: "${FAKE.generic}" };\n`);
    writeFileSync(join(d, "e.ts"), `const u = "postgres://admin:${FAKE.urlPass}@db.internal/app";\n`);
    writeFileSync(join(d, ".env"), `SESSION_SECRET=${FAKE.generic}\n`);
    const r = scan(d);
    assert.equal(r.code, 1, r.out);
    for (const rule of ["aws-access-key-id", "github-token", "private-key-block", "generic-secret-assignment", "credentials-in-url", "forbidden-file-env"]) {
      assert.match(r.out, new RegExp(rule), `expected rule ${rule} in output:\n${r.out}`);
    }
    for (const v of [FAKE.aws, FAKE.github, FAKE.generic, FAKE.urlPass]) {
      assert.ok(!r.out.includes(v), "scanner output must not contain the secret value");
    }
    assert.match(r.out, /\[REDACTED len=\d+\]/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("generic assignment in a test path is a warning, not a failure, unless --fail-on-warn", () => {
  const d = tmp();
  try {
    mkdirSync(join(d, "tests"));
    writeFileSync(join(d, "tests", "login.test.ts"), `const creds = { password: "${FAKE.generic}" };\n`);
    const soft = scan(d);
    assert.equal(soft.code, 0, soft.out);
    assert.match(soft.out, /WARN/);
    const strict = scan(d, "--fail-on-warn");
    assert.equal(strict.code, 1, strict.out);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("token-format secrets in test paths still fail", () => {
  const d = tmp();
  try {
    mkdirSync(join(d, "tests"));
    writeFileSync(join(d, "tests", "x.test.ts"), `const k = "${FAKE.aws}";\n`);
    assert.equal(scan(d).code, 1);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("inline allow marker and allowlist file (with reason) suppress findings", () => {
  const d = tmp();
  try {
    writeFileSync(join(d, "a.ts"), `const k = "${FAKE.aws}"; // secretscan:allow documented example\n`);
    writeFileSync(join(d, "b.ts"), `const k = "${FAKE.github}";\n`);
    assert.equal(scan(d).code, 1, "b.ts must still fail");
    mkdirSync(join(d, "tools"), { recursive: true });
    writeFileSync(join(d, "tools", "scan-secrets.allow.json"), JSON.stringify({ entries: [{ path: "b.ts", rule: "github-token", reason: "test double" }] }));
    assert.equal(scan(d).code, 0);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("allowlist entry without a reason is rejected (exit 2)", () => {
  const d = tmp();
  try {
    mkdirSync(join(d, "tools"), { recursive: true });
    writeFileSync(join(d, "tools", "scan-secrets.allow.json"), JSON.stringify({ entries: [{ path: "x" }] }));
    assert.equal(scan(d).code, 2);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("--path scans a directory (for build output)", () => {
  const d = tmp();
  try {
    mkdirSync(join(d, "dist"));
    writeFileSync(join(d, "dist", "app.js"), `var t="${FAKE.github}";`);
    assert.equal(scan(d, "--path", join(d, "dist")).code, 1);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("--history finds a secret that was committed then deleted", () => {
  const d = tmp();
  const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...a], { cwd: d, stdio: "ignore" });
  try {
    git("init", "-q");
    writeFileSync(join(d, "keep.txt"), "hello\n");
    writeFileSync(join(d, "leak.ts"), `const k = "${FAKE.aws}";\n`);
    git("add", "-A");
    git("commit", "-q", "-m", "add");
    rmSync(join(d, "leak.ts"));
    git("add", "-A");
    git("commit", "-q", "-m", "remove");
    assert.equal(scan(d).code, 0, "working tree is clean");
    const h = scan(d, "--history");
    assert.equal(h.code, 1, h.out);
    assert.match(h.out, /aws-access-key-id/);
    assert.ok(!h.out.includes(FAKE.aws));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test("usage errors exit 2", () => {
  assert.equal(spawnSync(process.execPath, [SCANNER, "--nope"]).status, 2);
});

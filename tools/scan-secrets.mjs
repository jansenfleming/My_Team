#!/usr/bin/env node
// scan-secrets.mjs: dependency-free secret scanner for this repository.
// Owner: Architect. Basic hygiene tool (no standing QA role on this project); run by hand or from CI.
//
// Usage:
//   node tools/scan-secrets.mjs                    scan the working tree (tracked + untracked, respecting .gitignore)
//   node tools/scan-secrets.mjs --history          scan every added line in git history (all refs)
//   node tools/scan-secrets.mjs --path <p> ...     scan specific files or directories instead (for example apps/web/dist)
//   node tools/scan-secrets.mjs --json             machine-readable output
//   node tools/scan-secrets.mjs --root <dir>       repository root (default: git top level of the cwd, else the cwd)
//   node tools/scan-secrets.mjs --fail-on-warn     treat warnings as failures
//
// Exit codes: 0 clean (warnings allowed), 1 findings, 2 usage or internal error.
//
// Safety: matched values are NEVER printed. Output shows rule, file, line, and a redacted marker
// (known token prefix + length, or length only). Source lines are never echoed.
//
// Suppressing a false positive: put `secretscan:allow` in a comment on the same line, or add an
// entry with a written reason to tools/scan-secrets.allow.json.
//
// Severities:
//   error: high-confidence formats (private keys, cloud/API tokens, credentials in URLs, forbidden files)
//          and generic secret-looking assignments outside test and fixture paths. Fails the run.
//   warn : generic secret-looking assignments inside test, fixture, or example paths (tests legitimately
//          contain fake passwords). Printed, does not fail unless --fail-on-warn.

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, sep, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_LINE_LEN = 20000; // skip minified blobs for the generic rule
const SKIP_DIRS = new Set(["node_modules", ".git", ".worktrees"]);
const ALLOW_MARK = "secretscan:allow";

// ---------------------------------------------------------------- rules

/** High-confidence, format-specific rules. `prefixLen` controls how much of the (non-secret) prefix may be shown. */
const TOKEN_RULES = [
  { id: "aws-access-key-id", re: /\b(?:AKIA|ASIA|AGPA|AIDA|AROA)[0-9A-Z]{16}\b/g, prefixLen: 4 },
  { id: "github-token", re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g, prefixLen: 4 },
  { id: "github-fine-grained-pat", re: /\bgithub_pat_[A-Za-z0-9_]{50,}\b/g, prefixLen: 11 },
  { id: "slack-token", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, prefixLen: 5 },
  { id: "stripe-live-key", re: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/g, prefixLen: 8 },
  { id: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/g, prefixLen: 4 },
  { id: "anthropic-api-key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, prefixLen: 7 },
  { id: "openai-style-api-key", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g, prefixLen: 3 },
  { id: "npm-token", re: /\bnpm_[A-Za-z0-9]{36}\b/g, prefixLen: 4 },
  { id: "private-key-block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, prefixLen: 0 },
  {
    id: "jwt",
    re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    prefixLen: 3,
  },
  {
    id: "credentials-in-url",
    // scheme://user:password@host, password must not look like a placeholder
    re: /\b[a-z][a-z0-9+.-]{1,15}:\/\/[^\s:/@'"`<>]{1,64}:([^\s@/'"`<>]{6,})@[^\s/'"`<>]+/gi,
    group: 1,
    prefixLen: 0,
  },
];

const KEY_WORDS =
  "pass(?:word|wd|phrase)?|secret|token|api[_-]?key|apikey|auth[_-]?key|access[_-]?key|private[_-]?key|credential|session[_-]?key|signing[_-]?key|client[_-]?secret";
// key (optionally decorated), separator, then either a quoted value or (dotenv-like files only) a bare value
const GENERIC_QUOTED = new RegExp(
  `([A-Za-z0-9_.-]*(?:${KEY_WORDS})[A-Za-z0-9_.-]*)["'\`]?\\s*(?:=|:|=>)\\s*(["'\`])([^"'\`\\s]{8,})\\2`,
  "gi",
);
const GENERIC_BARE = new RegExp(
  `^\\s*(?:export\\s+)?([A-Za-z0-9_.-]*(?:${KEY_WORDS})[A-Za-z0-9_.-]*)\\s*(?:=|:)\\s*([^\\s"'\`#]{8,})\\s*(?:#.*)?$`,
  "i",
);

const PLACEHOLDER_HINTS = [
  "example",
  "placeholder",
  "changeme",
  "change-me",
  "change_me",
  "your_",
  "your-",
  "yourpassword",
  "<",
  ">",
  "${",
  "{{",
  "%s",
  "process.env",
  "env.",
  "secrets.",
  "redacted",
  "xxxxx",
  "*****",
  "...",
  "todo",
  "[placeholder",
  "generate",
  "npm run",
];

const FORBIDDEN_FILE_RULES = [
  { id: "forbidden-file-env", test: (p) => /(^|\/)\.env(\..+)?$/.test(p) && !/\.env\.(example|sample|template)$/.test(p) },
  { id: "forbidden-file-private-key", test: (p) => /(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.pub)?$/.test(p) && !p.endsWith(".pub") },
  { id: "forbidden-file-key-material", test: (p) => /\.(pem|key|p12|pfx|jks|keystore)$/i.test(p) },
  { id: "forbidden-file-database", test: (p) => /\.(db|sqlite|sqlite3)(-wal|-shm|-journal)?$/i.test(p) },
];

// ---------------------------------------------------------------- helpers

function isTestLikePath(p) {
  return /(^|\/)(__tests__|tests?|fixtures?|__fixtures__|mocks?|__mocks__|examples?)\//i.test(p) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(p);
}

function isDotenvLike(p) {
  const b = basename(p);
  return b.startsWith(".env") || /\.(env|ini|properties|cfg|conf|toml|ya?ml)$/i.test(b);
}

function shannon(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let h = 0;
  for (const c of counts.values()) {
    const p = c / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function looksPlaceholder(v) {
  const l = v.toLowerCase();
  if (PLACEHOLDER_HINTS.some((h) => l.includes(h))) return true;
  if (/^(.)\1+$/.test(v)) return true; // aaaaaaaa
  return false;
}

function looksSecret(v) {
  if (looksPlaceholder(v)) return false;
  const hasDigit = /\d/.test(v);
  const hasAlpha = /[A-Za-z]/.test(v);
  const h = shannon(v);
  if (hasDigit && hasAlpha && v.length >= 8 && h >= 2.8) return true;
  if (v.length >= 20 && h >= 3.5) return true;
  return false;
}

function redact(value, prefixLen = 0) {
  const shown = prefixLen > 0 ? value.slice(0, prefixLen) : "";
  return `${shown}[REDACTED len=${value.length}]`;
}

function globToRegExp(glob) {
  let out = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      out += ".*";
      i++;
    } else if (c === "*") out += "[^/]*";
    else if (c === "?") out += "[^/]";
    else out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(out + "$");
}

function loadAllowlist(root) {
  const candidates = [join(root, "tools", "scan-secrets.allow.json"), join(HERE, "scan-secrets.allow.json")];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const data = JSON.parse(readFileSync(file, "utf8"));
    const entries = Array.isArray(data.entries) ? data.entries : [];
    for (const e of entries) {
      if (typeof e.path !== "string" || typeof e.reason !== "string" || e.reason.trim() === "") {
        throw new Error(`allowlist entry needs "path" and a non-empty "reason": ${JSON.stringify(e)}`);
      }
    }
    return entries.map((e) => ({ re: globToRegExp(e.path), rule: e.rule ?? null }));
  }
  return [];
}

function isAllowed(allow, relPath, ruleId) {
  return allow.some((a) => a.re.test(relPath) && (a.rule === null || a.rule === ruleId));
}

// ---------------------------------------------------------------- scanning a text blob

/**
 * Scan text content. `lineOffset` lets history mode report the real line. Returns findings without file info.
 * `lines` is an array of [lineNumber, text].
 */
function scanLines(lines, relPath) {
  const findings = [];
  const testLike = isTestLikePath(relPath);
  const dotenvLike = isDotenvLike(relPath);
  for (const [lineNo, text] of lines) {
    if (text.includes(ALLOW_MARK)) continue;

    for (const rule of TOKEN_RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text)) !== null) {
        const value = rule.group ? m[rule.group] : m[0];
        if (rule.id === "credentials-in-url" && looksPlaceholder(value)) continue;
        if (rule.id === "credentials-in-url" && /^(password|pass|pwd|secret|token|\*+)$/i.test(value)) continue;
        findings.push({
          rule: rule.id,
          severity: "error",
          line: lineNo,
          match: redact(value, rule.prefixLen),
        });
        if (m[0].length === 0) rule.re.lastIndex++;
      }
    }

    if (text.length > MAX_LINE_LEN) continue;

    GENERIC_QUOTED.lastIndex = 0;
    let g;
    while ((g = GENERIC_QUOTED.exec(text)) !== null) {
      const value = g[3];
      if (!looksSecret(value)) continue;
      findings.push({
        rule: "generic-secret-assignment",
        severity: testLike ? "warn" : "error",
        line: lineNo,
        match: `key "${g[1].slice(0, 40)}" = ${redact(value)}`,
      });
    }

    if (dotenvLike) {
      const b = GENERIC_BARE.exec(text);
      if (b && looksSecret(b[2])) {
        findings.push({
          rule: "generic-secret-assignment",
          severity: testLike ? "warn" : "error",
          line: lineNo,
          match: `key "${b[1].slice(0, 40)}" = ${redact(b[2])}`,
        });
      }
    }
  }
  return findings;
}

function isProbablyBinary(buf) {
  const n = Math.min(buf.length, 8000);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

// ---------------------------------------------------------------- file enumeration

function git(root, args, opts = {}) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"], ...opts });
}

function isGitRepo(root) {
  try {
    git(root, ["rev-parse", "--git-dir"]);
    return true;
  } catch {
    return false;
  }
}

function walk(dir, root, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, root, out);
    else if (st.isFile()) out.push(relative(root, full).split(sep).join("/"));
  }
}

function listWorkingTreeFiles(root, explicitPaths) {
  if (explicitPaths.length > 0) {
    const out = [];
    for (const p of explicitPaths) {
      const full = resolve(p);
      if (!existsSync(full)) throw new Error(`path does not exist: ${p}`);
      const st = statSync(full);
      if (st.isDirectory()) walk(full, root, out);
      else out.push(relative(root, full).split(sep).join("/"));
    }
    return out;
  }
  if (isGitRepo(root)) {
    const raw = git(root, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
    return raw.split("\0").filter(Boolean);
  }
  const out = [];
  walk(root, root, out);
  return out;
}

// ---------------------------------------------------------------- modes

function scanWorkingTree(root, explicitPaths, allow) {
  const findings = [];
  const files = [...new Set(listWorkingTreeFiles(root, explicitPaths))];
  let scanned = 0;
  let skipped = 0;
  for (const rel of files) {
    const full = join(root, rel);
    let st;
    try {
      st = statSync(full);
    } catch {
      skipped++; // tracked but deleted in the working tree
      continue;
    }
    if (!st.isFile()) {
      skipped++;
      continue;
    }

    for (const fr of FORBIDDEN_FILE_RULES) {
      if (fr.test(rel) && !isAllowed(allow, rel, fr.id)) {
        findings.push({ rule: fr.id, severity: "error", file: rel, line: 0, match: "file must not be present in the repository tree" });
      }
    }

    if (st.size > MAX_FILE_BYTES) {
      skipped++;
      continue;
    }
    const buf = readFileSync(full);
    if (isProbablyBinary(buf)) {
      skipped++;
      continue;
    }
    scanned++;
    const lines = buf.toString("utf8").split(/\r?\n/).map((t, i) => [i + 1, t]);
    for (const f of scanLines(lines, rel)) {
      if (isAllowed(allow, rel, f.rule)) continue;
      findings.push({ ...f, file: rel });
    }
  }
  return { findings, scanned, skipped, mode: "working-tree" };
}

function scanHistory(root, allow) {
  if (!isGitRepo(root)) throw new Error("--history needs a git repository");
  const findings = [];
  const seen = new Set();
  let commits = 0;

  // Files that were ever added and match a forbidden-file rule
  const names = git(root, ["log", "--all", "--no-color", "--diff-filter=A", "--name-only", "--format=@@C %H"]);
  let cur = "";
  for (const line of names.split("\n")) {
    if (line.startsWith("@@C ")) {
      cur = line.slice(4, 11);
      commits++;
      continue;
    }
    if (!line) continue;
    for (const fr of FORBIDDEN_FILE_RULES) {
      const key = `${fr.id}|${line}`;
      if (fr.test(line) && !isAllowed(allow, line, fr.id) && !seen.has(key)) {
        seen.add(key);
        findings.push({ rule: fr.id, severity: "error", file: line, line: 0, commit: cur, match: "file was added to git history" });
      }
    }
  }

  // Added lines in all patches
  const patch = git(root, ["log", "--all", "-p", "-U0", "--no-color", "--no-ext-diff", "--format=@@C %H"]);
  let commit = "";
  let file = "";
  let lineNo = 0;
  let binary = false;
  const batch = new Map(); // key commit|file -> lines
  const flush = () => {
    for (const [key, lines] of batch) {
      const [c, f] = key.split("\u0000");
      for (const fnd of scanLines(lines, f)) {
        if (isAllowed(allow, f, fnd.rule)) continue;
        const dedupe = `${fnd.rule}|${f}|${fnd.line}|${c}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        findings.push({ ...fnd, file: f, commit: c });
      }
    }
    batch.clear();
  };
  for (const line of patch.split("\n")) {
    if (line.startsWith("@@C ")) {
      flush();
      commit = line.slice(4, 11);
      continue;
    }
    if (line.startsWith("+++ ")) {
      file = line.startsWith("+++ b/") ? line.slice(6) : "";
      continue;
    }
    if (line.startsWith("Binary files")) {
      binary = true;
      continue;
    }
    if (line.startsWith("diff --git")) {
      binary = false;
      continue;
    }
    if (line.startsWith("@@ ")) {
      const m = /\+(\d+)/.exec(line);
      lineNo = m ? Number(m[1]) : 0;
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++") && file && !binary) {
      const key = `${commit}\u0000${file}`;
      if (!batch.has(key)) batch.set(key, []);
      batch.get(key).push([lineNo, line.slice(1)]);
      lineNo++;
    }
  }
  flush();
  return { findings, scanned: commits, skipped: 0, mode: "history" };
}

// ---------------------------------------------------------------- main

function parseArgs(argv) {
  const opts = { history: false, json: false, failOnWarn: false, root: null, paths: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--history") opts.history = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--fail-on-warn") opts.failOnWarn = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--root") opts.root = argv[++i];
    else if (a === "--path") {
      while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) opts.paths.push(argv[++i]);
    } else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

function findRoot(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return cwd;
  }
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`scan-secrets: ${e.message}`);
    process.exit(2);
  }
  if (opts.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 25).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
    return;
  }
  const root = resolve(opts.root ?? findRoot(process.cwd()));
  let result;
  try {
    const allow = loadAllowlist(root);
    result = opts.history ? scanHistory(root, allow) : scanWorkingTree(root, opts.paths, allow);
  } catch (e) {
    console.error(`scan-secrets: ${e.message}`);
    process.exit(2);
  }

  const errors = result.findings.filter((f) => f.severity === "error");
  const warns = result.findings.filter((f) => f.severity === "warn");
  const failed = errors.length > 0 || (opts.failOnWarn && warns.length > 0);

  if (opts.json) {
    console.log(JSON.stringify({ mode: result.mode, root: basename(root), scanned: result.scanned, skipped: result.skipped, errors: errors.length, warnings: warns.length, findings: result.findings }, null, 2));
  } else {
    for (const f of result.findings) {
      const where = f.line ? `${f.file}:${f.line}` : f.file;
      const at = f.commit ? ` (commit ${f.commit})` : "";
      console.log(`${f.severity.toUpperCase().padEnd(5)} ${f.rule.padEnd(28)} ${where}${at}  ${f.match}`);
    }
    const unit = result.mode === "history" ? "commits" : "files";
    console.log(
      `scan-secrets [${result.mode}]: ${result.scanned} ${unit} scanned, ${result.skipped} skipped, ${errors.length} error(s), ${warns.length} warning(s) -> ${failed ? "FAIL" : "PASS"}`,
    );
  }
  process.exit(failed ? 1 : 0);
}

// Export internals for the self-test; run main only when executed directly.
export { scanLines, looksSecret, shannon, redact };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

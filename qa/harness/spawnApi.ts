// Spawns the API from source on a free 127.0.0.1 port with a temp DB and a known test environment,
// for black-box tests. Never touches anything but localhost: the port is chosen by the OS on the
// loopback interface, and the process is always bound to 127.0.0.1 by the API itself (contract).
import { type ChildProcessByStdio, spawn } from "node:child_process";
import type { Readable } from "node:stream";
import { mkdtempSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertLocalUrl } from "./guard";

const HOST = "127.0.0.1";
const HERE = dirname(fileURLToPath(import.meta.url));
/** Repo root's apps/api, i.e. this worktree's own copy, unless QA_API_DIR overrides it (gating another branch). */
const DEFAULT_API_DIR = join(HERE, "..", "..", "apps", "api");
const REPO_ROOT_BIN = join(HERE, "..", "..", "node_modules", ".bin", "tsx");

export interface SpawnApiOptions {
  /** Directory containing apps/api's package.json and src/server.ts. Default: this worktree's apps/api. */
  readonly apiDir?: string;
  /** Extra environment variables (override the harness defaults, e.g. NODE_ENV: "production"). */
  readonly env?: Readonly<Record<string, string>>;
  /** Milliseconds to wait for the "Server listening" log line before giving up. */
  readonly startTimeoutMs?: number;
}

export interface RunningApi {
  readonly baseUrl: string;
  readonly port: number;
  readonly apiDir: string;
  /** Everything written to stdout/stderr so far, newest last. Useful for A-LOG style assertions. */
  readonly logs: string;
  /** Exit code once the process has exited, else null. */
  readonly exitCode: number | null;
  /** SIGTERM, wait for exit (or SIGKILL after a grace period), and remove the temp DB directory. Idempotent. */
  stop(): Promise<void>;
}

async function freePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, HOST, () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("could not allocate a port"));
        return;
      }
      server.close(() => resolve(address.port));
    });
    server.on("error", reject);
  });
}

/** Spawns `tsx src/server.ts` for the given (or default) apps/api, waits until it is listening. */
export async function spawnApi(options: SpawnApiOptions = {}): Promise<RunningApi> {
  const apiDir = options.apiDir ?? DEFAULT_API_DIR;
  const port = await freePort();
  const baseUrl = `http://${HOST}:${port}`;
  assertLocalUrl(baseUrl); // belt and braces: freePort() always binds 127.0.0.1, but never trust silently

  const dataDir = mkdtempSync(join(tmpdir(), "qa-api-"));
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    NODE_ENV: "test",
    HOST,
    PORT: String(port),
    LOG_LEVEL: "info",
    // Forward-looking: B3 adds a real database file. Harmless today (B2 ignores unknown env vars);
    // Q3 will not need to change this once the API reads it.
    DATABASE_PATH: join(dataDir, "site.db"),
    ...options.env,
  };

  const bin = REPO_ROOT_BIN;
  const child: ChildProcessByStdio<null, Readable, Readable> = spawn(bin, ["src/server.ts"], {
    cwd: apiDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let logs = "";
  let exitCode: number | null = null;
  child.stdout.on("data", (d: Buffer) => (logs += d.toString()));
  child.stderr.on("data", (d: Buffer) => (logs += d.toString()));
  child.on("exit", (code) => (exitCode = code));

  const startTimeoutMs = options.startTimeoutMs ?? 15_000;
  const t0 = Date.now();
  while (!/Server listening/.test(logs)) {
    if (exitCode !== null) {
      rmSync(dataDir, { recursive: true, force: true });
      throw new Error(`API exited before it started listening (code ${exitCode}):\n${logs.slice(0, 2000)}`);
    }
    if (Date.now() - t0 > startTimeoutMs) {
      child.kill("SIGKILL");
      rmSync(dataDir, { recursive: true, force: true });
      throw new Error(`API did not start within ${startTimeoutMs} ms:\n${logs.slice(0, 2000)}`);
    }
    await new Promise((r) => setTimeout(r, 25));
  }

  let stopped = false;
  const stop = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;
    if (exitCode === null) {
      child.kill("SIGTERM");
      await Promise.race([
        new Promise<void>((resolve) => child.once("exit", () => resolve())),
        new Promise<void>((resolve) =>
          setTimeout(() => {
            if (exitCode === null) child.kill("SIGKILL");
            resolve();
          }, 5000),
        ),
      ]);
    }
    rmSync(dataDir, { recursive: true, force: true });
  };

  return {
    baseUrl,
    port,
    apiDir,
    get logs() {
      return logs;
    },
    get exitCode() {
      return exitCode;
    },
    stop,
  };
}

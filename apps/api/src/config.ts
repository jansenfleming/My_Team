// Environment configuration, validated with zod. Values are never echoed in error messages
// (future variables hold secrets), only the variable name and a fixed reason.
import { z } from "zod";

export const DEFAULT_WEB_ORIGIN = "http://localhost:5173,http://127.0.0.1:5173";

export type Config = {
  env: "development" | "test" | "production";
  host: string;
  port: number;
  /** Exact allowed browser origins for the Origin check on mutating requests. */
  webOrigins: readonly string[];
  /** Trust X-Forwarded-For for the client IP. Off unless behind a trusted proxy. */
  trustProxy: boolean;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  /** SQLite file path, or ":memory:". Relative paths resolve against the process cwd. */
  databasePath: string;
};

export const DEFAULT_DATABASE_PATH = "data/site.db";

export class ConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid configuration:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "ConfigError";
  }
}

const boolFromEnv = (name: string) =>
  z
    .enum(["true", "false"], { error: `${name} must be "true" or "false"` })
    .transform((v) => v === "true");

const originList = z
  .string()
  .transform((raw) =>
    raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  )
  .superRefine((list, ctx) => {
    if (list.length === 0) {
      ctx.addIssue({ code: "custom", message: "WEB_ORIGIN must list at least one origin" });
    }
    for (const entry of list) {
      let ok = false;
      try {
        const u = new URL(entry);
        ok = (u.protocol === "http:" || u.protocol === "https:") && u.origin === entry;
      } catch {
        ok = false;
      }
      if (!ok) {
        ctx.addIssue({
          code: "custom",
          message:
            "WEB_ORIGIN entries must be exact http(s) origins like http://localhost:5173 (no path, no trailing slash, no wildcard)",
        });
        return;
      }
    }
  });

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"], {
      error: 'NODE_ENV must be "development", "test" or "production"',
    })
    .default("development"),
  HOST: z.string().min(1).max(253, { error: "HOST is too long" }).default("127.0.0.1"),
  PORT: z
    .string()
    .regex(/^[0-9]{1,5}$/, { error: "PORT must be an integer from 1 to 65535" })
    .transform(Number)
    .refine((n) => n >= 1 && n <= 65535, { error: "PORT must be an integer from 1 to 65535" })
    .default(3001),
  WEB_ORIGIN: originList.default(DEFAULT_WEB_ORIGIN.split(",")),
  TRUST_PROXY: boolFromEnv("TRUST_PROXY").default(false),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"], {
      error: "LOG_LEVEL must be one of fatal, error, warn, info, debug, trace, silent",
    })
    .optional(),
  DATABASE_PATH: z
    .string()
    .min(1, { error: "DATABASE_PATH must not be empty" })
    .max(4096, { error: "DATABASE_PATH is too long" })
    .refine((p) => !p.includes("\0"), { error: "DATABASE_PATH must not contain a NUL byte" })
    .default(DEFAULT_DATABASE_PATH),
});

/** Parse and validate the environment. Empty strings count as unset. Throws `ConfigError`. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const cleaned: Record<string, string> = {};
  for (const key of Object.keys(EnvSchema.shape)) {
    const value = env[key];
    if (value !== undefined && value.trim() !== "") cleaned[key] = value.trim();
  }
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const problems = [
      ...new Set(
        parsed.error.issues.map((i) => {
          const name = String(i.path[0] ?? "environment");
          return i.message.startsWith(name) ? i.message : `${name}: ${i.message}`;
        }),
      ),
    ];
    throw new ConfigError(problems);
  }
  const v = parsed.data;
  return {
    env: v.NODE_ENV,
    host: v.HOST,
    port: v.PORT,
    webOrigins: v.WEB_ORIGIN,
    trustProxy: v.TRUST_PROXY,
    logLevel: v.LOG_LEVEL ?? (v.NODE_ENV === "test" ? "silent" : "info"),
    databasePath: v.DATABASE_PATH,
  };
}

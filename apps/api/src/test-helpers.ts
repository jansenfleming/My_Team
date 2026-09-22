// Shared by the tests only.
import type { FastifyInstance } from "fastify";
import { CreateGuestbookRequestSchema } from "@site/shared";
import type { Config } from "./config";
import { buildApp, type AppDeps } from "./app";
import { openDb, type Db } from "./db/connection";
import { runMigrations } from "./db/migrate";

export const testConfig = (overrides: Partial<Config> = {}): Config => ({
  env: "test",
  host: "127.0.0.1",
  port: 3001,
  webOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  trustProxy: false,
  logLevel: "silent",
  databasePath: ":memory:",
  ...overrides,
});

/** A fresh in-memory database with every migration applied. Caller closes it. */
export function openTestDb(): Db {
  const db = openDb(":memory:");
  runMigrations(db);
  return db;
}

/** An app with a few test-only routes so body/content-type/error handling can be exercised. */
export async function buildTestApp(overrides: Partial<Config> = {}, deps: AppDeps = {}): Promise<FastifyInstance> {
  const app = await buildApp(testConfig(overrides), deps);
  app.post("/api/_test/echo", async (request) => ({ received: request.body ?? null }));
  app.put("/api/_test/echo", async () => ({ ok: true }));
  app.patch("/api/_test/echo", async () => ({ ok: true }));
  app.delete("/api/_test/echo", async () => ({ ok: true }));
  app.post("/api/_test/validate", async (request) => CreateGuestbookRequestSchema.parse(request.body));
  app.get("/api/_test/boom", async () => {
    throw new Error("secret: /etc/passwd SELECT * FROM users; at Object.<anonymous>");
  });
  await app.ready();
  return app;
}

/** An app with the real guestbook routes wired to a fresh in-memory database. */
export async function buildGuestbookTestApp(
  overrides: Partial<Config> = {},
  deps: Omit<AppDeps, "db"> = {},
): Promise<{ app: FastifyInstance; db: Db }> {
  const db = openTestDb();
  const app = await buildApp(testConfig(overrides), { ...deps, db });
  await app.ready();
  return { app, db };
}

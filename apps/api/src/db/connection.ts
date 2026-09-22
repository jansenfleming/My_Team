// Opens the SQLite file (or an in-memory database for tests). No query in this app is ever built
// by string concatenation; every statement in src/db/guestbook-repo.ts uses `?` placeholders.
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";

export type Db = InstanceType<typeof Database>;

export function openDb(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  // WAL needs a real file; an in-memory database ignores/rejects it.
  if (path !== ":memory:") db.pragma("journal_mode = WAL");
  return db;
}

/** True if the database is open and answers a trivial query. Never throws. */
export function isDbHealthy(db: Db): boolean {
  try {
    return db.open && db.prepare("SELECT 1 AS ok").get() !== undefined;
  } catch {
    return false;
  }
}

// Runs every `apps/api/migrations/*.sql` file once, in filename order, inside a transaction each,
// tracked in a `_migrations` table. Safe to call on every startup (and in every test).
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Db } from "./connection";

const DEFAULT_MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../migrations");

export function runMigrations(db: Db, dir: string = DEFAULT_MIGRATIONS_DIR): void {
  db.exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const applied = new Set(
    (db.prepare("SELECT name FROM _migrations").all() as { name: string }[]).map((r) => r.name),
  );
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run(file, new Date().toISOString());
    })();
  }
}

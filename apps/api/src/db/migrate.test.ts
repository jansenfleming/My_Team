import { describe, expect, it } from "vitest";
import { isDbHealthy, openDb } from "./connection";
import { runMigrations } from "./migrate";

describe("runMigrations", () => {
  it("creates the guestbook_entries and sessions tables", () => {
    const db = openDb(":memory:");
    runMigrations(db);
    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]
    ).map((r) => r.name);
    expect(tables).toEqual(expect.arrayContaining(["guestbook_entries", "sessions", "_migrations"]));
    db.close();
  });

  it("is idempotent: running twice does not error or duplicate rows", () => {
    const db = openDb(":memory:");
    runMigrations(db);
    runMigrations(db);
    const applied = db.prepare("SELECT COUNT(*) AS n FROM _migrations").get() as { n: number };
    expect(applied.n).toBe(1);
    db.close();
  });

  it("leaves the database healthy and empty", () => {
    const db = openDb(":memory:");
    runMigrations(db);
    expect(isDbHealthy(db)).toBe(true);
    expect(db.prepare("SELECT COUNT(*) AS n FROM guestbook_entries").get()).toEqual({ n: 0 });
    db.close();
  });
});

describe("isDbHealthy", () => {
  it("is false once the database is closed", () => {
    const db = openDb(":memory:");
    runMigrations(db);
    expect(isDbHealthy(db)).toBe(true);
    db.close();
    expect(isDbHealthy(db)).toBe(false);
  });
});

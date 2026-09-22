import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "./connection";
import { openDb } from "./connection";
import { runMigrations } from "./migrate";
import {
  countGuestbookEntries,
  deleteGuestbookEntry,
  insertGuestbookEntry,
  listGuestbookEntries,
} from "./guestbook-repo";

let db: Db;
beforeEach(() => {
  db = openDb(":memory:");
  runMigrations(db);
});
afterEach(() => db.close());

describe("insertGuestbookEntry", () => {
  it("stores handle and message verbatim, including SQLi and HTML payloads", () => {
    for (const message of [
      "'; DROP TABLE guestbook_entries;--",
      "<img src=x onerror=alert(1)>",
      "<script>alert(1)</script>",
      "a & b \" ' ` ❤",
    ]) {
      const entry = insertGuestbookEntry(db, "ghost_42", message);
      expect(entry.message).toBe(message);
      const [row] = listGuestbookEntries(db, 1).items;
      expect(row?.message).toBe(message);
    }
    // The table itself must still exist: the SQLi payload above was never executed as SQL.
    expect(countGuestbookEntries(db)).toBeGreaterThan(0);
  });

  it("assigns increasing positive integer ids and an ISO timestamp", () => {
    const a = insertGuestbookEntry(db, "a", "1");
    const b = insertGuestbookEntry(db, "b", "2");
    expect(a.id).toBeGreaterThan(0);
    expect(b.id).toBeGreaterThan(a.id);
    expect(a.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe("listGuestbookEntries", () => {
  it("returns newest first", () => {
    const a = insertGuestbookEntry(db, "a", "1");
    const b = insertGuestbookEntry(db, "b", "2");
    const c = insertGuestbookEntry(db, "c", "3");
    expect(listGuestbookEntries(db, 10).items.map((e) => e.id)).toEqual([c.id, b.id, a.id]);
  });

  it("paginates with keyset (before/nextBefore)", () => {
    const ids = Array.from({ length: 5 }, (_, i) => insertGuestbookEntry(db, "u", String(i)).id);
    const page1 = listGuestbookEntries(db, 2);
    expect(page1.items.map((e) => e.id)).toEqual([ids[4], ids[3]]);
    expect(page1.nextBefore).toBe(ids[3]);

    const page2 = listGuestbookEntries(db, 2, page1.nextBefore!);
    expect(page2.items.map((e) => e.id)).toEqual([ids[2], ids[1]]);
    expect(page2.nextBefore).toBe(ids[1]);

    const page3 = listGuestbookEntries(db, 2, page2.nextBefore!);
    expect(page3.items.map((e) => e.id)).toEqual([ids[0]]);
    expect(page3.nextBefore).toBeNull();
  });

  it("nextBefore is null when the page exactly empties the table", () => {
    insertGuestbookEntry(db, "a", "1");
    insertGuestbookEntry(db, "b", "2");
    const page = listGuestbookEntries(db, 2);
    expect(page.items).toHaveLength(2);
    expect(page.nextBefore).toBeNull();
  });

  it("returns an empty page with nextBefore null when there are no entries", () => {
    expect(listGuestbookEntries(db, 20)).toEqual({ items: [], nextBefore: null });
  });

  it("before= an id smaller than everything returns an empty page", () => {
    const id = insertGuestbookEntry(db, "a", "1").id;
    expect(listGuestbookEntries(db, 20, id)).toEqual({ items: [], nextBefore: null });
  });
});

describe("deleteGuestbookEntry (used by B4)", () => {
  it("deletes an existing row and reports success", () => {
    const { id } = insertGuestbookEntry(db, "a", "1");
    expect(deleteGuestbookEntry(db, id)).toBe(true);
    expect(countGuestbookEntries(db)).toBe(0);
  });
  it("reports false for a missing id and changes nothing", () => {
    insertGuestbookEntry(db, "a", "1");
    expect(deleteGuestbookEntry(db, 999999)).toBe(false);
    expect(countGuestbookEntries(db)).toBe(1);
  });
});

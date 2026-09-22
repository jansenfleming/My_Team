// Parameterized SQLite access for the guestbook. No route touches `db` directly.
import type { GuestbookEntry } from "@site/shared";
import type { Db } from "./connection";

type GuestbookRow = { id: number; handle: string; message: string; created_at: string };

const rowToEntry = (row: GuestbookRow): GuestbookEntry => ({
  id: row.id,
  handle: row.handle,
  message: row.message,
  createdAt: row.created_at,
});

/** Stored verbatim: no HTML escaping, no transformation beyond what the caller already validated. */
export function insertGuestbookEntry(db: Db, handle: string, message: string): GuestbookEntry {
  const createdAt = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO guestbook_entries (handle, message, created_at) VALUES (?, ?, ?)")
    .run(handle, message, createdAt);
  return { id: Number(info.lastInsertRowid), handle, message, createdAt };
}

export type GuestbookPage = { items: GuestbookEntry[]; nextBefore: number | null };

/** Newest first (id descending). `nextBefore` is the smallest id on this page, or null if this is the last page. */
export function listGuestbookEntries(db: Db, limit: number, before?: number): GuestbookPage {
  const rows = (
    before === undefined
      ? db
          .prepare("SELECT id, handle, message, created_at FROM guestbook_entries ORDER BY id DESC LIMIT ?")
          .all(limit + 1)
      : db
          .prepare(
            "SELECT id, handle, message, created_at FROM guestbook_entries WHERE id < ? ORDER BY id DESC LIMIT ?",
          )
          .all(before, limit + 1)
  ) as GuestbookRow[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return { items: page.map(rowToEntry), nextBefore: hasMore && last ? last.id : null };
}

export function countGuestbookEntries(db: Db): number {
  const row = db.prepare("SELECT COUNT(*) AS count FROM guestbook_entries").get() as { count: number };
  return row.count;
}

/** B4 will call this from the operator-only DELETE route. True if a row was deleted. */
export function deleteGuestbookEntry(db: Db, id: number): boolean {
  return db.prepare("DELETE FROM guestbook_entries WHERE id = ?").run(id).changes > 0;
}

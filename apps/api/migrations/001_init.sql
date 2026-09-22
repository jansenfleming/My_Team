-- Initial schema (board task B3). Applied once, in order, by the migration runner in src/db/migrate.ts.
-- SQLite is single-writer; every write in this app uses a parameterized statement, never string
-- concatenation.

CREATE TABLE guestbook_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  handle     TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL -- ISO-8601 UTC with milliseconds, e.g. 2026-09-21T17:00:00.000Z
);

-- Keyset pagination (contract: "before=<id>", newest first) reads by id descending.
CREATE INDEX idx_guestbook_entries_id_desc ON guestbook_entries (id DESC);

CREATE TABLE sessions (
  id_hash    TEXT PRIMARY KEY, -- sha256 of the opaque session id; the raw id is never stored (B4)
  username   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL -- absolute expiry (8h from creation, contract section 3)
);

-- Session lookups and expiry cleanup are both by expires_at (B4).
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);

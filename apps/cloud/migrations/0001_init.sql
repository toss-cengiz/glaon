-- 0001_init.sql — Phase 2 cloud schema. See ADR 0020 (D1 / SQLite-on-edge) and ADR
-- 0021 (pairing protocol + relay credentials, hash storage). Tables:
--
-- - users: Clerk userId mapping. Clerk is the IdP per ADR 0019; we keep a thin row
--   per known user so audit logs and home FKs stay app-local even if Clerk is
--   transient. clerk_user_id is the unique business key.
--
-- - homes: per-home record. owner_user_id is the only access guard; every query
--   filters by it (cross-tenant test ensures user A cannot read user B's row).
--
-- - relay_secrets_hash: bcrypt(relay_secret) per ADR 0021. The plaintext secret
--   never touches D1 — it lives only in the addon's /data/options.json after a
--   successful claim. ON DELETE CASCADE removes the hash when the home is deleted,
--   killing future relay handshakes for that secret.
--
-- - home_events: append-only audit log. Every mutating op writes a row here.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_user_id TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS homes (
  id TEXT PRIMARY KEY,
  owner_user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER,
  revoked_at INTEGER,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_homes_owner ON homes(owner_user_id);

CREATE TABLE IF NOT EXISTS relay_secrets_hash (
  home_id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (home_id) REFERENCES homes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS home_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id INTEGER,
  home_id TEXT,
  ip TEXT,
  user_agent TEXT,
  reason TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_home_events_home ON home_events(home_id);
CREATE INDEX IF NOT EXISTS idx_home_events_user ON home_events(user_id);

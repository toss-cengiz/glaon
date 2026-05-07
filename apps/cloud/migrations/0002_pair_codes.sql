-- 0002_pair_codes.sql — pairing flow per ADR 0021. The 6-digit code is the OOB
-- channel: the client mints it (POST /pair/initiate), the user reads it off
-- their UI, types it into the addon's /pair page, the addon claims it (POST
-- /pair/claim) and walks away with the relay_secret.
--
-- Codes are single-use (unique on `code`), bound to a Clerk user, expire after
-- 10 min. `claimed_at` flips on the first successful claim — second claim of
-- the same code returns 410.
--
-- `pair_failure_attempts` tracks per-IP bad-code attempts so the rate-limit
-- middleware can lock out brute-force callers without persisting a separate
-- store. Rows expire alongside their code window.

CREATE TABLE IF NOT EXISTS pair_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  clerk_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  claimed_at INTEGER,
  claimed_home_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_pair_codes_clerk ON pair_codes(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_pair_codes_expires ON pair_codes(expires_at);

CREATE TABLE IF NOT EXISTS pair_failure_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER
);

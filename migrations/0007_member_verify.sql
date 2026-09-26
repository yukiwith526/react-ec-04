ALTER TABLE customers ADD COLUMN email_verified_at TEXT;

CREATE TABLE pending_signups (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zip TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE auth_rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

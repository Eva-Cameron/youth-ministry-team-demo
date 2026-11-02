-- Review layer for staging: people invited to comment, their threads and replies.
-- Tokens are never stored, only their SHA-256 hashes.
CREATE TABLE IF NOT EXISTS reviewers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'team', 'owner')),
  token_hash TEXT NOT NULL UNIQUE,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  anchor TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  viewport INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  author_id INTEGER NOT NULL REFERENCES reviewers(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES reviewers(id),
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Fixed one-minute windows per reviewer, for rate limiting writes.
CREATE TABLE IF NOT EXISTS hits (
  reviewer_id INTEGER NOT NULL,
  window TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (reviewer_id, window)
);
CREATE INDEX IF NOT EXISTS threads_page ON threads(page);
CREATE INDEX IF NOT EXISTS comments_thread ON comments(thread_id);

CREATE TABLE IF NOT EXISTS change_reviews (
  id TEXT PRIMARY KEY,
  change_id TEXT NOT NULL UNIQUE,
  decision TEXT NOT NULL,
  review_note TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_change_reviews_decision
  ON change_reviews(decision);

CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
  id TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token
  ON unsubscribe_tokens(token);

CREATE TABLE IF NOT EXISTS alert_jobs (
  id TEXT PRIMARY KEY,
  change_id TEXT NOT NULL,
  monitor_id TEXT NOT NULL,
  subscriber_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  subject TEXT NOT NULL,
  payload_json TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  provider TEXT,
  provider_message_id TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_jobs_unique
  ON alert_jobs(change_id, monitor_id, subscriber_id);

CREATE INDEX IF NOT EXISTS idx_alert_jobs_status_created
  ON alert_jobs(status, created_at);

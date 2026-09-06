CREATE TABLE IF NOT EXISTS email_subscribers (
  id TEXT PRIMARY KEY,
  visitor_id TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  consent_source TEXT NOT NULL DEFAULT 'monitor_product',
  consent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_subscribers_email
  ON email_subscribers(email);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_visitor
  ON email_subscribers(visitor_id);

CREATE TABLE IF NOT EXISTS monitoring_recipients (
  id TEXT PRIMARY KEY,
  monitor_id TEXT NOT NULL,
  subscriber_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_monitor_recipient_unique
  ON monitoring_recipients(monitor_id, subscriber_id, channel);

CREATE INDEX IF NOT EXISTS idx_monitor_recipients_monitor
  ON monitoring_recipients(monitor_id);

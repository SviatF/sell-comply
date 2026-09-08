CREATE TABLE IF NOT EXISTS regulatory_rule_review_state (
  id TEXT PRIMARY KEY,
  rule_key TEXT NOT NULL,
  rule_version INTEGER NOT NULL,
  last_reviewed_at TEXT,
  reviewed_by TEXT,
  review_origin TEXT NOT NULL DEFAULT 'manual',
  last_verified_at TEXT,
  verified_by TEXT,
  verified_source_id TEXT,
  verified_source_hash TEXT,
  verification_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_rule_review_unique
  ON regulatory_rule_review_state(rule_key, rule_version);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_review_reviewed
  ON regulatory_rule_review_state(last_reviewed_at);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_review_verified
  ON regulatory_rule_review_state(last_verified_at);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_review_source
  ON regulatory_rule_review_state(verified_source_id);

CREATE TABLE IF NOT EXISTS regulatory_update_reviews (
  id TEXT PRIMARY KEY,
  change_id TEXT NOT NULL UNIQUE,
  triage_outcome TEXT NOT NULL,
  seller_alert_eligible INTEGER NOT NULL DEFAULT 0,
  requires_rule_update INTEGER NOT NULL DEFAULT 0,
  review_note TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regulatory_update_reviews_outcome
  ON regulatory_update_reviews(triage_outcome, reviewed_at);

CREATE INDEX IF NOT EXISTS idx_regulatory_update_reviews_rule_update
  ON regulatory_update_reviews(requires_rule_update, reviewed_at);

CREATE TABLE IF NOT EXISTS regulatory_update_review_rules (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_update_review_rule_unique
  ON regulatory_update_review_rules(review_id, rule_key, relation_type);

CREATE INDEX IF NOT EXISTS idx_regulatory_update_review_rule_lookup
  ON regulatory_update_review_rules(rule_key, relation_type);

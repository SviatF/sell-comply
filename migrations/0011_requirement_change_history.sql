CREATE TABLE IF NOT EXISTS regulatory_change_events (
  id TEXT PRIMARY KEY,
  legacy_change_id TEXT,
  event_type TEXT NOT NULL,
  source_id TEXT,
  rule_key TEXT,
  from_rule_version INTEGER,
  to_rule_version INTEGER,
  previous_source_hash TEXT,
  new_source_hash TEXT,
  changed_fields_json TEXT,
  summary TEXT,
  effective_from TEXT,
  detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decision TEXT,
  reviewed_by TEXT,
  review_note TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regulatory_change_events_legacy
  ON regulatory_change_events(legacy_change_id);

CREATE INDEX IF NOT EXISTS idx_regulatory_change_events_source
  ON regulatory_change_events(source_id, detected_at);

CREATE INDEX IF NOT EXISTS idx_regulatory_change_events_rule
  ON regulatory_change_events(rule_key, detected_at);

CREATE INDEX IF NOT EXISTS idx_regulatory_change_events_type
  ON regulatory_change_events(event_type, detected_at);

CREATE INDEX IF NOT EXISTS idx_regulatory_change_events_decision
  ON regulatory_change_events(decision, reviewed_at);

CREATE TABLE IF NOT EXISTS regulatory_change_impacts (
  id TEXT PRIMARY KEY,
  change_event_id TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  rule_version INTEGER NOT NULL,
  market_slug TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  impact_phase TEXT NOT NULL,
  applicability_status TEXT NOT NULL,
  required_features_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_change_impact_unique
  ON regulatory_change_impacts(
    change_event_id,
    rule_key,
    rule_version,
    market_slug,
    product_slug,
    impact_phase
  );

CREATE INDEX IF NOT EXISTS idx_regulatory_change_impacts_event
  ON regulatory_change_impacts(change_event_id);

CREATE INDEX IF NOT EXISTS idx_regulatory_change_impacts_market_product
  ON regulatory_change_impacts(market_slug, product_slug, created_at);

CREATE INDEX IF NOT EXISTS idx_regulatory_change_impacts_rule
  ON regulatory_change_impacts(rule_key, rule_version);

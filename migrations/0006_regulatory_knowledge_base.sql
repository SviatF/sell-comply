CREATE TABLE IF NOT EXISTS regulatory_rules (
  rule_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  short_name TEXT NOT NULL,
  rule_group TEXT NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  current_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regulatory_rules_group
  ON regulatory_rules(rule_group);

CREATE INDEX IF NOT EXISTS idx_regulatory_rules_active
  ON regulatory_rules(is_active);

CREATE TABLE IF NOT EXISTS regulatory_rule_versions (
  id TEXT PRIMARY KEY,
  rule_key TEXT NOT NULL,
  version INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  why_text TEXT NOT NULL,
  documents_json TEXT NOT NULL,
  labels_json TEXT NOT NULL,
  actions_json TEXT NOT NULL,
  markets_json TEXT NOT NULL,
  products_json TEXT,
  required_features_json TEXT,
  excluded_products_json TEXT,
  source_label TEXT NOT NULL,
  source_url TEXT NOT NULL,
  effective_from TEXT,
  effective_to TEXT,
  transition_note TEXT,
  last_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_rule_version_unique
  ON regulatory_rule_versions(rule_key, version);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_versions_hash
  ON regulatory_rule_versions(rule_key, content_hash);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_versions_rule
  ON regulatory_rule_versions(rule_key, version);

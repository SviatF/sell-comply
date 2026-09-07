CREATE TABLE IF NOT EXISTS regulatory_applicability (
  id TEXT PRIMARY KEY,
  rule_key TEXT NOT NULL,
  rule_version INTEGER NOT NULL,
  market_slug TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  status TEXT NOT NULL,
  feature_match_mode TEXT NOT NULL DEFAULT 'all',
  is_current INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_applicability_unique
  ON regulatory_applicability(rule_key, rule_version, market_slug, product_slug);

CREATE INDEX IF NOT EXISTS idx_regulatory_applicability_lookup
  ON regulatory_applicability(market_slug, product_slug, is_current);

CREATE INDEX IF NOT EXISTS idx_regulatory_applicability_rule
  ON regulatory_applicability(rule_key, rule_version, is_current);

CREATE TABLE IF NOT EXISTS regulatory_applicability_features (
  id TEXT PRIMARY KEY,
  applicability_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  required_value INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_applicability_feature_unique
  ON regulatory_applicability_features(applicability_id, feature_key);

CREATE INDEX IF NOT EXISTS idx_regulatory_applicability_feature_lookup
  ON regulatory_applicability_features(feature_key, required_value);

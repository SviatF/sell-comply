CREATE TABLE IF NOT EXISTS regulatory_source_registry (
  source_id TEXT PRIMARY KEY,
  canonical_url TEXT NOT NULL UNIQUE,
  canonical_host TEXT NOT NULL,
  authority_slug TEXT NOT NULL,
  authority_name TEXT NOT NULL,
  jurisdiction_slug TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'guidance',
  is_primary INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regulatory_source_registry_authority
  ON regulatory_source_registry(authority_slug);

CREATE INDEX IF NOT EXISTS idx_regulatory_source_registry_jurisdiction
  ON regulatory_source_registry(jurisdiction_slug);

CREATE INDEX IF NOT EXISTS idx_regulatory_source_registry_kind
  ON regulatory_source_registry(source_kind);

CREATE TABLE IF NOT EXISTS regulatory_source_markets (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  market_slug TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_source_market_unique
  ON regulatory_source_markets(source_id, market_slug);

CREATE INDEX IF NOT EXISTS idx_regulatory_source_market_lookup
  ON regulatory_source_markets(market_slug, source_id);

CREATE TABLE IF NOT EXISTS regulatory_rule_sources (
  id TEXT PRIMARY KEY,
  rule_key TEXT NOT NULL,
  rule_version INTEGER NOT NULL,
  source_id TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'primary',
  is_current INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_rule_source_unique
  ON regulatory_rule_sources(rule_key, rule_version, source_id);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_source_rule
  ON regulatory_rule_sources(rule_key, rule_version, is_current);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_source_source
  ON regulatory_rule_sources(source_id, is_current);

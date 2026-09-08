CREATE TABLE IF NOT EXISTS regulatory_coverage_snapshots (
  id TEXT PRIMARY KEY,
  product_slug TEXT NOT NULL,
  market_slug TEXT NOT NULL,
  rule_count INTEGER NOT NULL DEFAULT 0,
  source_covered_rules INTEGER NOT NULL DEFAULT 0,
  timing_covered_rules INTEGER NOT NULL DEFAULT 0,
  structured_timing_rules INTEGER NOT NULL DEFAULT 0,
  reviewed_rules INTEGER NOT NULL DEFAULT 0,
  manually_reviewed_rules INTEGER NOT NULL DEFAULT 0,
  verified_rules INTEGER NOT NULL DEFAULT 0,
  stale_verified_rules INTEGER NOT NULL DEFAULT 0,
  untriaged_updates INTEGER NOT NULL DEFAULT 0,
  needs_rule_update INTEGER NOT NULL DEFAULT 0,
  source_coverage REAL NOT NULL DEFAULT 0,
  timing_coverage REAL NOT NULL DEFAULT 0,
  review_coverage REAL NOT NULL DEFAULT 0,
  verification_coverage REAL NOT NULL DEFAULT 0,
  quality_score INTEGER NOT NULL DEFAULT 0,
  readiness TEXT NOT NULL DEFAULT 'blocked',
  is_indexable INTEGER NOT NULL DEFAULT 0,
  gaps_json TEXT NOT NULL DEFAULT '[]',
  computed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_coverage_pair
  ON regulatory_coverage_snapshots(product_slug, market_slug);

CREATE INDEX IF NOT EXISTS idx_regulatory_coverage_readiness
  ON regulatory_coverage_snapshots(readiness, quality_score);

CREATE INDEX IF NOT EXISTS idx_regulatory_coverage_market
  ON regulatory_coverage_snapshots(market_slug, readiness);

CREATE INDEX IF NOT EXISTS idx_regulatory_coverage_product
  ON regulatory_coverage_snapshots(product_slug, readiness);

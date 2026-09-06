-- Regulatory source monitoring foundation

ALTER TABLE sources ADD COLUMN market_slug TEXT;
ALTER TABLE sources ADD COLUMN last_content_hash TEXT;
ALTER TABLE sources ADD COLUMN last_http_status INTEGER;
ALTER TABLE sources ADD COLUMN last_checked_at TEXT;

CREATE INDEX IF NOT EXISTS idx_sources_market_slug ON sources(market_slug);

ALTER TABLE rule_changes ADD COLUMN source_id TEXT;
ALTER TABLE rule_changes ADD COLUMN review_status TEXT NOT NULL DEFAULT 'needs_review';

CREATE INDEX IF NOT EXISTS idx_rule_changes_source_id ON rule_changes(source_id);
CREATE INDEX IF NOT EXISTS idx_rule_changes_review_status ON rule_changes(review_status);

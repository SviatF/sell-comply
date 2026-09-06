CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  visitor_id TEXT,
  event_name TEXT NOT NULL,
  path TEXT,
  product_slug TEXT,
  market_slug TEXT,
  marketplace_slug TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_name_created ON events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_product_market ON events(product_slug, market_slug);

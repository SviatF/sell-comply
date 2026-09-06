-- SellComply Product Core
-- Apply with: npx wrangler d1 migrations apply sell-comply-db --remote

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checks (
  id TEXT PRIMARY KEY,
  visitor_id TEXT,
  user_id TEXT,
  raw_product TEXT NOT NULL,
  product_slug TEXT,
  category TEXT,
  market_slug TEXT NOT NULL,
  market_name TEXT NOT NULL,
  marketplace_slug TEXT,
  marketplace_name TEXT,
  status TEXT NOT NULL DEFAULT 'needs_review',
  certainty TEXT,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_checks_visitor_id ON checks(visitor_id);
CREATE INDEX IF NOT EXISTS idx_checks_user_id ON checks(user_id);
CREATE INDEX IF NOT EXISTS idx_checks_created_at ON checks(created_at);

CREATE TABLE IF NOT EXISTS monitoring_subscriptions (
  id TEXT PRIMARY KEY,
  visitor_id TEXT,
  user_id TEXT,
  raw_product TEXT NOT NULL,
  product_slug TEXT,
  market_slug TEXT NOT NULL,
  market_name TEXT NOT NULL,
  marketplace_slug TEXT,
  marketplace_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_checked_at TEXT,
  next_check_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_monitoring_visitor_id ON monitoring_subscriptions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_user_id ON monitoring_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_active ON monitoring_subscriptions(is_active);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  regulator TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'official',
  last_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requirements (
  id TEXT PRIMARY KEY,
  product_slug TEXT,
  market_slug TEXT NOT NULL,
  marketplace_slug TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  applicability TEXT NOT NULL DEFAULT 'verify',
  effective_date TEXT,
  version TEXT,
  source_id TEXT,
  last_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE INDEX IF NOT EXISTS idx_requirements_market_product ON requirements(market_slug, product_slug);
CREATE INDEX IF NOT EXISTS idx_requirements_marketplace ON requirements(marketplace_slug);

CREATE TABLE IF NOT EXISTS rule_changes (
  id TEXT PRIMARY KEY,
  requirement_id TEXT,
  market_slug TEXT NOT NULL,
  product_slug TEXT,
  change_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  effective_date TEXT,
  detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_url TEXT,
  FOREIGN KEY (requirement_id) REFERENCES requirements(id)
);

CREATE INDEX IF NOT EXISTS idx_rule_changes_market ON rule_changes(market_slug);
CREATE INDEX IF NOT EXISTS idx_rule_changes_detected ON rule_changes(detected_at);

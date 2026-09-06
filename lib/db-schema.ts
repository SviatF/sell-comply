import type { SellComplyD1 } from "@/lib/cloudflare-db";

let schemaReady = false;

const statements = [
  `CREATE TABLE IF NOT EXISTS schema_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS checks (
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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_checks_visitor_id ON checks(visitor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_checks_user_id ON checks(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_checks_created_at ON checks(created_at)`,
  `CREATE TABLE IF NOT EXISTS monitoring_subscriptions (
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
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_monitoring_visitor_id ON monitoring_subscriptions(visitor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_monitoring_user_id ON monitoring_subscriptions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_monitoring_active ON monitoring_subscriptions(is_active)`,
  `CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    jurisdiction TEXT NOT NULL,
    market_slug TEXT,
    regulator TEXT,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL DEFAULT 'official',
    last_verified_at TEXT,
    last_content_hash TEXT,
    last_http_status INTEGER,
    last_checked_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sources_market_slug ON sources(market_slug)`,
  `CREATE TABLE IF NOT EXISTS requirements (
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
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_requirements_market_product ON requirements(market_slug, product_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_requirements_marketplace ON requirements(marketplace_slug)`,
  `CREATE TABLE IF NOT EXISTS rule_changes (
    id TEXT PRIMARY KEY,
    requirement_id TEXT,
    source_id TEXT,
    market_slug TEXT NOT NULL,
    product_slug TEXT,
    change_type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    effective_date TEXT,
    detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_url TEXT,
    review_status TEXT NOT NULL DEFAULT 'needs_review'
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rule_changes_market ON rule_changes(market_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_rule_changes_detected ON rule_changes(detected_at)`,
  `CREATE INDEX IF NOT EXISTS idx_rule_changes_source_id ON rule_changes(source_id)`,
  `CREATE INDEX IF NOT EXISTS idx_rule_changes_review_status ON rule_changes(review_status)`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    visitor_id TEXT,
    event_name TEXT NOT NULL,
    path TEXT,
    product_slug TEXT,
    market_slug TEXT,
    marketplace_slug TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_name_created ON events(event_name, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_events_product_market ON events(product_slug, market_slug)`,
  `CREATE TABLE IF NOT EXISTS email_subscribers (
    id TEXT PRIMARY KEY,
    visitor_id TEXT,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    consent_source TEXT NOT NULL DEFAULT 'monitor_product',
    consent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email)`,
  `CREATE INDEX IF NOT EXISTS idx_email_subscribers_visitor ON email_subscribers(visitor_id)`,
  `CREATE TABLE IF NOT EXISTS monitoring_recipients (
    id TEXT PRIMARY KEY,
    monitor_id TEXT NOT NULL,
    subscriber_id TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'email',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_monitor_recipient_unique ON monitoring_recipients(monitor_id, subscriber_id, channel)`,
  `CREATE INDEX IF NOT EXISTS idx_monitor_recipients_monitor ON monitoring_recipients(monitor_id)`,
];

export async function ensureDatabaseSchema(db: SellComplyD1) {
  if (schemaReady) return;

  for (const statement of statements) {
    await db.prepare(statement).run();
  }

  await db
    .prepare(
      `INSERT INTO schema_meta (key, value, updated_at)
       VALUES ('schema_version', '4', CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = CURRENT_TIMESTAMP`
    )
    .run();

  schemaReady = true;
}

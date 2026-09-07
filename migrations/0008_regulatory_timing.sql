CREATE TABLE IF NOT EXISTS regulatory_rule_timing (
  id TEXT PRIMARY KEY,
  rule_key TEXT NOT NULL,
  rule_version INTEGER NOT NULL,
  effective_from TEXT,
  effective_to TEXT,
  transition_start TEXT,
  transition_end TEXT,
  timing_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_rule_timing_unique
  ON regulatory_rule_timing(rule_key, rule_version);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_timing_effective
  ON regulatory_rule_timing(effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_regulatory_rule_timing_transition
  ON regulatory_rule_timing(transition_start, transition_end);

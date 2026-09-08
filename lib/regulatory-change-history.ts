import type { SellComplyD1 } from "./cloudflare-db";

export type RuleVersionSnapshot = {
  status: string | null;
  summary: string | null;
  why_text: string | null;
  documents_json: string | null;
  labels_json: string | null;
  actions_json: string | null;
  markets_json: string | null;
  products_json: string | null;
  required_features_json: string | null;
  excluded_products_json: string | null;
  source_label: string | null;
  source_url: string | null;
  effective_from: string | null;
  effective_to: string | null;
  transition_note: string | null;
};

const VERSION_FIELDS: Array<keyof RuleVersionSnapshot> = [
  "status",
  "summary",
  "why_text",
  "documents_json",
  "labels_json",
  "actions_json",
  "markets_json",
  "products_json",
  "required_features_json",
  "excluded_products_json",
  "source_label",
  "source_url",
  "effective_from",
  "effective_to",
  "transition_note",
];

function stableId(prefix: string, value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16)}`;
}

export function diffRuleVersionSnapshots(
  before: RuleVersionSnapshot,
  after: RuleVersionSnapshot
) {
  return VERSION_FIELDS.filter(
    (field) => (before[field] ?? null) !== (after[field] ?? null)
  );
}

export function summarizeRuleVersionChange(
  ruleKey: string,
  fromVersion: number,
  toVersion: number,
  changedFields: string[]
) {
  const changed = changedFields.length
    ? changedFields.join(", ")
    : "version metadata";

  return `${ruleKey} changed from v${fromVersion} to v${toVersion}. Updated fields: ${changed}.`;
}

type ApplicabilitySnapshotRow = {
  id: string;
  rule_key: string;
  rule_version: number;
  market_slug: string;
  product_slug: string;
  status: string;
  required_features: string | null;
};

async function loadApplicabilitySnapshot(
  db: SellComplyD1,
  ruleKey: string,
  ruleVersion: number
) {
  const rows = await db
    .prepare(
      `SELECT
         a.id,
         a.rule_key,
         a.rule_version,
         a.market_slug,
         a.product_slug,
         a.status,
         GROUP_CONCAT(f.feature_key) AS required_features
       FROM regulatory_applicability a
       LEFT JOIN regulatory_applicability_features f
         ON f.applicability_id = a.id
        AND f.required_value = 1
       WHERE a.rule_key = ?
         AND a.rule_version = ?
       GROUP BY
         a.id,
         a.rule_key,
         a.rule_version,
         a.market_slug,
         a.product_slug,
         a.status
       ORDER BY a.market_slug, a.product_slug`
    )
    .bind(ruleKey, ruleVersion)
    .all<ApplicabilitySnapshotRow>();

  return rows.results || [];
}

async function insertImpactRows(
  db: SellComplyD1,
  eventId: string,
  rows: ApplicabilitySnapshotRow[],
  phase: "detected" | "before" | "after"
) {
  let inserted = 0;

  for (const row of rows) {
    const features = row.required_features
      ? row.required_features
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .sort()
      : [];

    await db
      .prepare(
        `INSERT INTO regulatory_change_impacts (
           id, change_event_id, rule_key, rule_version,
           market_slug, product_slug, impact_phase,
           applicability_status, required_features_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(
           change_event_id,
           rule_key,
           rule_version,
           market_slug,
           product_slug,
           impact_phase
         ) DO UPDATE SET
           applicability_status = excluded.applicability_status,
           required_features_json = excluded.required_features_json`
      )
      .bind(
        stableId(
          "impact",
          [
            eventId,
            row.rule_key,
            row.rule_version,
            row.market_slug,
            row.product_slug,
            phase,
          ].join("|")
        ),
        eventId,
        row.rule_key,
        Number(row.rule_version),
        row.market_slug,
        row.product_slug,
        phase,
        row.status,
        JSON.stringify(features)
      )
      .run();

    inserted += 1;
  }

  return inserted;
}

export async function recordSourceFingerprintChange(
  db: SellComplyD1,
  {
    sourceId,
    marketSlug,
    sourceTitle,
    sourceUrl,
    previousHash,
    newHash,
  }: {
    sourceId: string;
    marketSlug: string | null;
    sourceTitle: string;
    sourceUrl: string;
    previousHash: string;
    newHash: string;
  }
) {
  const eventId = stableId(
    "change",
    ["source_fingerprint_changed", sourceId, previousHash, newHash].join("|")
  );
  const legacyChangeId = stableId(
    "legacy",
    [sourceId, previousHash, newHash].join("|")
  );

  await db
    .prepare(
      `INSERT INTO rule_changes (
         id, market_slug, change_type, title, summary,
         detected_at, source_url, source_id, review_status
       ) VALUES (
         ?, ?, 'source_updated', ?, ?,
         CURRENT_TIMESTAMP, ?, ?, 'needs_review'
       )
       ON CONFLICT(id) DO NOTHING`
    )
    .bind(
      legacyChangeId,
      marketSlug || "global",
      `Official source updated: ${sourceTitle}`,
      "SellComply detected a content fingerprint change on an official regulatory source. This is not treated as a confirmed regulatory requirement change until reviewed.",
      sourceUrl,
      sourceId
    )
    .run();

  await db
    .prepare(
      `INSERT INTO regulatory_change_events (
         id, legacy_change_id, event_type, source_id,
         previous_source_hash, new_source_hash,
         summary, detected_at, created_at, updated_at
       ) VALUES (
         ?, ?, 'source_fingerprint_changed', ?,
         ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       ON CONFLICT(id) DO UPDATE SET
         legacy_change_id = excluded.legacy_change_id,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      eventId,
      legacyChangeId,
      sourceId,
      previousHash,
      newHash,
      `Official source fingerprint changed: ${sourceTitle}.`
    )
    .run();

  const linkedRules = await db
    .prepare(
      `SELECT DISTINCT rs.rule_key, rs.rule_version
       FROM regulatory_rule_sources rs
       INNER JOIN regulatory_rules r
         ON r.rule_key = rs.rule_key
        AND r.current_version = rs.rule_version
       WHERE rs.source_id = ?
         AND rs.is_current = 1
         AND r.is_active = 1`
    )
    .bind(sourceId)
    .all<{ rule_key: string; rule_version: number }>();

  let affectedPairs = 0;

  for (const rule of linkedRules.results || []) {
    const snapshot = await loadApplicabilitySnapshot(
      db,
      rule.rule_key,
      Number(rule.rule_version)
    );
    affectedPairs += await insertImpactRows(
      db,
      eventId,
      snapshot,
      "detected"
    );
  }

  return {
    eventId,
    legacyChangeId,
    affectedRules: linkedRules.results?.length || 0,
    affectedPairs,
  };
}

async function loadVersionSnapshot(
  db: SellComplyD1,
  ruleKey: string,
  version: number
) {
  const row = await db
    .prepare(
      `SELECT
         status,
         summary,
         why_text,
         documents_json,
         labels_json,
         actions_json,
         markets_json,
         products_json,
         required_features_json,
         excluded_products_json,
         source_label,
         source_url,
         effective_from,
         effective_to,
         transition_note
       FROM regulatory_rule_versions
       WHERE rule_key = ?
         AND version = ?
       LIMIT 1`
    )
    .bind(ruleKey, version)
    .first<RuleVersionSnapshot>();

  if (!row) throw new Error("RULE_VERSION_NOT_FOUND");
  return row;
}

export async function recordRuleVersionChange(
  db: SellComplyD1,
  {
    ruleKey,
    fromVersion,
    toVersion,
  }: {
    ruleKey: string;
    fromVersion: number;
    toVersion: number;
  }
) {
  const before = await loadVersionSnapshot(db, ruleKey, fromVersion);
  const after = await loadVersionSnapshot(db, ruleKey, toVersion);
  const changedFields = diffRuleVersionSnapshots(before, after);

  const source = await db
    .prepare(
      `SELECT source_id
       FROM regulatory_rule_sources
       WHERE rule_key = ?
         AND rule_version = ?
         AND relation_type = 'primary'
       LIMIT 1`
    )
    .bind(ruleKey, toVersion)
    .first<{ source_id: string }>();

  const timing = await db
    .prepare(
      `SELECT effective_from
       FROM regulatory_rule_timing
       WHERE rule_key = ?
         AND rule_version = ?
       LIMIT 1`
    )
    .bind(ruleKey, toVersion)
    .first<{ effective_from: string | null }>();

  const eventId = stableId(
    "change",
    ["rule_version_created", ruleKey, fromVersion, toVersion].join("|")
  );

  await db
    .prepare(
      `INSERT INTO regulatory_change_events (
         id, event_type, source_id, rule_key,
         from_rule_version, to_rule_version,
         changed_fields_json, summary, effective_from,
         detected_at, created_at, updated_at
       ) VALUES (
         ?, 'rule_version_created', ?, ?,
         ?, ?, ?, ?, ?,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
       )
       ON CONFLICT(id) DO UPDATE SET
         source_id = excluded.source_id,
         changed_fields_json = excluded.changed_fields_json,
         summary = excluded.summary,
         effective_from = excluded.effective_from,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      eventId,
      source?.source_id || null,
      ruleKey,
      fromVersion,
      toVersion,
      JSON.stringify(changedFields),
      summarizeRuleVersionChange(
        ruleKey,
        fromVersion,
        toVersion,
        changedFields
      ),
      timing?.effective_from || null
    )
    .run();

  const beforeImpacts = await loadApplicabilitySnapshot(
    db,
    ruleKey,
    fromVersion
  );
  const afterImpacts = await loadApplicabilitySnapshot(
    db,
    ruleKey,
    toVersion
  );

  const beforeCount = await insertImpactRows(
    db,
    eventId,
    beforeImpacts,
    "before"
  );
  const afterCount = await insertImpactRows(
    db,
    eventId,
    afterImpacts,
    "after"
  );

  return {
    eventId,
    changedFields,
    beforeImpacts: beforeCount,
    afterImpacts: afterCount,
  };
}

export async function syncChangeReviewDecision(
  db: SellComplyD1,
  {
    legacyChangeId,
    decision,
    reviewedBy,
    reviewNote,
  }: {
    legacyChangeId: string;
    decision: "approved" | "rejected";
    reviewedBy?: string | null;
    reviewNote?: string | null;
  }
) {
  await db
    .prepare(
      `UPDATE regulatory_change_events
       SET decision = ?,
           reviewed_by = ?,
           review_note = ?,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE legacy_change_id = ?`
    )
    .bind(
      decision,
      reviewedBy || "admin",
      reviewNote || null,
      legacyChangeId
    )
    .run();

  return { synced: true };
}

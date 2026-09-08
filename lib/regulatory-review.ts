import type { SellComplyD1 } from "./cloudflare-db";
import type { RegulatoryRule } from "./regulatory-rules";
import { syncKnowledgeCoverage } from "./regulatory-coverage";

export type RuleReviewStatus =
  | "unreviewed"
  | "reviewed"
  | "verified"
  | "stale";

export type RuleReviewState = {
  lastReviewedAt: string | null;
  reviewedBy: string | null;
  reviewOrigin: string | null;
  lastVerifiedAt: string | null;
  verifiedBy: string | null;
  verifiedSourceId: string | null;
  verifiedSourceHash: string | null;
  currentSourceHash: string | null;
  sourceLastCheckedAt: string | null;
};

function stableId(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `review_${(hash >>> 0).toString(16)}`;
}

export function deriveRuleReviewStatus(
  state: RuleReviewState
): RuleReviewStatus {
  if (
    state.lastVerifiedAt &&
    state.verifiedSourceHash &&
    state.currentSourceHash &&
    state.verifiedSourceHash !== state.currentSourceHash
  ) {
    return "stale";
  }

  if (state.lastVerifiedAt) return "verified";
  if (state.lastReviewedAt) return "reviewed";
  return "unreviewed";
}

export function sourceChangedSinceVerification(state: RuleReviewState) {
  return Boolean(
    state.verifiedSourceHash &&
      state.currentSourceHash &&
      state.verifiedSourceHash !== state.currentSourceHash
  );
}

export async function ensureRuleReviewState(
  db: SellComplyD1,
  rule: RegulatoryRule,
  ruleVersion: number
) {
  const existing = await db
    .prepare(
      `SELECT id
       FROM regulatory_rule_review_state
       WHERE rule_key = ? AND rule_version = ?
       LIMIT 1`
    )
    .bind(rule.id, ruleVersion)
    .first<{ id: string }>();

  if (existing?.id) return;

  await db
    .prepare(
      `INSERT INTO regulatory_rule_review_state (
         id, rule_key, rule_version,
         last_reviewed_at, reviewed_by, review_origin,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, NULL, 'curated_rule_pack', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .bind(
      stableId(`${rule.id}|${ruleVersion}`),
      rule.id,
      ruleVersion,
      rule.lastVerified || null
    )
    .run();
}

type PrimarySourceRow = {
  source_id: string;
  last_content_hash: string | null;
  last_checked_at: string | null;
};

async function getPrimaryCurrentSource(
  db: SellComplyD1,
  ruleKey: string,
  ruleVersion: number
) {
  return db
    .prepare(
      `SELECT
         rs.source_id,
         s.last_content_hash,
         s.last_checked_at
       FROM regulatory_rule_sources rs
       INNER JOIN sources s ON s.id = rs.source_id
       WHERE rs.rule_key = ?
         AND rs.rule_version = ?
         AND rs.relation_type = 'primary'
       LIMIT 1`
    )
    .bind(ruleKey, ruleVersion)
    .first<PrimarySourceRow>();
}

export async function markRuleReviewed(
  db: SellComplyD1,
  {
    ruleKey,
    ruleVersion,
    reviewedBy,
    note,
  }: {
    ruleKey: string;
    ruleVersion: number;
    reviewedBy: string;
    note?: string;
  }
) {
  const row = await db
    .prepare(
      `SELECT id
       FROM regulatory_rule_review_state
       WHERE rule_key = ? AND rule_version = ?
       LIMIT 1`
    )
    .bind(ruleKey, ruleVersion)
    .first<{ id: string }>();

  if (!row?.id) throw new Error("RULE_REVIEW_STATE_NOT_FOUND");

  await db
    .prepare(
      `UPDATE regulatory_rule_review_state
       SET last_reviewed_at = CURRENT_TIMESTAMP,
           reviewed_by = ?,
           review_origin = 'manual',
           verification_note = COALESCE(?, verification_note),
           updated_at = CURRENT_TIMESTAMP
       WHERE rule_key = ? AND rule_version = ?`
    )
    .bind(reviewedBy, note || null, ruleKey, ruleVersion)
    .run();

  await syncKnowledgeCoverage(db);
  return { reviewed: true };
}

export async function markRuleVerified(
  db: SellComplyD1,
  {
    ruleKey,
    ruleVersion,
    verifiedBy,
    note,
  }: {
    ruleKey: string;
    ruleVersion: number;
    verifiedBy: string;
    note?: string;
  }
) {
  const row = await db
    .prepare(
      `SELECT id
       FROM regulatory_rule_review_state
       WHERE rule_key = ? AND rule_version = ?
       LIMIT 1`
    )
    .bind(ruleKey, ruleVersion)
    .first<{ id: string }>();

  if (!row?.id) throw new Error("RULE_REVIEW_STATE_NOT_FOUND");

  const source = await getPrimaryCurrentSource(db, ruleKey, ruleVersion);
  if (!source?.source_id) throw new Error("PRIMARY_SOURCE_NOT_FOUND");

  await db
    .prepare(
      `UPDATE regulatory_rule_review_state
       SET last_reviewed_at = CURRENT_TIMESTAMP,
           reviewed_by = ?,
           review_origin = 'manual',
           last_verified_at = CURRENT_TIMESTAMP,
           verified_by = ?,
           verified_source_id = ?,
           verified_source_hash = ?,
           verification_note = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE rule_key = ? AND rule_version = ?`
    )
    .bind(
      verifiedBy,
      verifiedBy,
      source.source_id,
      source.last_content_hash || null,
      note || null,
      ruleKey,
      ruleVersion
    )
    .run();

  await syncKnowledgeCoverage(db);

  return {
    verified: true,
    sourceId: source.source_id,
    sourceFingerprintCaptured: Boolean(source.last_content_hash),
    sourceLastCheckedAt: source.last_checked_at || null,
  };
}

export async function resetRuleVerification(
  db: SellComplyD1,
  ruleKey: string,
  ruleVersion: number
) {
  await db
    .prepare(
      `UPDATE regulatory_rule_review_state
       SET last_verified_at = NULL,
           verified_by = NULL,
           verified_source_id = NULL,
           verified_source_hash = NULL,
           verification_note = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE rule_key = ? AND rule_version = ?`
    )
    .bind(ruleKey, ruleVersion)
    .run();

  await syncKnowledgeCoverage(db);
  return { reset: true };
}

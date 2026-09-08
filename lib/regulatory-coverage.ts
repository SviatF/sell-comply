import type { SellComplyD1 } from "./cloudflare-db";
import { markets, products } from "./seo-data";

export type CoverageReadiness = "ready" | "partial" | "blocked";

export type CoverageInput = {
  ruleCount: number;
  sourceCoveredRules: number;
  timingCoveredRules: number;
  structuredTimingRules: number;
  reviewedRules: number;
  manuallyReviewedRules: number;
  verifiedRules: number;
  staleVerifiedRules: number;
  untriagedUpdates: number;
  needsRuleUpdate: number;
};

export type CoverageAssessment = CoverageInput & {
  sourceCoverage: number;
  timingCoverage: number;
  reviewCoverage: number;
  verificationCoverage: number;
  qualityScore: number;
  readiness: CoverageReadiness;
  isIndexable: boolean;
  gaps: string[];
};

type AggregateRow = {
  market_slug: string;
  product_slug: string;
  rule_count: number;
  source_covered_rules: number;
  timing_covered_rules: number;
  structured_timing_rules: number;
  reviewed_rules: number;
  manually_reviewed_rules: number;
  verified_rules: number;
  stale_verified_rules: number;
};

type UpdateGapRow = {
  market_slug: string;
  product_slug: string;
  untriaged_updates: number;
  needs_rule_update: number;
};

function stableId(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `coverage_${(hash >>> 0).toString(16)}`;
}

function ratio(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, value / total));
}

export function calculateCoverageAssessment(
  input: CoverageInput
): CoverageAssessment {
  const sourceCoverage = ratio(input.sourceCoveredRules, input.ruleCount);
  const timingCoverage = ratio(input.timingCoveredRules, input.ruleCount);
  const reviewCoverage = ratio(input.reviewedRules, input.ruleCount);
  const verificationCoverage = ratio(input.verifiedRules, input.ruleCount);

  const baseScore =
    (input.ruleCount > 0 ? 25 : 0) +
    sourceCoverage * 25 +
    timingCoverage * 15 +
    reviewCoverage * 20 +
    verificationCoverage * 15;

  const penalty = Math.min(
    45,
    input.staleVerifiedRules * 15 +
      input.untriagedUpdates * 10 +
      input.needsRuleUpdate * 20
  );

  const qualityScore = Math.max(
    0,
    Math.min(100, Math.round(baseScore - penalty))
  );

  const gaps: string[] = [];

  if (input.ruleCount === 0) gaps.push("no_regulatory_rules");
  if (sourceCoverage < 1) gaps.push("missing_official_source_provenance");
  if (timingCoverage < 1) gaps.push("incomplete_timing_metadata");
  if (reviewCoverage < 1) gaps.push("review_freshness_incomplete");
  if (verificationCoverage < 1) gaps.push("verification_incomplete");
  if (input.staleVerifiedRules > 0) gaps.push("stale_verified_rule");
  if (input.untriagedUpdates > 0) gaps.push("untriaged_regulatory_update");
  if (input.needsRuleUpdate > 0) gaps.push("pending_rule_update");

  const blocked =
    input.ruleCount === 0 ||
    sourceCoverage < 1 ||
    input.staleVerifiedRules > 0 ||
    input.untriagedUpdates > 0 ||
    input.needsRuleUpdate > 0;

  const ready =
    !blocked &&
    timingCoverage === 1 &&
    reviewCoverage === 1 &&
    verificationCoverage === 1 &&
    qualityScore >= 95;

  const readiness: CoverageReadiness = blocked
    ? "blocked"
    : ready
      ? "ready"
      : "partial";

  return {
    ...input,
    sourceCoverage,
    timingCoverage,
    reviewCoverage,
    verificationCoverage,
    qualityScore,
    readiness,
    isIndexable: readiness === "ready",
    gaps,
  };
}

export async function syncKnowledgeCoverage(db: SellComplyD1) {
  const aggregates = await db
    .prepare(
      `SELECT
         a.market_slug,
         a.product_slug,
         COUNT(DISTINCT a.rule_key || ':' || a.rule_version) AS rule_count,
         COUNT(DISTINCT CASE
           WHEN rs.source_id IS NOT NULL AND sr.source_id IS NOT NULL
           THEN a.rule_key || ':' || a.rule_version
         END) AS source_covered_rules,
         COUNT(DISTINCT CASE
           WHEN t.rule_key IS NOT NULL
           THEN a.rule_key || ':' || a.rule_version
         END) AS timing_covered_rules,
         COUNT(DISTINCT CASE
           WHEN t.rule_key IS NOT NULL
            AND (
              t.effective_from IS NOT NULL
              OR t.effective_to IS NOT NULL
              OR t.transition_start IS NOT NULL
              OR t.transition_end IS NOT NULL
              OR t.timing_note IS NOT NULL
            )
           THEN a.rule_key || ':' || a.rule_version
         END) AS structured_timing_rules,
         COUNT(DISTINCT CASE
           WHEN st.last_reviewed_at IS NOT NULL
            AND st.last_reviewed_at >= datetime('now', '-180 days')
           THEN a.rule_key || ':' || a.rule_version
         END) AS reviewed_rules,
         COUNT(DISTINCT CASE
           WHEN st.last_reviewed_at IS NOT NULL
            AND st.last_reviewed_at >= datetime('now', '-180 days')
            AND st.review_origin = 'manual'
           THEN a.rule_key || ':' || a.rule_version
         END) AS manually_reviewed_rules,
         COUNT(DISTINCT CASE
           WHEN st.last_verified_at IS NOT NULL
            AND st.last_verified_at >= datetime('now', '-180 days')
            AND NOT (
              st.verified_source_hash IS NOT NULL
              AND vs.last_content_hash IS NOT NULL
              AND st.verified_source_hash <> vs.last_content_hash
            )
           THEN a.rule_key || ':' || a.rule_version
         END) AS verified_rules,
         COUNT(DISTINCT CASE
           WHEN st.last_verified_at IS NOT NULL
            AND st.verified_source_hash IS NOT NULL
            AND vs.last_content_hash IS NOT NULL
            AND st.verified_source_hash <> vs.last_content_hash
           THEN a.rule_key || ':' || a.rule_version
         END) AS stale_verified_rules
       FROM regulatory_applicability a
       INNER JOIN regulatory_rules r
         ON r.rule_key = a.rule_key
        AND r.current_version = a.rule_version
        AND r.is_active = 1
       LEFT JOIN regulatory_rule_sources rs
         ON rs.rule_key = a.rule_key
        AND rs.rule_version = a.rule_version
        AND rs.relation_type = 'primary'
        AND rs.is_current = 1
       LEFT JOIN regulatory_source_registry sr
         ON sr.source_id = rs.source_id
       LEFT JOIN regulatory_rule_timing t
         ON t.rule_key = a.rule_key
        AND t.rule_version = a.rule_version
       LEFT JOIN regulatory_rule_review_state st
         ON st.rule_key = a.rule_key
        AND st.rule_version = a.rule_version
       LEFT JOIN sources vs
         ON vs.id = st.verified_source_id
       WHERE a.is_current = 1
       GROUP BY a.market_slug, a.product_slug`
    )
    .all<AggregateRow>();

  const updateGaps = await db
    .prepare(
      `SELECT
         i.market_slug,
         i.product_slug,
         COUNT(DISTINCT CASE
           WHEN ur.id IS NULL THEN e.id
         END) AS untriaged_updates,
         COUNT(DISTINCT CASE
           WHEN ur.triage_outcome = 'needs_rule_update'
            AND (
              NOT EXISTS (
                SELECT 1
                FROM regulatory_update_review_rules rr0
                WHERE rr0.review_id = ur.id
              )
              OR EXISTS (
                SELECT 1
                FROM regulatory_update_review_rules rr1
                WHERE rr1.review_id = ur.id
                  AND rr1.rule_key = i.rule_key
                  AND rr1.relation_type = 'update_required'
              )
            )
           THEN e.id
         END) AS needs_rule_update
       FROM regulatory_change_events e
       INNER JOIN regulatory_change_impacts i
         ON i.change_event_id = e.id
        AND i.impact_phase = 'detected'
       LEFT JOIN regulatory_update_reviews ur
         ON ur.change_id = e.legacy_change_id
       WHERE e.event_type = 'source_fingerprint_changed'
       GROUP BY i.market_slug, i.product_slug`
    )
    .all<UpdateGapRow>();

  const aggregateMap = new Map(
    (aggregates.results || []).map((row) => [
      `${row.market_slug}:${row.product_slug}`,
      row,
    ])
  );

  const updateMap = new Map(
    (updateGaps.results || []).map((row) => [
      `${row.market_slug}:${row.product_slug}`,
      row,
    ])
  );

  const snapshots = [];

  for (const market of markets) {
    for (const product of products) {
      const key = `${market.slug}:${product.slug}`;
      const aggregate = aggregateMap.get(key);
      const update = updateMap.get(key);

      const assessment = calculateCoverageAssessment({
        ruleCount: Number(aggregate?.rule_count || 0),
        sourceCoveredRules: Number(aggregate?.source_covered_rules || 0),
        timingCoveredRules: Number(aggregate?.timing_covered_rules || 0),
        structuredTimingRules: Number(aggregate?.structured_timing_rules || 0),
        reviewedRules: Number(aggregate?.reviewed_rules || 0),
        manuallyReviewedRules: Number(
          aggregate?.manually_reviewed_rules || 0
        ),
        verifiedRules: Number(aggregate?.verified_rules || 0),
        staleVerifiedRules: Number(aggregate?.stale_verified_rules || 0),
        untriagedUpdates: Number(update?.untriaged_updates || 0),
        needsRuleUpdate: Number(update?.needs_rule_update || 0),
      });

      await db
        .prepare(
          `INSERT INTO regulatory_coverage_snapshots (
             id, product_slug, market_slug,
             rule_count, source_covered_rules, timing_covered_rules,
             structured_timing_rules, reviewed_rules, manually_reviewed_rules,
             verified_rules, stale_verified_rules,
             untriaged_updates, needs_rule_update,
             source_coverage, timing_coverage, review_coverage,
             verification_coverage, quality_score,
             readiness, is_indexable, gaps_json, computed_at
           ) VALUES (
             ?, ?, ?,
             ?, ?, ?,
             ?, ?, ?,
             ?, ?,
             ?, ?,
             ?, ?, ?,
             ?, ?,
             ?, ?, ?, CURRENT_TIMESTAMP
           )
           ON CONFLICT(product_slug, market_slug) DO UPDATE SET
             rule_count = excluded.rule_count,
             source_covered_rules = excluded.source_covered_rules,
             timing_covered_rules = excluded.timing_covered_rules,
             structured_timing_rules = excluded.structured_timing_rules,
             reviewed_rules = excluded.reviewed_rules,
             manually_reviewed_rules = excluded.manually_reviewed_rules,
             verified_rules = excluded.verified_rules,
             stale_verified_rules = excluded.stale_verified_rules,
             untriaged_updates = excluded.untriaged_updates,
             needs_rule_update = excluded.needs_rule_update,
             source_coverage = excluded.source_coverage,
             timing_coverage = excluded.timing_coverage,
             review_coverage = excluded.review_coverage,
             verification_coverage = excluded.verification_coverage,
             quality_score = excluded.quality_score,
             readiness = excluded.readiness,
             is_indexable = excluded.is_indexable,
             gaps_json = excluded.gaps_json,
             computed_at = CURRENT_TIMESTAMP`
        )
        .bind(
          stableId(key),
          product.slug,
          market.slug,
          assessment.ruleCount,
          assessment.sourceCoveredRules,
          assessment.timingCoveredRules,
          assessment.structuredTimingRules,
          assessment.reviewedRules,
          assessment.manuallyReviewedRules,
          assessment.verifiedRules,
          assessment.staleVerifiedRules,
          assessment.untriagedUpdates,
          assessment.needsRuleUpdate,
          assessment.sourceCoverage,
          assessment.timingCoverage,
          assessment.reviewCoverage,
          assessment.verificationCoverage,
          assessment.qualityScore,
          assessment.readiness,
          assessment.isIndexable ? 1 : 0,
          JSON.stringify(assessment.gaps)
        )
        .run();

      snapshots.push({
        productSlug: product.slug,
        marketSlug: market.slug,
        ...assessment,
      });
    }
  }

  return snapshots;
}

export async function ensureKnowledgeCoverage(db: SellComplyD1) {
  const expectedPairs = products.length * markets.length;

  const state = await db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         MIN(computed_at) AS oldest
       FROM regulatory_coverage_snapshots`
    )
    .first<{ total: number; oldest: string | null }>();

  const stale = !state?.oldest
    ? true
    : Date.now() - new Date(state.oldest).getTime() > 60 * 60 * 1000;

  if (Number(state?.total || 0) !== expectedPairs || stale) {
    await syncKnowledgeCoverage(db);
  }
}

export async function getCoverageSnapshot(
  db: SellComplyD1,
  productSlug: string,
  marketSlug: string
) {
  await ensureKnowledgeCoverage(db);

  return db
    .prepare(
      `SELECT *
       FROM regulatory_coverage_snapshots
       WHERE product_slug = ?
         AND market_slug = ?
       LIMIT 1`
    )
    .bind(productSlug, marketSlug)
    .first();
}

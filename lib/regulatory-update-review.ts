import type { SellComplyD1 } from "./cloudflare-db";
import { queueAlertsForChange } from "./alert-queue";
import { syncChangeReviewDecision } from "./regulatory-change-history";
import { syncKnowledgeCoverage } from "./regulatory-coverage";

export type RegulatoryTriageOutcome =
  | "no_regulatory_change"
  | "informational"
  | "requirement_changed"
  | "needs_rule_update";

export type TriagePolicy = {
  sellerAlertEligible: boolean;
  requiresRuleUpdate: boolean;
  closesReview: boolean;
  relationType:
    | "reviewed_no_change"
    | "informational"
    | "confirmed_affected"
    | "update_required";
};

export function getTriagePolicy(
  outcome: RegulatoryTriageOutcome
): TriagePolicy {
  switch (outcome) {
    case "requirement_changed":
      return {
        sellerAlertEligible: true,
        requiresRuleUpdate: false,
        closesReview: true,
        relationType: "confirmed_affected",
      };
    case "needs_rule_update":
      return {
        sellerAlertEligible: false,
        requiresRuleUpdate: true,
        closesReview: false,
        relationType: "update_required",
      };
    case "informational":
      return {
        sellerAlertEligible: false,
        requiresRuleUpdate: false,
        closesReview: true,
        relationType: "informational",
      };
    default:
      return {
        sellerAlertEligible: false,
        requiresRuleUpdate: false,
        closesReview: true,
        relationType: "reviewed_no_change",
      };
  }
}

export function isRegulatoryTriageOutcome(
  value: string
): value is RegulatoryTriageOutcome {
  return [
    "no_regulatory_change",
    "informational",
    "requirement_changed",
    "needs_rule_update",
  ].includes(value);
}

function stableId(prefix: string, value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16)}`;
}

async function getImpactedRuleKeys(
  db: SellComplyD1,
  changeId: string
) {
  const rows = await db
    .prepare(
      `SELECT DISTINCT i.rule_key
       FROM regulatory_change_events e
       INNER JOIN regulatory_change_impacts i
         ON i.change_event_id = e.id
       WHERE e.legacy_change_id = ?
       ORDER BY i.rule_key`
    )
    .bind(changeId)
    .all<{ rule_key: string }>();

  return (rows.results || []).map((row) => row.rule_key);
}

export async function triageRegulatoryChange(
  db: SellComplyD1,
  changeId: string,
  {
    outcome,
    note,
    reviewedBy,
    ruleKeys,
  }: {
    outcome: RegulatoryTriageOutcome;
    note?: string;
    reviewedBy?: string;
    ruleKeys?: string[];
  }
) {
  const change = await db
    .prepare(
      "SELECT id FROM rule_changes WHERE id = ? LIMIT 1"
    )
    .bind(changeId)
    .first<{ id: string }>();

  if (!change?.id) throw new Error("CHANGE_NOT_FOUND");

  const policy = getTriagePolicy(outcome);
  const reviewId = stableId("triage", changeId);

  const impactedRules = await getImpactedRuleKeys(db, changeId);
  const selectedRules = [...new Set(
    (ruleKeys?.length ? ruleKeys : impactedRules)
      .map((value) => value.trim())
      .filter(Boolean)
  )].sort();

  await db
    .prepare(
      `INSERT INTO regulatory_update_reviews (
         id, change_id, triage_outcome,
         seller_alert_eligible, requires_rule_update,
         review_note, reviewed_by, reviewed_at,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(change_id) DO UPDATE SET
         triage_outcome = excluded.triage_outcome,
         seller_alert_eligible = excluded.seller_alert_eligible,
         requires_rule_update = excluded.requires_rule_update,
         review_note = excluded.review_note,
         reviewed_by = excluded.reviewed_by,
         reviewed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      reviewId,
      changeId,
      outcome,
      policy.sellerAlertEligible ? 1 : 0,
      policy.requiresRuleUpdate ? 1 : 0,
      note || null,
      reviewedBy || "ops-console"
    )
    .run();

  const canonicalReview = await db
    .prepare(
      "SELECT id FROM regulatory_update_reviews WHERE change_id = ? LIMIT 1"
    )
    .bind(changeId)
    .first<{ id: string }>();

  const persistedReviewId = canonicalReview?.id || reviewId;

  await db
    .prepare(
      "DELETE FROM regulatory_update_review_rules WHERE review_id = ?"
    )
    .bind(persistedReviewId)
    .run();

  for (const ruleKey of selectedRules) {
    await db
      .prepare(
        `INSERT INTO regulatory_update_review_rules (
           id, review_id, rule_key, relation_type, created_at
         ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(review_id, rule_key, relation_type) DO NOTHING`
      )
      .bind(
        stableId(
          "triage_rule",
          [persistedReviewId, ruleKey, policy.relationType].join("|")
        ),
        persistedReviewId,
        ruleKey,
        policy.relationType
      )
      .run();
  }

  await db
    .prepare(
      `INSERT INTO change_reviews (
         id, change_id, decision, review_note, reviewed_by, reviewed_at
       ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(change_id) DO UPDATE SET
         decision = excluded.decision,
         review_note = excluded.review_note,
         reviewed_by = excluded.reviewed_by,
         reviewed_at = CURRENT_TIMESTAMP`
    )
    .bind(
      crypto.randomUUID(),
      changeId,
      outcome,
      note || null,
      reviewedBy || "ops-console"
    )
    .run();

  await db
    .prepare(
      "UPDATE rule_changes SET review_status = ? WHERE id = ?"
    )
    .bind(outcome, changeId)
    .run();

  await syncChangeReviewDecision(db, {
    legacyChangeId: changeId,
    decision: outcome,
    reviewedBy: reviewedBy || "ops-console",
    reviewNote: note || null,
  });

  let queued = 0;
  if (policy.sellerAlertEligible) {
    const result = await queueAlertsForChange(db, changeId, {
      ruleKeys: selectedRules,
    });
    queued = result.queued;
  }

  await syncKnowledgeCoverage(db);

  return {
    outcome,
    policy,
    selectedRules,
    queued,
  };
}

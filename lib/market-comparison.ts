import type { buildComplianceReview } from "./compliance-engine";

export type ComplianceReviewResult = ReturnType<typeof buildComplianceReview>;

export type ComplexityBand = "lower" | "similar" | "higher" | "current";

export function getComplexityBand(
  currentScore: number,
  targetScore: number,
  isCurrent = false
): ComplexityBand {
  if (isCurrent) return "current";

  const delta = targetScore - currentScore;
  if (delta <= -8) return "lower";
  if (delta >= 8) return "higher";
  return "similar";
}

export function getRuleDiff(
  current: ComplianceReviewResult,
  target: ComplianceReviewResult
) {
  const currentIds = new Set(current.matchedRules.map((rule) => rule.id));
  const targetIds = new Set(target.matchedRules.map((rule) => rule.id));

  return {
    additionalRules: target.matchedRules
      .filter((rule) => !currentIds.has(rule.id))
      .map((rule) => ({
        id: rule.id,
        shortName: rule.shortName,
        title: rule.title,
        status: rule.status,
      })),
    removedRules: current.matchedRules
      .filter((rule) => !targetIds.has(rule.id))
      .map((rule) => ({
        id: rule.id,
        shortName: rule.shortName,
        title: rule.title,
        status: rule.status,
      })),
  };
}

export function getComparisonSummary(
  current: ComplianceReviewResult,
  target: ComplianceReviewResult
) {
  const diff = getRuleDiff(current, target);
  const scoreDelta = target.risk.score - current.risk.score;

  return {
    scoreDelta,
    complexity: getComplexityBand(
      current.risk.score,
      target.risk.score,
      current.market.slug === target.market.slug
    ),
    additionalRules: diff.additionalRules,
    removedRules: diff.removedRules,
    required: target.summary.required,
    likely: target.summary.likely,
    verify: target.summary.verify,
    rulesMatched: target.summary.rulesMatched,
    documents: target.documents.length,
    labels: target.labels.length,
  };
}

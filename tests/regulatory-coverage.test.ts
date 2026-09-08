import { describe, expect, it } from "vitest";
import {
  calculateCoverageAssessment,
  type CoverageInput,
} from "../lib/regulatory-coverage";

function input(overrides: Partial<CoverageInput> = {}): CoverageInput {
  return {
    ruleCount: 4,
    sourceCoveredRules: 4,
    timingCoveredRules: 4,
    structuredTimingRules: 2,
    reviewedRules: 4,
    manuallyReviewedRules: 4,
    verifiedRules: 4,
    staleVerifiedRules: 0,
    untriagedUpdates: 0,
    needsRuleUpdate: 0,
    ...overrides,
  };
}

describe("knowledge-base coverage quality gate", () => {
  it("marks fully covered and freshly verified pairs ready/indexable", () => {
    const result = calculateCoverageAssessment(input());

    expect(result.qualityScore).toBe(100);
    expect(result.readiness).toBe("ready");
    expect(result.isIndexable).toBe(true);
    expect(result.gaps).toEqual([]);
  });

  it("keeps complete but unverified knowledge partial rather than indexable", () => {
    const result = calculateCoverageAssessment(
      input({
        verifiedRules: 0,
      })
    );

    expect(result.qualityScore).toBe(85);
    expect(result.readiness).toBe("partial");
    expect(result.isIndexable).toBe(false);
    expect(result.gaps).toContain("verification_incomplete");
  });

  it("blocks pairs with no regulatory rules", () => {
    const result = calculateCoverageAssessment(
      input({
        ruleCount: 0,
        sourceCoveredRules: 0,
        timingCoveredRules: 0,
        structuredTimingRules: 0,
        reviewedRules: 0,
        manuallyReviewedRules: 0,
        verifiedRules: 0,
      })
    );

    expect(result.readiness).toBe("blocked");
    expect(result.isIndexable).toBe(false);
    expect(result.gaps).toContain("no_regulatory_rules");
  });

  it("blocks missing official-source provenance even with other quality layers complete", () => {
    const result = calculateCoverageAssessment(
      input({
        sourceCoveredRules: 3,
      })
    );

    expect(result.sourceCoverage).toBe(0.75);
    expect(result.readiness).toBe("blocked");
    expect(result.gaps).toContain("missing_official_source_provenance");
  });

  it("blocks an otherwise high-quality pair when a verified source becomes stale", () => {
    const result = calculateCoverageAssessment(
      input({
        verifiedRules: 3,
        staleVerifiedRules: 1,
      })
    );

    expect(result.readiness).toBe("blocked");
    expect(result.isIndexable).toBe(false);
    expect(result.gaps).toContain("stale_verified_rule");
    expect(result.qualityScore).toBeLessThan(100);
  });

  it("blocks while a detected source update still needs human triage", () => {
    const result = calculateCoverageAssessment(
      input({
        untriagedUpdates: 1,
      })
    );

    expect(result.readiness).toBe("blocked");
    expect(result.gaps).toContain("untriaged_regulatory_update");
  });

  it("blocks a pair until required KB rule updates are resolved", () => {
    const result = calculateCoverageAssessment(
      input({
        needsRuleUpdate: 1,
      })
    );

    expect(result.readiness).toBe("blocked");
    expect(result.gaps).toContain("pending_rule_update");
  });

  it("keeps timing gaps partial rather than making unsupported current claims", () => {
    const result = calculateCoverageAssessment(
      input({
        timingCoveredRules: 3,
      })
    );

    expect(result.timingCoverage).toBe(0.75);
    expect(result.readiness).toBe("partial");
    expect(result.isIndexable).toBe(false);
    expect(result.gaps).toContain("incomplete_timing_metadata");
  });

  it("uses fresh review coverage independently from manual-review count", () => {
    const result = calculateCoverageAssessment(
      input({
        reviewedRules: 4,
        manuallyReviewedRules: 1,
      })
    );

    expect(result.reviewCoverage).toBe(1);
    expect(result.qualityScore).toBe(100);
    expect(result.readiness).toBe("ready");
  });
});

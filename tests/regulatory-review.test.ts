import { describe, expect, it } from "vitest";
import {
  deriveRuleReviewStatus,
  sourceChangedSinceVerification,
  type RuleReviewState,
} from "../lib/regulatory-review";

function state(overrides: Partial<RuleReviewState> = {}): RuleReviewState {
  return {
    lastReviewedAt: null,
    reviewedBy: null,
    reviewOrigin: null,
    lastVerifiedAt: null,
    verifiedBy: null,
    verifiedSourceId: null,
    verifiedSourceHash: null,
    currentSourceHash: null,
    sourceLastCheckedAt: null,
    ...overrides,
  };
}

describe("regulatory review state", () => {
  it("starts unreviewed when no review metadata exists", () => {
    expect(deriveRuleReviewStatus(state())).toBe("unreviewed");
  });

  it("distinguishes reviewed from verified", () => {
    expect(
      deriveRuleReviewStatus(
        state({
          lastReviewedAt: "2026-09-08T10:00:00Z",
          reviewedBy: "ops",
        })
      )
    ).toBe("reviewed");
  });

  it("marks a rule verified after explicit verification", () => {
    expect(
      deriveRuleReviewStatus(
        state({
          lastReviewedAt: "2026-09-08T10:00:00Z",
          lastVerifiedAt: "2026-09-08T10:05:00Z",
          verifiedBy: "ops",
          verifiedSourceHash: "abc",
          currentSourceHash: "abc",
        })
      )
    ).toBe("verified");
  });

  it("marks a previously verified rule stale when the source fingerprint changes", () => {
    const value = state({
      lastReviewedAt: "2026-09-08T10:00:00Z",
      lastVerifiedAt: "2026-09-08T10:05:00Z",
      verifiedSourceHash: "abc",
      currentSourceHash: "def",
    });

    expect(deriveRuleReviewStatus(value)).toBe("stale");
    expect(sourceChangedSinceVerification(value)).toBe(true);
  });

  it("does not become stale from a routine source check when the fingerprint is unchanged", () => {
    const value = state({
      lastReviewedAt: "2026-09-08T10:00:00Z",
      lastVerifiedAt: "2026-09-08T10:05:00Z",
      verifiedSourceHash: "same",
      currentSourceHash: "same",
      sourceLastCheckedAt: "2026-09-09T05:00:00Z",
    });

    expect(deriveRuleReviewStatus(value)).toBe("verified");
    expect(sourceChangedSinceVerification(value)).toBe(false);
  });

  it("keeps an unfingerprinted explicit verification as verified rather than pretending a source change occurred", () => {
    expect(
      deriveRuleReviewStatus(
        state({
          lastVerifiedAt: "2026-09-08T10:05:00Z",
          verifiedSourceHash: null,
          currentSourceHash: "later-hash",
        })
      )
    ).toBe("verified");
  });
});

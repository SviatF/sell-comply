import { describe, expect, it } from "vitest";
import {
  getTriagePolicy,
  isRegulatoryTriageOutcome,
} from "../lib/regulatory-update-review";

describe("regulatory update triage policy", () => {
  it("only requirement_changed is seller-alert eligible", () => {
    expect(getTriagePolicy("requirement_changed").sellerAlertEligible).toBe(true);
    expect(getTriagePolicy("no_regulatory_change").sellerAlertEligible).toBe(false);
    expect(getTriagePolicy("informational").sellerAlertEligible).toBe(false);
    expect(getTriagePolicy("needs_rule_update").sellerAlertEligible).toBe(false);
  });

  it("blocks completion when a KB rule update is still required", () => {
    const policy = getTriagePolicy("needs_rule_update");

    expect(policy.requiresRuleUpdate).toBe(true);
    expect(policy.closesReview).toBe(false);
    expect(policy.relationType).toBe("update_required");
  });

  it("closes non-regulatory noise without allowing alerts", () => {
    const policy = getTriagePolicy("no_regulatory_change");

    expect(policy.closesReview).toBe(true);
    expect(policy.sellerAlertEligible).toBe(false);
    expect(policy.relationType).toBe("reviewed_no_change");
  });

  it("keeps informational updates separate from requirement changes", () => {
    const policy = getTriagePolicy("informational");

    expect(policy.closesReview).toBe(true);
    expect(policy.sellerAlertEligible).toBe(false);
    expect(policy.relationType).toBe("informational");
  });

  it("marks confirmed requirement changes with confirmed affected-rule relation", () => {
    const policy = getTriagePolicy("requirement_changed");

    expect(policy.closesReview).toBe(true);
    expect(policy.requiresRuleUpdate).toBe(false);
    expect(policy.relationType).toBe("confirmed_affected");
  });

  it("accepts only the four explicit triage outcomes", () => {
    expect(isRegulatoryTriageOutcome("no_regulatory_change")).toBe(true);
    expect(isRegulatoryTriageOutcome("informational")).toBe(true);
    expect(isRegulatoryTriageOutcome("requirement_changed")).toBe(true);
    expect(isRegulatoryTriageOutcome("needs_rule_update")).toBe(true);

    expect(isRegulatoryTriageOutcome("approved")).toBe(false);
    expect(isRegulatoryTriageOutcome("rejected")).toBe(false);
    expect(isRegulatoryTriageOutcome("needs_review")).toBe(false);
  });
});

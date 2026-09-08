import { describe, expect, it } from "vitest";
import { buildComplianceReview } from "../lib/compliance-engine";
import {
  getComparisonSummary,
  getComplexityBand,
  getRuleDiff,
} from "../lib/market-comparison";

describe("market comparison complexity bands", () => {
  it("uses an eight-point threshold for lower and higher complexity", () => {
    expect(getComplexityBand(50, 41)).toBe("lower");
    expect(getComplexityBand(50, 42)).toBe("lower");
    expect(getComplexityBand(50, 43)).toBe("similar");
    expect(getComplexityBand(50, 57)).toBe("similar");
    expect(getComplexityBand(50, 58)).toBe("higher");
  });

  it("marks the current market explicitly", () => {
    expect(getComplexityBand(80, 20, true)).toBe("current");
  });
});

describe("market rule differences", () => {
  const product =
    "Bluetooth wireless headphones with rechargeable lithium battery";

  const facts = {
    radio: true,
    battery: true,
    children: false,
    mains: false,
    role: "importer" as const,
  };

  it("returns no rule differences when comparing a market to itself", () => {
    const germany = buildComplianceReview(
      product,
      "Germany",
      "",
      facts
    );

    const diff = getRuleDiff(germany, germany);

    expect(diff.additionalRules).toEqual([]);
    expect(diff.removedRules).toEqual([]);
  });

  it("shows structured rule differences between Germany and the United States", () => {
    const germany = buildComplianceReview(
      product,
      "Germany",
      "",
      facts
    );
    const unitedStates = buildComplianceReview(
      product,
      "United States",
      "",
      facts
    );

    const diff = getRuleDiff(germany, unitedStates);

    expect(diff.additionalRules.length).toBeGreaterThan(0);
    expect(diff.removedRules.length).toBeGreaterThan(0);
    expect(
      diff.additionalRules.some((rule) => rule.id === "us-fcc-radio")
    ).toBe(true);
    expect(
      diff.removedRules.some((rule) => rule.id === "eu-red")
    ).toBe(true);
  });

  it("keeps comparison metrics tied to the target market review", () => {
    const germany = buildComplianceReview(
      product,
      "Germany",
      "",
      facts
    );
    const canada = buildComplianceReview(
      product,
      "Canada",
      "",
      facts
    );

    const summary = getComparisonSummary(germany, canada);

    expect(summary.required).toBe(canada.summary.required);
    expect(summary.verify).toBe(canada.summary.verify);
    expect(summary.rulesMatched).toBe(canada.summary.rulesMatched);
    expect(summary.documents).toBe(canada.documents.length);
    expect(summary.labels).toBe(canada.labels.length);
    expect(summary.scoreDelta).toBe(
      canada.risk.score - germany.risk.score
    );
  });
});

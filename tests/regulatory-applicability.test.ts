import { describe, expect, it } from "vitest";
import {
  expandRuleApplicability,
  matchesRequiredFeatures,
} from "../lib/regulatory-applicability";
import { regulatoryRules } from "../lib/regulatory-rules";
import { products } from "../lib/seo-data";

function rule(id: string) {
  const found = regulatoryRules.find((item) => item.id === id);
  if (!found) throw new Error(`Missing rule fixture: ${id}`);
  return found;
}

describe("regulatory applicability normalization", () => {
  it("expands EU RED across both markets and both explicit wireless products", () => {
    const rows = expandRuleApplicability(rule("eu-red"), 1);

    expect(rows).toHaveLength(4);
    expect(
      rows.map((row) => `${row.marketSlug}:${row.productSlug}`).sort()
    ).toEqual([
      "france:bluetooth-speakers",
      "france:wireless-headphones",
      "germany:bluetooth-speakers",
      "germany:wireless-headphones",
    ]);
    expect(rows.every((row) => row.status === "required")).toBe(true);
    expect(rows.every((row) => row.requiredFeatures.includes("radio"))).toBe(true);
  });

  it("materializes broad EU GPSR scope for every current product except cosmetics", () => {
    const rows = expandRuleApplicability(rule("eu-gpsr"), 1);
    const expectedProducts = products
      .map((product) => product.slug)
      .filter((slug) => slug !== "cosmetics");

    expect(rows).toHaveLength(expectedProducts.length * 2);
    expect(rows.some((row) => row.productSlug === "cosmetics")).toBe(false);

    for (const productSlug of expectedProducts) {
      expect(
        rows.some(
          (row) =>
            row.marketSlug === "germany" && row.productSlug === productSlug
        )
      ).toBe(true);
      expect(
        rows.some(
          (row) =>
            row.marketSlug === "france" && row.productSlug === productSlug
        )
      ).toBe(true);
    }
  });

  it("keeps a feature-gated children's jewellery rule on the exact product-market pair", () => {
    const rows = expandRuleApplicability(rule("ca-childrens-jewelry"), 3);

    expect(rows).toEqual([
      expect.objectContaining({
        ruleKey: "ca-childrens-jewelry",
        ruleVersion: 3,
        marketSlug: "canada",
        productSlug: "jewelry",
        status: "required",
        requiredFeatures: ["children"],
      }),
    ]);
  });

  it("keeps version-specific applicability IDs stable", () => {
    const v1 = expandRuleApplicability(rule("eu-red"), 1);
    const v1Again = expandRuleApplicability(rule("eu-red"), 1);
    const v2 = expandRuleApplicability(rule("eu-red"), 2);

    expect(v1.map((row) => row.id)).toEqual(v1Again.map((row) => row.id));
    expect(v1[0].id).not.toBe(v2[0].id);
  });

  it("requires every feature in an all-feature applicability condition", () => {
    expect(matchesRequiredFeatures(["radio", "battery"], ["radio", "battery"])).toBe(true);
    expect(matchesRequiredFeatures(["radio", "battery"], ["radio"])).toBe(false);
    expect(matchesRequiredFeatures([], [])).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildComplianceReview,
  classifyProductDetailed,
} from "../lib/compliance-engine";
import {
  buildCheckParams,
  parseCheckFacts,
} from "../lib/check-query";

function ruleIds(result: ReturnType<typeof buildComplianceReview>) {
  return result.matchedRules.map((rule) => rule.id);
}

describe("product classification", () => {
  it("classifies Bluetooth headphones with radio and battery features", () => {
    const result = classifyProductDetailed(
      "Bluetooth wireless headphones with rechargeable lithium battery"
    );

    expect(result.product.slug).toBe("wireless-headphones");
    expect(result.features).toContain("radio");
    expect(result.features).toContain("battery");
    expect(["High", "Medium"]).toContain(result.confidence);
  });

  it("classifies power banks", () => {
    const result = classifyProductDetailed(
      "20,000mAh lithium power bank portable charger"
    );

    expect(result.product.slug).toBe("power-banks");
    expect(result.features).toContain("battery");
    expect(result.features).toContain("electronic");
  });

  it("falls back safely for an unknown product", () => {
    const result = classifyProductDetailed("handmade decorative object model qx-14");

    expect(result.product.slug).toBe("general-consumer-product");
    expect(result.confidence).toBe("Low");
  });
});

describe("EU rule applicability", () => {
  it("matches the core Germany wireless-headphone rule set", () => {
    const result = buildComplianceReview(
      "Bluetooth wireless headphones with rechargeable lithium battery",
      "Germany",
      "Amazon"
    );

    const ids = ruleIds(result);
    expect(ids).toContain("eu-red");
    expect(ids).toContain("eu-rohs");
    expect(ids).toContain("eu-weee");
    expect(ids).toContain("eu-batteries");
    expect(ids).toContain("eu-gpsr");
  });

  it("removes battery rules when the user confirms no battery", () => {
    const result = buildComplianceReview(
      "Bluetooth wireless headphones",
      "Germany",
      "Amazon",
      { battery: false }
    );

    expect(ruleIds(result)).not.toContain("eu-batteries");
    expect(result.classification.features).not.toContain("battery");
  });

  it("adds LVD for a mains-powered LED product", () => {
    const result = buildComplianceReview(
      "electronic LED lamp",
      "Germany",
      "Amazon",
      { mains: true }
    );

    expect(ruleIds(result)).toContain("eu-led-lvd");
    expect(ruleIds(result)).toContain("eu-led-emc");
  });

  it("does not add LVD when mains power is explicitly false", () => {
    const result = buildComplianceReview(
      "electronic LED lamp",
      "Germany",
      "Amazon",
      { mains: false }
    );

    expect(ruleIds(result)).not.toContain("eu-led-lvd");
    expect(ruleIds(result)).toContain("eu-led-emc");
  });

  it("uses the cosmetics regulation and excludes generic EU GPSR for cosmetics", () => {
    const result = buildComplianceReview(
      "face serum cosmetic skincare product",
      "France",
      "Shopify"
    );

    expect(ruleIds(result)).toContain("eu-cosmetics");
    expect(ruleIds(result)).not.toContain("eu-gpsr");
  });

  it("matches REACH for jewellery in the EU", () => {
    const result = buildComplianceReview(
      "stainless steel necklace jewelry",
      "Germany",
      "Etsy"
    );

    expect(ruleIds(result)).toContain("eu-jewelry-reach");
  });
});

describe("United States rule applicability", () => {
  it("matches FCC for Bluetooth headphones", () => {
    const result = buildComplianceReview(
      "Bluetooth wireless headphones with lithium battery",
      "United States",
      "Amazon"
    );

    expect(ruleIds(result)).toContain("us-fcc-radio");
    expect(ruleIds(result)).toContain("us-lithium-transport");
    expect(ruleIds(result)).toContain("us-cpsc-general");
  });

  it("matches the mandatory toy framework", () => {
    const result = buildComplianceReview(
      "children's plush toy",
      "United States",
      "Amazon"
    );

    expect(ruleIds(result)).toContain("us-toy");
    expect(ruleIds(result)).toContain("us-cpsc-general");
  });

  it("adds children's jewellery rules only when children=yes", () => {
    const adult = buildComplianceReview(
      "silver bracelet jewelry",
      "United States",
      "Etsy",
      { children: false }
    );
    const child = buildComplianceReview(
      "silver bracelet jewelry",
      "United States",
      "Etsy",
      { children: true }
    );

    expect(ruleIds(adult)).not.toContain("us-childrens-jewelry");
    expect(ruleIds(child)).toContain("us-childrens-jewelry");
  });

  it("matches FDA cosmetics and MoCRA review without generic CPSC baseline", () => {
    const result = buildComplianceReview(
      "cosmetic face cream skincare",
      "United States",
      "Shopify"
    );

    expect(ruleIds(result)).toContain("us-cosmetics-label");
    expect(ruleIds(result)).toContain("us-cosmetics-mocra");
    expect(ruleIds(result)).not.toContain("us-cpsc-general");
  });
});

describe("UK, Canada and Australia coverage", () => {
  it("matches UK toy rules and excludes general-product baseline for toys", () => {
    const result = buildComplianceReview(
      "kids toy doll",
      "United Kingdom",
      "Amazon"
    );

    expect(ruleIds(result)).toContain("uk-toys");
    expect(ruleIds(result)).not.toContain("uk-general-product-safety");
  });

  it("matches UK radio, WEEE and battery layers for Bluetooth electronics", () => {
    const result = buildComplianceReview(
      "Bluetooth speaker with rechargeable battery",
      "United Kingdom",
      "Amazon"
    );

    expect(ruleIds(result)).toContain("uk-radio");
    expect(ruleIds(result)).toContain("uk-weee");
    expect(ruleIds(result)).toContain("uk-batteries");
  });

  it("matches Canada's toy rules and CCPSA baseline", () => {
    const result = buildComplianceReview(
      "children's toy plush doll",
      "Canada",
      "Amazon"
    );

    expect(ruleIds(result)).toContain("ca-toys");
    expect(ruleIds(result)).toContain("ca-ccpsa");
  });

  it("matches Canada cosmetics without generic CCPSA baseline", () => {
    const result = buildComplianceReview(
      "cosmetic skincare serum",
      "Canada",
      "Shopify"
    );

    expect(ruleIds(result)).toContain("ca-cosmetics");
    expect(ruleIds(result)).not.toContain("ca-ccpsa");
  });

  it("adds Canadian children's jewellery rule only for children=yes", () => {
    const result = buildComplianceReview(
      "bracelet jewellery",
      "Canada",
      "Etsy",
      { children: true }
    );

    expect(ruleIds(result)).toContain("ca-childrens-jewelry");
  });

  it("matches Australia's ACMA/RCM layer for Bluetooth electronics", () => {
    const result = buildComplianceReview(
      "Bluetooth wireless speaker",
      "Australia",
      "Amazon"
    );

    expect(ruleIds(result)).toContain("au-radio-rcm");
    expect(ruleIds(result)).toContain("au-consumer-product-safety");
  });

  it("matches Australia's candle lead-wick prohibition", () => {
    const result = buildComplianceReview(
      "scented wax candle",
      "Australia",
      "Etsy"
    );

    expect(ruleIds(result)).toContain("au-candle-lead-wick");
    expect(ruleIds(result)).toContain("au-consumer-product-safety");
  });

  it("matches Australia's cosmetics ingredient-labelling standard", () => {
    const result = buildComplianceReview(
      "cosmetic face cream",
      "Australia",
      "Shopify"
    );

    expect(ruleIds(result)).toContain("au-cosmetics-label");
  });
});

describe("risk scoring", () => {
  it("produces a high-or-critical signal for a US children's toy", () => {
    const result = buildComplianceReview(
      "children's toy doll",
      "United States",
      "Amazon"
    );

    expect(result.risk.score).toBeGreaterThanOrEqual(50);
    expect(["high", "critical"]).toContain(result.risk.level);
    expect(result.risk.topDrivers.length).toBeGreaterThan(0);
  });

  it("keeps a simple Australian candle below high risk", () => {
    const result = buildComplianceReview(
      "scented wax candle",
      "Australia",
      "Etsy",
      {
        radio: false,
        battery: false,
        children: false,
        mains: false,
        role: "seller",
      }
    );

    expect(result.risk.score).toBeLessThan(50);
    expect(["low", "moderate"]).toContain(result.risk.level);
  });

  it("drops uncertainty when critical facts are confirmed", () => {
    const unknown = buildComplianceReview(
      "Bluetooth headphones",
      "Germany",
      "Amazon"
    );
    const confirmed = buildComplianceReview(
      "Bluetooth headphones",
      "Germany",
      "Amazon",
      {
        radio: true,
        battery: true,
        children: false,
        mains: false,
        role: "importer",
      }
    );

    const unknownFactor = unknown.risk.factors.find(
      (factor) => factor.id === "unknown-facts"
    );
    const confirmedFactor = confirmed.risk.factors.find(
      (factor) => factor.id === "unknown-facts"
    );

    expect(unknownFactor).toBeDefined();
    expect(confirmedFactor).toBeUndefined();
    expect(confirmed.risk.score).toBeLessThan(unknown.risk.score);
  });

  it("always keeps screening risk bounded to 0-100", () => {
    const result = buildComplianceReview(
      "Bluetooth rechargeable electronic children's toy speaker with lithium battery 230v mains",
      "Germany",
      "Amazon",
      {
        radio: true,
        battery: true,
        children: true,
        mains: true,
        role: "manufacturer",
      }
    );

    expect(result.risk.score).toBeGreaterThanOrEqual(0);
    expect(result.risk.score).toBeLessThanOrEqual(100);
  });
});

describe("report/check query reproducibility", () => {
  it("round-trips confirmed product facts through URL parameters", () => {
    const params = buildCheckParams({
      product: "Bluetooth headphones",
      country: "Germany",
      marketplace: "Amazon",
      facts: {
        radio: true,
        battery: false,
        children: false,
        mains: false,
        role: "importer",
      },
    });

    const parsed = parseCheckFacts(Object.fromEntries(params.entries()));

    expect(params.get("product")).toBe("Bluetooth headphones");
    expect(params.get("country")).toBe("Germany");
    expect(params.get("marketplace")).toBe("Amazon");
    expect(parsed).toEqual({
      radio: true,
      battery: false,
      children: false,
      mains: false,
      role: "importer",
    });
  });

  it("ignores an invalid supply-chain role", () => {
    const facts = parseCheckFacts({
      radio: "yes",
      role: "super-admin",
    });

    expect(facts.radio).toBe(true);
    expect(facts.role).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import {
  buildSourceRegistryMetadata,
  canonicalizeOfficialUrl,
} from "../lib/regulatory-source-registry";

describe("official source canonicalization", () => {
  it("removes tracking parameters and fragments while preserving meaningful query parameters", () => {
    const url = canonicalizeOfficialUrl(
      "https://example.gov/rules/?utm_source=test&b=2&a=1#section"
    );

    expect(url).toBe("https://example.gov/rules?a=1&b=2");
  });

  it("normalizes trailing slashes on non-root paths", () => {
    expect(
      canonicalizeOfficialUrl("https://www.gov.uk/guidance/batteries/")
    ).toBe("https://www.gov.uk/guidance/batteries");
  });
});

describe("official source authority metadata", () => {
  it("recognizes EUR-Lex legislation as an EU source", () => {
    const source = buildSourceRegistryMetadata({
      label: "EUR-Lex — Regulation (EU) 2023/988",
      url: "https://eur-lex.europa.eu/eli/reg/2023/988/oj",
      markets: ["germany", "france"],
    });

    expect(source.authoritySlug).toBe("eur-lex-eu");
    expect(source.jurisdictionSlug).toBe("european-union");
    expect(source.sourceKind).toBe("legislation");
    expect(source.marketSlugs).toEqual(["france", "germany"]);
  });

  it("recognizes US CPSC sources", () => {
    const source = buildSourceRegistryMetadata({
      label: "CPSC — Toy Safety",
      url: "https://www.cpsc.gov/FAQ/Toy-Safety",
      markets: ["united-states"],
    });

    expect(source.authoritySlug).toBe("us-cpsc");
    expect(source.authorityName).toContain("Consumer Product Safety Commission");
    expect(source.jurisdictionSlug).toBe("united-states");
  });

  it("distinguishes Health Canada from ISED", () => {
    const health = buildSourceRegistryMetadata({
      label: "Health Canada — Notification of Cosmetics",
      url: "https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/notification-cosmetics.html",
      markets: ["canada"],
    });

    const ised = buildSourceRegistryMetadata({
      label: "ISED — ICES-005 Lighting Equipment",
      url: "https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/devices-and-equipment/interference-causing-equipment-standards-ices/ices-005-lighting-equipment",
      markets: ["canada"],
    });

    expect(health.authoritySlug).toBe("ca-health-canada");
    expect(ised.authoritySlug).toBe("ca-ised");
  });

  it("recognizes Australian regulator sources and source kinds", () => {
    const acma = buildSourceRegistryMetadata({
      label: "ACMA — Step 1: check the rules to follow",
      url: "https://www.acma.gov.au/step-1-check-rules-follow",
      markets: ["australia"],
    });

    const ban = buildSourceRegistryMetadata({
      label: "ACCC Product Safety — Candles with lead wicks ban",
      url: "https://www.productsafety.gov.au/business/find-banned-products/candles-with-lead-wicks-ban",
      markets: ["australia"],
    });

    expect(acma.authoritySlug).toBe("au-acma");
    expect(ban.authoritySlug).toBe("au-accc-product-safety");
    expect(ban.sourceKind).toBe("prohibition");
  });
});

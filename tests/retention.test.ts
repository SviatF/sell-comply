import { describe, expect, it } from "vitest";
import {
  buildRetentionCheckHref,
  retentionKey,
  sameRetentionTarget,
} from "../lib/retention";

describe("retention identity", () => {
  it("treats the same product-market without a marketplace as the same target", () => {
    expect(
      sameRetentionTarget(
        { rawProduct: "Wireless Headphones", marketSlug: "germany" },
        { rawProduct: " wireless headphones ", marketName: "Germany" }
      )
    ).toBe(true);
  });

  it("keeps marketplace-specific watches distinct from market-only watches", () => {
    const marketOnly = {
      rawProduct: "Wireless Headphones",
      marketSlug: "germany",
    };
    const amazon = {
      rawProduct: "Wireless Headphones",
      marketSlug: "germany",
      marketplaceSlug: "amazon",
    };

    expect(retentionKey(marketOnly)).not.toBe(retentionKey(amazon));
  });

  it("does not force a marketplace into dashboard return links", () => {
    const href = buildRetentionCheckHref({
      rawProduct: "Wireless Headphones",
      marketName: "Germany",
    });

    expect(href).toBe("/check?product=Wireless+Headphones&country=Germany");
    expect(href).not.toContain("marketplace=");
  });

  it("preserves a marketplace only when the user actually selected one", () => {
    expect(
      buildRetentionCheckHref({
        rawProduct: "Wireless Headphones",
        marketName: "Germany",
        marketplaceName: "Amazon",
      })
    ).toBe("/check?product=Wireless+Headphones&country=Germany&marketplace=Amazon");
  });
});

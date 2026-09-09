import { describe, expect, it } from "vitest";
import { indexableRoutes, getIndexableRouteStats } from "../lib/indexable-routes";
import { marketplaces, markets, products } from "../lib/seo-data";

describe("indexable URL manifest", () => {
  it("contains only unique paths", () => {
    const paths = indexableRoutes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("contains the complete current product × market matrix", () => {
    const productMarketRoutes = indexableRoutes.filter(
      (route) => route.type === "product-market"
    );

    expect(productMarketRoutes).toHaveLength(products.length * markets.length);

    for (const product of products) {
      for (const market of markets) {
        expect(
          productMarketRoutes.some(
            (route) => route.path === `/sell/${product.slug}/${market.slug}`
          )
        ).toBe(true);
      }
    }
  });

  it("contains the complete current marketplace × product matrix", () => {
    const marketplaceProductRoutes = indexableRoutes.filter(
      (route) => route.type === "marketplace-product"
    );

    expect(marketplaceProductRoutes).toHaveLength(
      marketplaces.length * products.length
    );

    for (const marketplace of marketplaces) {
      for (const product of products) {
        expect(
          marketplaceProductRoutes.some(
            (route) =>
              route.path === `/marketplaces/${marketplace.slug}/${product.slug}`
          )
        ).toBe(true);
      }
    }
  });

  it("keeps non-indexable product workflow routes out of the manifest", () => {
    const forbiddenPrefixes = [
      "/check",
      "/report",
      "/dashboard",
      "/ops",
      "/api",
    ];

    for (const route of indexableRoutes) {
      for (const prefix of forbiddenPrefixes) {
        expect(route.path.startsWith(prefix)).toBe(false);
      }
    }
  });

  it("keeps core trust pages in the indexable inventory", () => {
    const required = [
      "/about",
      "/methodology",
      "/sources-policy",
      "/editorial-policy",
      "/corrections",
      "/contact",
      "/privacy",
      "/terms",
      "/disclaimer",
    ];

    for (const path of required) {
      expect(indexableRoutes.some((route) => route.path === path)).toBe(true);
    }
  });

  it("reports a complete current URL inventory", () => {
    const stats = getIndexableRouteStats();
    const expectedTotal =
      13 + products.length * markets.length + marketplaces.length * products.length;

    expect(stats.total).toBe(expectedTotal);
    expect(stats.uniquePaths).toBe(expectedTotal);
    expect(stats.byType["product-market"]).toBe(products.length * markets.length);
    expect(stats.byType["marketplace-product"]).toBe(
      marketplaces.length * products.length
    );
  });
});

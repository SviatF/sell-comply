import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { indexableRoutes } from "../lib/indexable-routes";
import { buildSeoInternalLinkGraph } from "../lib/seo-link-graph";
import {
  HOME_DISCOVERY_LINKS,
  SEO_FOOTER_LEGAL_LINKS,
  SEO_FOOTER_PRIMARY_LINKS,
  SEO_HEADER_LINKS,
  getMarketHubLinks,
  getMarketplaceHubLinks,
  getMarketplaceProductInternalLinks,
  getProductHubLinks,
  getProductMarketInternalLinks,
} from "../lib/seo-internal-links";
import { marketplaces, markets, products } from "../lib/seo-data";

const indexablePaths = new Set(indexableRoutes.map((route) => route.path));
const graph = buildSeoInternalLinkGraph();

function shortestDistances(start: string) {
  const distances = new Map<string, number>([[start, 0]]);
  const queue = [start];

  while (queue.length) {
    const current = queue.shift()!;
    const nextDistance = distances.get(current)! + 1;

    for (const target of graph.get(current) ?? []) {
      if (distances.has(target)) continue;
      distances.set(target, nextDistance);
      queue.push(target);
    }
  }

  return distances;
}

describe("SEO Batch 1 — internal link quality gate", () => {
  it("models the exact current 101-URL indexable graph", () => {
    expect([...graph.keys()].sort()).toEqual(
      indexableRoutes.map((route) => route.path).sort()
    );
    expect(graph.size).toBe(101);
  });

  it("keeps every modeled crawlable target inside the indexable inventory", () => {
    for (const [from, targets] of graph) {
      for (const target of targets) {
        expect(target.startsWith("/"), `${from} → ${target}`).toBe(true);
        expect(target.includes("?"), `${from} → ${target}`).toBe(false);
        expect(target.includes("#"), `${from} → ${target}`).toBe(false);
        expect(indexablePaths.has(target), `${from} → ${target}`).toBe(true);
      }
    }
  });

  it("leaves no orphan indexable pages", () => {
    const inbound = new Map<string, number>(
      indexableRoutes.map((route) => [route.path, 0])
    );

    for (const [from, targets] of graph) {
      for (const target of targets) {
        if (target === from) continue;
        inbound.set(target, (inbound.get(target) ?? 0) + 1);
      }
    }

    for (const route of indexableRoutes) {
      if (route.path === "/") continue;
      expect(inbound.get(route.path), `${route.path}: orphan page`).toBeGreaterThan(0);
    }
  });

  it("makes every indexable page crawlable from the homepage within three clicks", () => {
    const distances = shortestDistances("/");

    expect(distances.size).toBe(indexableRoutes.length);

    for (const route of indexableRoutes) {
      expect(distances.has(route.path), `${route.path}: unreachable from home`).toBe(true);
      expect(distances.get(route.path)!, route.path).toBeLessThanOrEqual(3);
    }
  });

  it("prevents indexable dead ends after ignoring self-navigation", () => {
    for (const [path, targets] of graph) {
      const usefulTargets = [...targets].filter((target) => target !== path);
      expect(usefulTargets.length, `${path}: dead end`).toBeGreaterThan(0);
    }
  });

  it("covers every taxonomy item from its primary hub", () => {
    const productLinks = getProductHubLinks();
    const marketLinks = getMarketHubLinks();
    const marketplaceLinks = getMarketplaceHubLinks();

    expect(productLinks).toHaveLength(products.length);
    expect(marketLinks).toHaveLength(markets.length);
    expect(marketplaceLinks).toHaveLength(marketplaces.length);

    for (const link of [...productLinks, ...marketLinks, ...marketplaceLinks]) {
      expect(indexablePaths.has(link.href), link.href).toBe(true);
    }

    expect(new Set(productLinks.map((link) => link.href)).size).toBe(products.length);
    expect(new Set(marketLinks.map((link) => link.href)).size).toBe(markets.length);
    expect(new Set(marketplaceLinks.map((link) => link.href)).size).toBe(
      marketplaces.length
    );
  });

  it("cross-links every product × market page without contextual self-links", () => {
    for (const product of products) {
      for (const market of markets) {
        const path = `/sell/${product.slug}/${market.slug}`;
        const links = getProductMarketInternalLinks(product, market);

        expect(links.markets).toHaveLength(markets.length - 1);
        expect(links.products).toHaveLength(products.length - 1);
        expect(links.marketplaces).toHaveLength(marketplaces.length);

        for (const link of [
          ...links.markets,
          ...links.products,
          ...links.marketplaces,
        ]) {
          expect(link.href, path).not.toBe(path);
          expect(indexablePaths.has(link.href), `${path} → ${link.href}`).toBe(true);
        }
      }
    }
  });

  it("cross-links every marketplace × product page without contextual self-links", () => {
    for (const marketplace of marketplaces) {
      for (const product of products) {
        const path = `/marketplaces/${marketplace.slug}/${product.slug}`;
        const links = getMarketplaceProductInternalLinks(product, marketplace);

        expect(links.markets).toHaveLength(markets.length);
        expect(links.products).toHaveLength(products.length - 1);
        expect(links.marketplaces).toHaveLength(marketplaces.length - 1);

        for (const link of [
          ...links.markets,
          ...links.products,
          ...links.marketplaces,
        ]) {
          expect(link.href, path).not.toBe(path);
          expect(indexablePaths.has(link.href), `${path} → ${link.href}`).toBe(true);
        }
      }
    }
  });

  it("keeps global and homepage SEO manifests limited to clean indexable URLs", () => {
    for (const link of [
      ...SEO_HEADER_LINKS,
      ...SEO_FOOTER_PRIMARY_LINKS,
      ...SEO_FOOTER_LEGAL_LINKS,
      ...HOME_DISCOVERY_LINKS,
    ]) {
      expect(indexablePaths.has(link.href), link.href).toBe(true);
      expect(link.href.includes("?"), link.href).toBe(false);
      expect(link.href.includes("#"), link.href).toBe(false);
      expect(link.label.trim().length, link.href).toBeGreaterThan(0);
    }
  });

  it("wires production templates to the shared internal-link manifests", () => {
    const chrome = readFileSync("app/components/SeoChrome.tsx", "utf8");
    const home = readFileSync("app/page.tsx", "utf8");
    const dynamic = readFileSync("app/components/ComplianceSeoPage.tsx", "utf8");

    expect(chrome).toContain("SEO_HEADER_LINKS.map");
    expect(chrome).toContain("SEO_FOOTER_PRIMARY_LINKS.map");
    expect(chrome).toContain("SEO_FOOTER_LEGAL_LINKS.map");

    expect(home).toContain("HOME_DISCOVERY_LINKS.map");
    expect(home).toContain("SEO_FOOTER_PRIMARY_LINKS");
    expect(home).toContain("SEO_FOOTER_LEGAL_LINKS");

    expect(dynamic).toContain("getProductMarketInternalLinks(product, market)");
    expect(dynamic).toContain(
      "getMarketplaceProductInternalLinks(product, marketplace)"
    );
    expect(dynamic).toContain("internalLinks.markets.map");
    expect(dynamic).toContain("internalLinks.products.map");
    expect(dynamic).toContain("internalLinks.marketplaces.map");

    for (const [file, fn] of [
      ["app/products/page.tsx", "getProductHubLinks"],
      ["app/markets/page.tsx", "getMarketHubLinks"],
      ["app/marketplaces/page.tsx", "getMarketplaceHubLinks"],
    ] as const) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toContain(`const hubLinks = ${fn}();`);
      expect(source, file).toContain("hubLinks.map");
    }
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { indexableRoutes } from "../lib/indexable-routes";
import { marketplaces, markets, products } from "../lib/seo-data";

type SeoAuditRecord = {
  path: string;
  title: string;
  description: string;
  h1: string;
  kind: "core" | "product-market" | "marketplace-product";
};

const productMarketRouteSource = readFileSync(
  "app/sell/[product]/[country]/page.tsx",
  "utf8"
);
const marketplaceProductRouteSource = readFileSync(
  "app/marketplaces/[marketplace]/[product]/page.tsx",
  "utf8"
);
const complianceSeoPageSource = readFileSync(
  "app/components/ComplianceSeoPage.tsx",
  "utf8"
);

const coreRoutes = [
  { path: "/", page: "app/page.tsx", metadata: "app/layout.tsx", home: true },
  { path: "/products", page: "app/products/page.tsx" },
  { path: "/markets", page: "app/markets/page.tsx" },
  { path: "/marketplaces", page: "app/marketplaces/page.tsx" },
  { path: "/about", page: "app/about/page.tsx" },
  { path: "/methodology", page: "app/methodology/page.tsx" },
  { path: "/sources-policy", page: "app/sources-policy/page.tsx" },
  { path: "/editorial-policy", page: "app/editorial-policy/page.tsx" },
  { path: "/corrections", page: "app/corrections/page.tsx" },
  { path: "/contact", page: "app/contact/page.tsx" },
  { path: "/privacy", page: "app/privacy/page.tsx" },
  { path: "/terms", page: "app/terms/page.tsx" },
  { path: "/disclaimer", page: "app/disclaimer/page.tsx" },
] as const;

function normalize(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[’‘]/g, "'")
    .trim()
    .toLowerCase();
}

function metadataBlock(source: string) {
  const match = source.match(/export const metadata: Metadata = \{([\s\S]*?)\n\};/);
  expect(match, "Indexable core route must export static metadata").toBeTruthy();
  return match![1];
}

function extractCoreTitle(source: string, home = false) {
  const block = metadataBlock(source);
  const match = home
    ? block.match(/default:\s*"([^"]+)"/)
    : block.match(/title:\s*"([^"]+)"/);

  expect(match, "Indexable core route must expose a static title").toBeTruthy();
  return match![1];
}

function extractCoreDescription(source: string) {
  const block = metadataBlock(source);
  const match = block.match(/description:\s*"([^"]+)"/);

  expect(match, "Indexable core route must expose a static description").toBeTruthy();
  return match![1];
}

function cleanJsxText(value: string) {
  return value
    .replace(/\{\s*["']\s+["']\s*\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCoreH1(source: string) {
  const direct = source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (direct) return cleanJsxText(direct[1]);

  const trustPolicy = source.match(
    /<TrustPolicyPage[\s\S]*?\btitle="([^"]+)"[\s\S]*?\baccent="([^"]+)"/
  );
  if (trustPolicy) return `${trustPolicy[1]} ${trustPolicy[2]}`.trim();

  throw new Error("Indexable core route must expose one parseable H1");
}

function buildCoreRecords(): SeoAuditRecord[] {
  return coreRoutes.map((route) => {
    const pageSource = readFileSync(route.page, "utf8");
    const metadataSource = readFileSync(
      "metadata" in route && route.metadata ? route.metadata : route.page,
      "utf8"
    );

    return {
      path: route.path,
      title: extractCoreTitle(metadataSource, "home" in route && route.home === true),
      description: extractCoreDescription(metadataSource),
      h1: extractCoreH1(pageSource),
      kind: "core",
    };
  });
}

function buildDynamicRecords(): SeoAuditRecord[] {
  const records: SeoAuditRecord[] = [];

  for (const product of products) {
    for (const market of markets) {
      records.push({
        path: `/sell/${product.slug}/${market.slug}`,
        title: `Can I Sell ${product.name} in ${market.name}? Compliance Check`,
        description: `Check common product compliance, safety, labelling and documentation areas for selling ${product.name} in ${market.name}. Use SellComply to review your exact product.`,
        h1: `Can I sell ${product.name} in ${market.name}?`,
        kind: "product-market",
      });
    }
  }

  for (const marketplace of marketplaces) {
    for (const product of products) {
      records.push({
        path: `/marketplaces/${marketplace.slug}/${product.slug}`,
        title: `${product.name} Compliance for ${marketplace.name} Sellers`,
        description: `Review common product-compliance and listing questions for selling ${product.name} on ${marketplace.name}. Compare platform and target-market requirements with SellComply.`,
        h1: `${product.name} compliance for ${marketplace.name}`,
        kind: "marketplace-product",
      });
    }
  }

  return records;
}

const records = [...buildCoreRecords(), ...buildDynamicRecords()];

describe("SEO Batch 1 — title / description / H1 quality gate", () => {
  it("locks the production dynamic metadata and H1 templates used by Next routes", () => {
    expect(productMarketRouteSource).toContain(
      'const title = `Can I Sell ${product.name} in ${market.name}? Compliance Check`;'
    );
    expect(productMarketRouteSource).toContain(
      'const description = `Check common product compliance, safety, labelling and documentation areas for selling ${product.name} in ${market.name}. Use SellComply to review your exact product.`;'
    );

    expect(marketplaceProductRouteSource).toContain(
      'const title = `${product.name} Compliance for ${marketplace.name} Sellers`;'
    );
    expect(marketplaceProductRouteSource).toContain(
      'const description = `Review common product-compliance and listing questions for selling ${product.name} on ${marketplace.name}. Compare platform and target-market requirements with SellComply.`;'
    );

    expect(complianceSeoPageSource).toContain(
      'Can I sell <em>{product.name}</em> in {market.name}?'
    );
    expect(complianceSeoPageSource).toContain(
      '<em>{product.name}</em> compliance for {marketplace?.name}'
    );
  });

  it("audits the exact current indexable inventory", () => {
    const manifestPaths = indexableRoutes.map((route) => route.path).sort();
    const auditedPaths = records.map((record) => record.path).sort();

    expect(auditedPaths).toEqual(manifestPaths);
  });

  it("requires useful title, description and H1 copy on every indexable URL", () => {
    for (const record of records) {
      expect(
        record.title.length,
        `${record.path}: title too short`
      ).toBeGreaterThanOrEqual(10);
      expect(
        record.description.length,
        `${record.path}: description too short`
      ).toBeGreaterThanOrEqual(50);
      expect(
        record.h1.length,
        `${record.path}: H1 too short`
      ).toBeGreaterThanOrEqual(8);
    }
  });

  it("keeps titles unique across all indexable URLs", () => {
    const values = records.map((record) => normalize(record.title));
    expect(new Set(values).size).toBe(records.length);
  });

  it("keeps descriptions unique across all indexable URLs", () => {
    const values = records.map((record) => normalize(record.description));
    expect(new Set(values).size).toBe(records.length);
  });

  it("keeps H1s unique across all indexable URLs", () => {
    const values = records.map((record) => normalize(record.h1));
    expect(new Set(values).size).toBe(records.length);
  });

  it("keeps product × market pages aligned to search intent", () => {
    for (const product of products) {
      for (const market of markets) {
        const path = `/sell/${product.slug}/${market.slug}`;
        const record = records.find((item) => item.path === path);

        expect(record, `${path}: missing SEO audit record`).toBeDefined();

        for (const value of [record!.title, record!.description, record!.h1]) {
          expect(normalize(value)).toContain(normalize(product.name));
          expect(normalize(value)).toContain(normalize(market.name));
        }

        expect(normalize(record!.title)).toMatch(/sell|compliance/);
      }
    }
  });

  it("keeps marketplace × product pages aligned to search intent", () => {
    for (const marketplace of marketplaces) {
      for (const product of products) {
        const path = `/marketplaces/${marketplace.slug}/${product.slug}`;
        const record = records.find((item) => item.path === path);

        expect(record, `${path}: missing SEO audit record`).toBeDefined();

        for (const value of [record!.title, record!.description, record!.h1]) {
          expect(normalize(value)).toContain(normalize(product.name));
          expect(normalize(value)).toContain(normalize(marketplace.name));
        }

        expect(normalize(record!.title)).toContain("compliance");
      }
    }
  });

  it("rejects placeholder or generic copy on core indexable routes", () => {
    const forbiddenExact = new Set([
      "home",
      "page",
      "products",
      "markets",
      "marketplaces",
      "sellcomply",
      "untitled",
    ]);

    for (const record of records.filter((item) => item.kind === "core")) {
      expect(forbiddenExact.has(normalize(record.title))).toBe(false);
      expect(forbiddenExact.has(normalize(record.h1))).toBe(false);
    }
  });
});

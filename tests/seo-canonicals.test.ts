import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { indexableRoutes } from "../lib/indexable-routes";
import { marketplaces, markets, products } from "../lib/seo-data";

const SITE_ORIGIN = "https://sellcomply.com";

const productMarketRouteSource = readFileSync(
  "app/sell/[product]/[country]/page.tsx",
  "utf8"
);
const marketplaceProductRouteSource = readFileSync(
  "app/marketplaces/[marketplace]/[product]/page.tsx",
  "utf8"
);
const layoutSource = readFileSync("app/layout.tsx", "utf8");

const coreCanonicalSources = [
  { path: "/", source: "app/layout.tsx" },
  { path: "/products", source: "app/products/page.tsx" },
  { path: "/markets", source: "app/markets/page.tsx" },
  { path: "/marketplaces", source: "app/marketplaces/page.tsx" },
  { path: "/about", source: "app/about/page.tsx" },
  { path: "/methodology", source: "app/methodology/page.tsx" },
  { path: "/sources-policy", source: "app/sources-policy/page.tsx" },
  { path: "/editorial-policy", source: "app/editorial-policy/page.tsx" },
  { path: "/corrections", source: "app/corrections/page.tsx" },
  { path: "/contact", source: "app/contact/page.tsx" },
  { path: "/privacy", source: "app/privacy/page.tsx" },
  { path: "/terms", source: "app/terms/page.tsx" },
  { path: "/disclaimer", source: "app/disclaimer/page.tsx" },
] as const;

function extractStaticCanonical(source: string) {
  const match = source.match(
    /alternates:\s*\{\s*canonical:\s*"([^"]+)"\s*\}/
  );

  expect(match, "Indexable core route must expose one static canonical").toBeTruthy();
  return match![1];
}

function buildCanonicalInventory() {
  const canonicals: Array<{ routePath: string; canonicalPath: string }> = coreCanonicalSources.map(({ path, source }) => ({
    routePath: path,
    canonicalPath: extractStaticCanonical(readFileSync(source, "utf8")),
  }));

  for (const product of products) {
    for (const market of markets) {
      canonicals.push({
        routePath: `/sell/${product.slug}/${market.slug}`,
        canonicalPath: `/sell/${product.slug}/${market.slug}`,
      });
    }
  }

  for (const marketplace of marketplaces) {
    for (const product of products) {
      canonicals.push({
        routePath: `/marketplaces/${marketplace.slug}/${product.slug}`,
        canonicalPath: `/marketplaces/${marketplace.slug}/${product.slug}`,
      });
    }
  }

  return canonicals;
}

const canonicalInventory = buildCanonicalInventory();

describe("SEO Batch 1 — canonical quality gate", () => {
  it("pins metadataBase to the production origin", () => {
    expect(layoutSource).toContain(
      'metadataBase: new URL("https://sellcomply.com")'
    );
    expect(SITE_ORIGIN).toBe("https://sellcomply.com");
  });

  it("locks the production dynamic canonical templates", () => {
    expect(productMarketRouteSource).toContain(
      'alternates: { canonical: `/sell/${product.slug}/${market.slug}` }'
    );

    expect(marketplaceProductRouteSource).toContain(
      'alternates: { canonical: `/marketplaces/${marketplace.slug}/${product.slug}` }'
    );
  });

  it("audits the exact current indexable inventory", () => {
    const manifestPaths = indexableRoutes.map((route) => route.path).sort();
    const auditedPaths = canonicalInventory.map((item) => item.routePath).sort();

    expect(auditedPaths).toEqual(manifestPaths);
  });

  it("requires every canonical to self-reference its route", () => {
    for (const item of canonicalInventory) {
      expect(
        item.canonicalPath,
        `${item.routePath}: canonical mismatch`
      ).toBe(item.routePath);
    }
  });

  it("resolves every canonical onto the production HTTPS host", () => {
    for (const item of canonicalInventory) {
      const resolved = new URL(item.canonicalPath, SITE_ORIGIN);

      expect(resolved.protocol, item.routePath).toBe("https:");
      expect(resolved.hostname, item.routePath).toBe("sellcomply.com");
      expect(resolved.port, item.routePath).toBe("");
      expect(resolved.pathname, item.routePath).toBe(item.routePath);
    }
  });

  it("rejects query strings, hashes and malformed canonical paths", () => {
    for (const item of canonicalInventory) {
      const resolved = new URL(item.canonicalPath, SITE_ORIGIN);

      expect(item.canonicalPath.startsWith("/"), item.routePath).toBe(true);
      expect(item.canonicalPath.includes("?"), item.routePath).toBe(false);
      expect(item.canonicalPath.includes("#"), item.routePath).toBe(false);
      expect(resolved.search, item.routePath).toBe("");
      expect(resolved.hash, item.routePath).toBe("");

      if (item.canonicalPath !== "/") {
        expect(item.canonicalPath.endsWith("/"), item.routePath).toBe(false);
      }
    }
  });

  it("keeps canonical URLs unique across all indexable pages", () => {
    const urls = canonicalInventory.map((item) =>
      new URL(item.canonicalPath, SITE_ORIGIN).toString()
    );

    expect(new Set(urls).size).toBe(canonicalInventory.length);
  });

  it("keeps workflow and private routes out of canonical indexable inventory", () => {
    const forbiddenPrefixes = [
      "/check",
      "/report",
      "/dashboard",
      "/ops",
      "/api",
      "/unsubscribe",
    ];

    for (const item of canonicalInventory) {
      for (const prefix of forbiddenPrefixes) {
        expect(item.routePath.startsWith(prefix), item.routePath).toBe(false);
        expect(item.canonicalPath.startsWith(prefix), item.routePath).toBe(false);
      }
    }
  });

  it("keeps every static core canonical explicitly self-referencing in source", () => {
    for (const { path, source } of coreCanonicalSources) {
      const canonical = extractStaticCanonical(readFileSync(source, "utf8"));
      expect(canonical, source).toBe(path);
    }
  });
});

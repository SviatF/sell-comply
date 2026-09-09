import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { indexableRoutes } from "../lib/indexable-routes";
import {
  getCoreBreadcrumbs,
  getMarketplaceProductBreadcrumbs,
  getProductMarketBreadcrumbs,
  type SeoBreadcrumbItem,
} from "../lib/seo-breadcrumbs";
import { marketplaces, markets, products } from "../lib/seo-data";

const SITE_ORIGIN = "https://sellcomply.com";

type BreadcrumbRecord = {
  path: string;
  items: SeoBreadcrumbItem[];
  kind: "home" | "core" | "product-market" | "marketplace-product";
};

const corePaths = [
  "/",
  "/products",
  "/markets",
  "/marketplaces",
  "/about",
  "/methodology",
  "/sources-policy",
  "/editorial-policy",
  "/corrections",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer",
] as const;

function buildRecords(): BreadcrumbRecord[] {
  const records: BreadcrumbRecord[] = corePaths.map((path) => ({
    path,
    items: getCoreBreadcrumbs(path),
    kind: path === "/" ? "home" : "core",
  }));

  for (const product of products) {
    for (const market of markets) {
      records.push({
        path: `/sell/${product.slug}/${market.slug}`,
        items: getProductMarketBreadcrumbs(product, market),
        kind: "product-market",
      });
    }
  }

  for (const marketplace of marketplaces) {
    for (const product of products) {
      records.push({
        path: `/marketplaces/${marketplace.slug}/${product.slug}`,
        items: getMarketplaceProductBreadcrumbs(product, marketplace),
        kind: "marketplace-product",
      });
    }
  }

  return records;
}

const records = buildRecords();
const indexablePathSet = new Set(indexableRoutes.map((route) => route.path));
const componentSource = readFileSync("app/components/SeoBreadcrumbs.tsx", "utf8");
const dynamicSource = readFileSync("app/components/ComplianceSeoPage.tsx", "utf8");
const trustSource = readFileSync("app/components/TrustPolicyPage.tsx", "utf8");

describe("SEO Batch 1 — breadcrumb quality gate", () => {
  it("audits the exact current indexable inventory", () => {
    expect(records.map((record) => record.path).sort()).toEqual(
      indexableRoutes.map((route) => route.path).sort()
    );
  });

  it("keeps the homepage as the breadcrumb root without rendering a redundant trail", () => {
    const home = records.find((record) => record.path === "/");
    expect(home?.items).toEqual([]);
  });

  it("requires every non-home indexable page to have a complete breadcrumb trail", () => {
    for (const record of records.filter((item) => item.path !== "/")) {
      expect(record.items.length, `${record.path}: breadcrumb trail too short`).toBeGreaterThanOrEqual(2);
      expect(record.items[0], record.path).toEqual({ name: "Home", href: "/" });
      expect(record.items.at(-1)?.href, record.path).toBe(record.path);
    }
  });

  it("keeps every breadcrumb URL clean and on the production site", () => {
    for (const record of records) {
      for (const item of record.items) {
        expect(item.name.trim().length, record.path).toBeGreaterThan(0);
        expect(item.href.startsWith("/"), record.path).toBe(true);
        expect(item.href.includes("?"), record.path).toBe(false);
        expect(item.href.includes("#"), record.path).toBe(false);

        if (item.href !== "/") {
          expect(item.href.endsWith("/"), record.path).toBe(false);
        }

        const url = new URL(item.href, SITE_ORIGIN);
        expect(url.protocol, record.path).toBe("https:");
        expect(url.hostname, record.path).toBe("sellcomply.com");
      }
    }
  });

  it("keeps intermediate breadcrumb links inside the indexable architecture", () => {
    for (const record of records.filter((item) => item.path !== "/")) {
      for (const item of record.items.slice(0, -1)) {
        expect(
          indexablePathSet.has(item.href),
          `${record.path}: non-indexable breadcrumb parent ${item.href}`
        ).toBe(true);
      }
    }
  });

  it("uses the Products hub for product × market pages", () => {
    for (const product of products) {
      for (const market of markets) {
        const path = `/sell/${product.slug}/${market.slug}`;
        const record = records.find((item) => item.path === path);

        expect(record?.items[1], path).toEqual({ name: "Products", href: "/products" });
        expect(record?.items.at(-1)?.name, path).toContain(product.name);
        expect(record?.items.at(-1)?.name, path).toContain(market.name);
      }
    }
  });

  it("uses the Marketplaces hub for marketplace × product pages", () => {
    for (const marketplace of marketplaces) {
      for (const product of products) {
        const path = `/marketplaces/${marketplace.slug}/${product.slug}`;
        const record = records.find((item) => item.path === path);

        expect(record?.items[1], path).toEqual({
          name: "Marketplaces",
          href: "/marketplaces",
        });
        expect(record?.items.some((item) => item.href === "/products"), path).toBe(false);
        expect(record?.items.at(-1)?.name, path).toContain(product.name);
        expect(record?.items.at(-1)?.name, path).toContain(marketplace.name);
      }
    }
  });

  it("renders semantic breadcrumb navigation and BreadcrumbList JSON-LD from the same items", () => {
    expect(componentSource).toContain('aria-label="Breadcrumb"');
    expect(componentSource).toContain('aria-current="page"');
    expect(componentSource).toContain('"@type": "BreadcrumbList"');
    expect(componentSource).toContain('"@type": "ListItem"');
    expect(componentSource).toContain("itemListElement: items.map");
    expect(componentSource).toContain("new URL(item.href, SITE_ORIGIN).toString()");
  });

  it("uses the shared breadcrumb component across dynamic, trust and core SEO templates", () => {
    expect(dynamicSource).toContain("<SeoBreadcrumbs items={breadcrumbs} />");
    expect(dynamicSource).toContain("getProductMarketBreadcrumbs(product, market)");
    expect(dynamicSource).toContain("getMarketplaceProductBreadcrumbs(product, marketplace)");
    expect(trustSource).toContain("<SeoBreadcrumbs items={getCoreBreadcrumbs(path)} />");

    for (const path of [
      "app/products/page.tsx",
      "app/markets/page.tsx",
      "app/marketplaces/page.tsx",
      "app/about/page.tsx",
    ]) {
      expect(readFileSync(path, "utf8"), path).toContain("<SeoBreadcrumbs");
    }
  });

  it("binds every trust-policy route to its own breadcrumb path", () => {
    for (const [path, route] of [
      ["app/methodology/page.tsx", "/methodology"],
      ["app/sources-policy/page.tsx", "/sources-policy"],
      ["app/editorial-policy/page.tsx", "/editorial-policy"],
      ["app/corrections/page.tsx", "/corrections"],
      ["app/contact/page.tsx", "/contact"],
      ["app/privacy/page.tsx", "/privacy"],
      ["app/terms/page.tsx", "/terms"],
      ["app/disclaimer/page.tsx", "/disclaimer"],
    ] as const) {
      expect(readFileSync(path, "utf8"), path).toContain(`path="${route}"`);
    }
  });
});

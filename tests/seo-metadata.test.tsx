import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Metadata } from "next";
import { beforeAll, describe, expect, it } from "vitest";

import Home from "../app/page";
import { metadata as rootMetadata } from "../app/layout";
import ProductsPage, { metadata as productsMetadata } from "../app/products/page";
import MarketsPage, { metadata as marketsMetadata } from "../app/markets/page";
import MarketplacesPage, { metadata as marketplacesMetadata } from "../app/marketplaces/page";
import AboutPage, { metadata as aboutMetadata } from "../app/about/page";
import MethodologyPage, { metadata as methodologyMetadata } from "../app/methodology/page";
import SourcesPolicyPage, { metadata as sourcesPolicyMetadata } from "../app/sources-policy/page";
import EditorialPolicyPage, { metadata as editorialPolicyMetadata } from "../app/editorial-policy/page";
import CorrectionsPage, { metadata as correctionsMetadata } from "../app/corrections/page";
import ContactPage, { metadata as contactMetadata } from "../app/contact/page";
import PrivacyPage, { metadata as privacyMetadata } from "../app/privacy/page";
import TermsPage, { metadata as termsMetadata } from "../app/terms/page";
import DisclaimerPage, { metadata as disclaimerMetadata } from "../app/disclaimer/page";
import ComplianceSeoPage from "../app/components/ComplianceSeoPage";
import { generateMetadata as generateProductMarketMetadata } from "../app/sell/[product]/[country]/page";
import { generateMetadata as generateMarketplaceProductMetadata } from "../app/marketplaces/[marketplace]/[product]/page";
import { indexableRoutes } from "../lib/indexable-routes";
import { marketplaces, markets, products } from "../lib/seo-data";

type SeoAuditRecord = {
  path: string;
  title: string;
  description: string;
  h1: string;
  kind: "core" | "product-market" | "marketplace-product";
};

function normalize(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[’‘]/g, "'")
    .trim()
    .toLowerCase();
}

function metadataTitle(metadata: Metadata) {
  const title = metadata.title;

  if (typeof title === "string") return title;

  if (title && typeof title === "object") {
    if ("absolute" in title && title.absolute) return String(title.absolute);
    if ("default" in title && title.default) return String(title.default);
  }

  return "";
}

function metadataDescription(metadata: Metadata) {
  return typeof metadata.description === "string" ? metadata.description : "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractH1(node: React.ReactNode) {
  const html = renderToStaticMarkup(
    React.createElement(React.Fragment, null, node)
  );
  const matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];

  expect(matches, "Every indexable page must render exactly one H1").toHaveLength(1);

  return decodeHtml(
    matches[0][1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  );
}

function coreRecord(
  path: string,
  metadata: Metadata,
  node: React.ReactNode
): SeoAuditRecord {
  return {
    path,
    title: metadataTitle(metadata),
    description: metadataDescription(metadata),
    h1: extractH1(node),
    kind: "core",
  };
}

async function buildSeoAuditInventory(): Promise<SeoAuditRecord[]> {
  const records: SeoAuditRecord[] = [
    coreRecord("/", rootMetadata, React.createElement(Home)),
    coreRecord("/products", productsMetadata, React.createElement(ProductsPage)),
    coreRecord("/markets", marketsMetadata, React.createElement(MarketsPage)),
    coreRecord(
      "/marketplaces",
      marketplacesMetadata,
      React.createElement(MarketplacesPage)
    ),
    coreRecord("/about", aboutMetadata, React.createElement(AboutPage)),
    coreRecord(
      "/methodology",
      methodologyMetadata,
      React.createElement(MethodologyPage)
    ),
    coreRecord(
      "/sources-policy",
      sourcesPolicyMetadata,
      React.createElement(SourcesPolicyPage)
    ),
    coreRecord(
      "/editorial-policy",
      editorialPolicyMetadata,
      React.createElement(EditorialPolicyPage)
    ),
    coreRecord(
      "/corrections",
      correctionsMetadata,
      React.createElement(CorrectionsPage)
    ),
    coreRecord("/contact", contactMetadata, React.createElement(ContactPage)),
    coreRecord("/privacy", privacyMetadata, React.createElement(PrivacyPage)),
    coreRecord("/terms", termsMetadata, React.createElement(TermsPage)),
    coreRecord(
      "/disclaimer",
      disclaimerMetadata,
      React.createElement(DisclaimerPage)
    ),
  ];

  for (const product of products) {
    for (const market of markets) {
      const metadata = await generateProductMarketMetadata({
        params: Promise.resolve({ product: product.slug, country: market.slug }),
      });

      records.push({
        path: `/sell/${product.slug}/${market.slug}`,
        title: metadataTitle(metadata),
        description: metadataDescription(metadata),
        h1: extractH1(
          React.createElement(ComplianceSeoPage, { product, market })
        ),
        kind: "product-market",
      });
    }
  }

  for (const marketplace of marketplaces) {
    for (const product of products) {
      const metadata = await generateMarketplaceProductMetadata({
        params: Promise.resolve({
          marketplace: marketplace.slug,
          product: product.slug,
        }),
      });

      records.push({
        path: `/marketplaces/${marketplace.slug}/${product.slug}`,
        title: metadataTitle(metadata),
        description: metadataDescription(metadata),
        h1: extractH1(
          React.createElement(ComplianceSeoPage, { product, marketplace })
        ),
        kind: "marketplace-product",
      });
    }
  }

  return records;
}

let records: SeoAuditRecord[] = [];

beforeAll(async () => {
  records = await buildSeoAuditInventory();
});

describe("SEO Batch 1 — title / description / H1 quality gate", () => {
  it("audits the exact current indexable inventory", () => {
    const manifestPaths = indexableRoutes.map((route) => route.path).sort();
    const auditedPaths = records.map((record) => record.path).sort();

    expect(auditedPaths).toEqual(manifestPaths);
  });

  it("requires one useful title, description and H1 on every indexable URL", () => {
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
    const titles = records.map((record) => normalize(record.title));
    expect(new Set(titles).size).toBe(records.length);
  });

  it("keeps descriptions unique across all indexable URLs", () => {
    const descriptions = records.map((record) => normalize(record.description));
    expect(new Set(descriptions).size).toBe(records.length);
  });

  it("keeps H1s unique across all indexable URLs", () => {
    const h1s = records.map((record) => normalize(record.h1));
    expect(new Set(h1s).size).toBe(records.length);
  });

  it("keeps product × market pages aligned to their search intent", () => {
    for (const product of products) {
      for (const market of markets) {
        const path = `/sell/${product.slug}/${market.slug}`;
        const record = records.find((item) => item.path === path);

        expect(record, `${path}: missing SEO audit record`).toBeDefined();

        for (const value of [record!.title, record!.description, record!.h1]) {
          const normalized = normalize(value);
          expect(normalized).toContain(normalize(product.name));
          expect(normalized).toContain(normalize(market.name));
        }

        expect(normalize(record!.title)).toMatch(/sell|compliance/);
      }
    }
  });

  it("keeps marketplace × product pages aligned to their search intent", () => {
    for (const marketplace of marketplaces) {
      for (const product of products) {
        const path = `/marketplaces/${marketplace.slug}/${product.slug}`;
        const record = records.find((item) => item.path === path);

        expect(record, `${path}: missing SEO audit record`).toBeDefined();

        for (const value of [record!.title, record!.description, record!.h1]) {
          const normalized = normalize(value);
          expect(normalized).toContain(normalize(product.name));
          expect(normalized).toContain(normalize(marketplace.name));
        }

        expect(normalize(record!.title)).toContain("compliance");
      }
    }
  });

  it("rejects placeholder or generic SEO copy on core pages", () => {
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

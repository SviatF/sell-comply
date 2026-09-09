import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { indexableRoutes } from "../lib/indexable-routes";
import { marketplaces, markets, products } from "../lib/seo-data";
import {
  ORGANIZATION_ID,
  SITE_ORIGIN,
  WEBSITE_ID,
  absoluteSeoUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFaqPageSchema,
  buildWebPageSchema,
  getSiteIdentitySchema,
} from "../lib/seo-structured-data";

type PageSchemaRecord = {
  path: string;
  schema: Record<string, any>;
};

const indexablePathSet = new Set(indexableRoutes.map((route) => route.path));

const coreSchemas: PageSchemaRecord[] = [
  {
    path: "/",
    schema: buildWebPageSchema({
      path: "/",
      name: "SellComply — Product Compliance Checker for Global Sellers",
      description:
        "Check product regulations, marketplace requirements and compliance risks before you sell in a new country. Sell globally with more confidence.",
    }),
  },
  {
    path: "/products",
    schema: buildCollectionPageSchema({
      path: "/products",
      name: "Product Compliance Checks",
      description:
        "Browse product-specific compliance checks for electronics, toys, cosmetics, candles, jewelry and more.",
      items: products.map((product) => ({
        name: product.name,
        href: `/sell/${product.slug}/germany`,
      })),
    }),
  },
  {
    path: "/markets",
    schema: buildCollectionPageSchema({
      path: "/markets",
      name: "Global Product Compliance Markets",
      description:
        "Explore product compliance checks for Germany, France, the United States, United Kingdom, Canada and Australia.",
      items: markets.map((market) => ({
        name: market.name,
        href: `/sell/wireless-headphones/${market.slug}`,
      })),
    }),
  },
  {
    path: "/marketplaces",
    schema: buildCollectionPageSchema({
      path: "/marketplaces",
      name: "Marketplace Product Compliance",
      description:
        "Explore product compliance and listing checks for Amazon, Etsy, eBay, TikTok Shop and Shopify sellers.",
      items: marketplaces.map((marketplace) => ({
        name: marketplace.name,
        href: `/marketplaces/${marketplace.slug}/wireless-headphones`,
      })),
    }),
  },
  {
    path: "/about",
    schema: buildWebPageSchema({
      path: "/about",
      name: "About SellComply",
      description:
        "SellComply is a product-compliance intelligence and workflow platform for sellers, importers and ecommerce teams.",
      type: "AboutPage",
      about: {
        "@type": "SoftwareApplication",
        name: "SellComply",
      },
    }),
  },
  ...[
    ["/methodology", "How SellComply works.", "SellComply compliance methodology.", "WebPage"],
    ["/sources-policy", "Sources before assertions.", "SellComply sources policy.", "WebPage"],
    ["/editorial-policy", "Accuracy over certainty theater.", "SellComply editorial policy.", "WebPage"],
    ["/corrections", "Errors should be correctable.", "SellComply corrections policy.", "WebPage"],
    ["/contact", "Send the issue with context.", "Contact SellComply.", "ContactPage"],
    ["/privacy", "Privacy for a guest-first product.", "SellComply privacy policy.", "WebPage"],
    ["/terms", "Use SellComply as a screening tool.", "SellComply terms of use.", "WebPage"],
    ["/disclaimer", "Screening is not approval.", "SellComply compliance disclaimer.", "WebPage"],
  ].map(([path, name, description, type]) => ({
    path,
    schema: buildWebPageSchema({
      path,
      name,
      description,
      type: type as "WebPage" | "ContactPage",
    }),
  })),
];

const dynamicSchemas: PageSchemaRecord[] = [];

for (const product of products) {
  for (const market of markets) {
    const path = `/sell/${product.slug}/${market.slug}`;
    dynamicSchemas.push({
      path,
      schema: buildWebPageSchema({
        path,
        name: `Can I sell ${product.name} in ${market.name}?`,
        description: `${product.intro} For ${market.name}, SellComply combines product-category review areas with market-specific checks so you can identify what needs verification before listing or importing.`,
        about: {
          "@type": "Thing",
          name: product.name,
          description: product.intro,
        },
      }),
    });
  }
}

for (const marketplace of marketplaces) {
  for (const product of products) {
    const path = `/marketplaces/${marketplace.slug}/${product.slug}`;
    dynamicSchemas.push({
      path,
      schema: buildWebPageSchema({
        path,
        name: `${product.name} compliance for ${marketplace.name}`,
        description: `${marketplace.overview} This page focuses on ${product.name} and the compliance questions a seller should review before publishing or scaling a listing.`,
        about: {
          "@type": "Thing",
          name: product.name,
          description: product.intro,
        },
      }),
    });
  }
}

const records = [...coreSchemas, ...dynamicSchemas];

describe("SEO Batch 1 — structured data quality gate", () => {
  it("publishes a stable Organization and WebSite identity graph", () => {
    const schema = getSiteIdentitySchema();
    const graph = schema["@graph"];

    expect(graph).toHaveLength(2);

    const organization = graph.find((item) => item["@type"] === "Organization");
    const website = graph.find((item) => item["@type"] === "WebSite");

    expect(organization).toMatchObject({
      "@id": ORGANIZATION_ID,
      name: "SellComply",
      url: SITE_ORIGIN,
    });
    expect(website).toMatchObject({
      "@id": WEBSITE_ID,
      name: "SellComply",
      url: SITE_ORIGIN,
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: "en",
    });
    expect(JSON.stringify(schema)).not.toContain("SearchAction");
  });

  it("audits the exact current 101-URL indexable inventory", () => {
    expect(records.map((record) => record.path).sort()).toEqual(
      indexableRoutes.map((route) => route.path).sort()
    );
    expect(records).toHaveLength(101);
  });

  it("gives every indexable page one canonical WebPage-family identity", () => {
    const ids = new Set<string>();

    for (const { path, schema } of records) {
      const url = absoluteSeoUrl(path);

      expect(schema["@context"], path).toBe("https://schema.org");
      expect(schema["@id"], path).toBe(`${url}#webpage`);
      expect(schema.url, path).toBe(url);
      expect(schema.isPartOf, path).toEqual({ "@id": WEBSITE_ID });
      expect(schema.publisher, path).toEqual({ "@id": ORGANIZATION_ID });
      expect(schema.inLanguage, path).toBe("en");
      expect(String(schema.name).trim().length, path).toBeGreaterThan(3);
      expect(String(schema.description).trim().length, path).toBeGreaterThan(10);

      if (path === "/") {
        expect(schema.breadcrumb).toBeUndefined();
      } else {
        expect(schema.breadcrumb, path).toEqual({ "@id": `${url}#breadcrumb` });
      }

      expect(ids.has(schema["@id"]), `${path}: duplicate page @id`).toBe(false);
      ids.add(schema["@id"]);
    }
  });

  it("uses conservative schema types that match the visible page purpose", () => {
    expect(records.find((item) => item.path === "/")?.schema["@type"]).toBe("WebPage");
    expect(records.find((item) => item.path === "/about")?.schema["@type"]).toBe("AboutPage");
    expect(records.find((item) => item.path === "/contact")?.schema["@type"]).toBe("ContactPage");

    for (const path of ["/products", "/markets", "/marketplaces"]) {
      expect(records.find((item) => item.path === path)?.schema["@type"], path).toBe(
        "CollectionPage"
      );
    }

    for (const record of dynamicSchemas) {
      expect(record.schema["@type"], record.path).toBe("WebPage");
      expect(record.schema.about?.["@type"], record.path).toBe("Thing");
    }
  });

  it("keeps hub ItemList entries aligned with visible, indexable links", () => {
    const expectedCounts = new Map([
      ["/products", products.length],
      ["/markets", markets.length],
      ["/marketplaces", marketplaces.length],
    ]);

    for (const [path, expectedCount] of expectedCounts) {
      const schema = records.find((item) => item.path === path)?.schema;
      const items = schema?.mainEntity?.itemListElement;

      expect(schema?.mainEntity?.["@type"], path).toBe("ItemList");
      expect(items, path).toHaveLength(expectedCount);

      for (const [index, item] of items.entries()) {
        const url = new URL(item.url);
        expect(item["@type"], path).toBe("ListItem");
        expect(item.position, path).toBe(index + 1);
        expect(url.origin, path).toBe(SITE_ORIGIN);
        expect(indexablePathSet.has(url.pathname), `${path}: ${url.pathname}`).toBe(true);
      }
    }
  });

  it("builds FAQPage nodes only from visible question-answer content", () => {
    const path = "/sell/wireless-headphones/germany";
    const faqs = [
      { q: "Can I sell wireless headphones in Germany?", a: "Potentially, after checking the exact product requirements." },
      { q: "Is SellComply legal advice?", a: "No. Verify high-impact decisions against current official sources." },
    ];
    const schema = buildFaqPageSchema(path, faqs);

    expect(schema["@type"]).toBe("FAQPage");
    expect(schema["@id"]).toBe(`${absoluteSeoUrl(path)}#faq`);
    expect(schema.url).toBe(absoluteSeoUrl(path));
    expect(schema.isPartOf).toEqual({ "@id": `${absoluteSeoUrl(path)}#webpage` });
    expect(schema.mainEntity).toHaveLength(faqs.length);

    for (const [index, entity] of schema.mainEntity.entries()) {
      expect(entity["@type"]).toBe("Question");
      expect(entity.name).toBe(faqs[index].q);
      expect(entity.acceptedAnswer).toEqual({
        "@type": "Answer",
        text: faqs[index].a,
      });
    }
  });

  it("gives BreadcrumbList and WebPage the same route identity", () => {
    const path = "/sell/wireless-headphones/germany";
    const items = [
      { name: "Home", href: "/" },
      { name: "Products", href: "/products" },
      { name: "Wireless Headphones in Germany", href: path },
    ];
    const schema = buildBreadcrumbSchema(items);

    expect(schema?.["@type"]).toBe("BreadcrumbList");
    expect(schema?.["@id"]).toBe(`${absoluteSeoUrl(path)}#breadcrumb`);
    expect(schema?.itemListElement.at(-1)?.item).toBe(absoluteSeoUrl(path));
  });

  it("does not fabricate commerce or review rich-result signals", () => {
    const serialized = JSON.stringify([
      getSiteIdentitySchema(),
      ...records.map((record) => record.schema),
    ]);

    for (const forbidden of [
      '"@type":"Offer"',
      '"@type":"Review"',
      '"@type":"AggregateRating"',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }

    for (const record of dynamicSchemas) {
      expect(JSON.stringify(record.schema), record.path).not.toContain(
        '"@type":"Product"'
      );
    }
  });

  it("wires the shared structured-data layer into every production SEO template", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const home = readFileSync("app/page.tsx", "utf8");
    const dynamic = readFileSync("app/components/ComplianceSeoPage.tsx", "utf8");
    const trust = readFileSync("app/components/TrustPolicyPage.tsx", "utf8");
    const breadcrumbs = readFileSync("app/components/SeoBreadcrumbs.tsx", "utf8");
    const about = readFileSync("app/about/page.tsx", "utf8");

    expect(layout).toContain("getSiteIdentitySchema()");
    expect(layout).toContain("<SeoJsonLd data={getSiteIdentitySchema()} />");

    expect(home).toContain("const homeSchema = buildWebPageSchema({");
    expect(home).toContain('<SeoJsonLd data={homeSchema} />');

    expect(dynamic).toContain("buildWebPageSchema({");
    expect(dynamic).toContain("buildFaqPageSchema(pagePath, faqs)");
    expect(dynamic).toContain('"@type": "Thing"');
    expect(dynamic).not.toContain('"@type": "Product"');
    expect(dynamic).toContain("<SeoJsonLd data={schema} />");
    expect(dynamic).toContain("<SeoJsonLd data={faqSchema} />");

    expect(trust).toContain('type: path === "/contact" ? "ContactPage" : "WebPage"');
    expect(trust).toContain("<SeoJsonLd data={schema} />");

    expect(breadcrumbs).toContain("buildBreadcrumbSchema(items)");
    expect(breadcrumbs).toContain("<SeoJsonLd data={schema} />");

    expect(about).toContain('type: "AboutPage"');
    expect(about).toContain("<SeoJsonLd data={schema} />");

    for (const path of [
      "app/products/page.tsx",
      "app/markets/page.tsx",
      "app/marketplaces/page.tsx",
    ]) {
      const source = readFileSync(path, "utf8");
      expect(source, path).toContain("buildCollectionPageSchema({");
      expect(source, path).toContain("<SeoJsonLd data={schema} />");
    }
  });

  it("keeps trust-policy routes bound to their own page schema path", () => {
    for (const [file, route] of [
      ["app/methodology/page.tsx", "/methodology"],
      ["app/sources-policy/page.tsx", "/sources-policy"],
      ["app/editorial-policy/page.tsx", "/editorial-policy"],
      ["app/corrections/page.tsx", "/corrections"],
      ["app/contact/page.tsx", "/contact"],
      ["app/privacy/page.tsx", "/privacy"],
      ["app/terms/page.tsx", "/terms"],
      ["app/disclaimer/page.tsx", "/disclaimer"],
    ] as const) {
      expect(readFileSync(file, "utf8"), file).toContain(`path="${route}"`);
    }
  });
});

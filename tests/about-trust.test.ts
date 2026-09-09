import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const about = readFileSync("app/about/page.tsx", "utf8");
const chrome = readFileSync("app/components/SeoChrome.tsx", "utf8");
const indexableManifest = readFileSync("lib/indexable-routes.ts", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const home = readFileSync("app/page.tsx", "utf8");
const internalLinks = readFileSync("lib/seo-internal-links.ts", "utf8");

describe("About trust page", () => {
  it("ships indexable metadata and canonical URL", () => {
    expect(about).toContain('title: "About SellComply"');
    expect(about).toContain('alternates: { canonical: "/about" }');
    expect(about).toContain('type: "AboutPage"');
    expect(about).toContain("buildWebPageSchema({");
  });

  it("clearly defines product scope and limitations", () => {
    expect(about).toContain("Product compliance should be");
    expect(about).toContain("SellComply is an informational screening and workflow tool");
    expect(about).toContain("SELLCOMPLY DOES");
    expect(about).toContain("SELLCOMPLY DOES NOT");
    expect(about).toContain("Provide legal advice or legal representation");
    expect(about).toContain("Issue certifications, approvals or conformity assessments");
  });

  it("makes uncertainty and official-source verification part of the trust model", () => {
    expect(about).toContain("Official sources over unsupported claims");
    expect(about).toContain("Uncertainty should stay visible");
    expect(about).toContain("Trust should be inspectable");
  });

  it("is discoverable from global chrome, homepage and sitemap", () => {
    expect(chrome).toContain("SEO_HEADER_LINKS");
    expect(home).toContain("SEO_FOOTER_PRIMARY_LINKS");
    expect(internalLinks).toContain('{ href: "/about", label: "About" }');
    expect(indexableManifest).toContain('path: "/about"');
    expect(sitemap).toContain("indexableRoutes");
  });

  it("links the completed trust architecture", () => {
    expect(about).toContain('href="/methodology"');
    expect(about).toContain('href="/sources-policy"');
    expect(about).toContain('href="/editorial-policy"');
    expect(about).toContain('href="/corrections"');
    expect(about).not.toContain("— planned");
  });
});

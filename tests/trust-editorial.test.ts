import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const trustRoutes = [
  ["methodology", "How SellComply Works — Methodology"],
  ["sources-policy", "Sources Policy"],
  ["editorial-policy", "Editorial and Compliance Content Policy"],
  ["corrections", "Corrections Policy"],
  ["contact", "Contact SellComply"],
  ["privacy", "Privacy Policy"],
  ["terms", "Terms of Use"],
  ["disclaimer", "Compliance Disclaimer"],
] as const;

describe("trust and editorial architecture", () => {
  it("publishes canonical metadata for every trust route", () => {
    for (const [route, title] of trustRoutes) {
      const source = readFileSync(`app/${route}/page.tsx`, "utf8");
      expect(source, route).toContain(`title: "${title}"`);
      expect(source, route).toContain(`canonical: "/${route}"`);
    }
  });

  it("makes the trust center discoverable globally and in the sitemap manifest", () => {
    const chrome = readFileSync("app/components/SeoChrome.tsx", "utf8");
    const indexableManifest = readFileSync("lib/indexable-routes.ts", "utf8");
    const sitemap = readFileSync("app/sitemap.ts", "utf8");

    for (const [route] of trustRoutes) {
      expect(indexableManifest, route).toContain(`/${route}`);
    }

    expect(sitemap).toContain("indexableRoutes");
    expect(chrome).toContain('href="/methodology"');
    expect(chrome).toContain('href="/sources-policy"');
    expect(chrome).toContain('href="/editorial-policy"');
    expect(chrome).toContain('href="/corrections"');
    expect(chrome).toContain('href="/contact"');
    expect(chrome).toContain('href="/privacy"');
    expect(chrome).toContain('href="/terms"');
    expect(chrome).toContain('href="/disclaimer"');
  });

  it("documents the real checker methodology rather than a generic AI claim", () => {
    const methodology = readFileSync("app/methodology/page.tsx", "utf8");
    const engine = readFileSync("lib/compliance-engine.ts", "utf8");

    expect(methodology).toContain("Product facts → classification → rule matching → risk signal");
    expect(methodology).toContain("The risk score is a transparent screening-complexity signal");
    expect(engine).toContain('lastVerified?: string');
    expect(engine).toContain("lastVerified: rule.lastVerified");
  });

  it("keeps source and editorial boundaries explicit", () => {
    const sources = readFileSync("app/sources-policy/page.tsx", "utf8");
    const editorial = readFileSync("app/editorial-policy/page.tsx", "utf8");
    const disclaimer = readFileSync("app/disclaimer/page.tsx", "utf8");

    expect(sources).toContain("Primary and official sources are preferred");
    expect(editorial).toContain("No fabricated certainty");
    expect(editorial).toContain("Marketplace eligibility is a separate layer");
    expect(disclaimer).toContain("Screening is not");
    expect(disclaimer).toContain("not a probability that a product is illegal");
  });

  it("provides a working contact persistence path for corrections and privacy requests", () => {
    const page = readFileSync("app/contact/page.tsx", "utf8");
    const form = readFileSync("app/components/ContactForm.tsx", "utf8");
    const api = readFileSync("app/api/contact/route.ts", "utf8");
    const schema = readFileSync("lib/db-schema.ts", "utf8");

    expect(page).toContain("Contact SellComply");
    expect(form).toContain("Correction / regulatory issue");
    expect(form).toContain('fetch("/api/contact"');
    expect(api).toContain("INVALID_CONTACT_PAYLOAD");
    expect(api).toContain("CONTACT_STORAGE_UNAVAILABLE");
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS contact_messages");
    expect(schema).toContain("schema_version', '14");
  });

  it("shows review ownership and last-reviewed/source-verification metadata", () => {
    const disclosure = readFileSync("app/components/ReviewDisclosure.tsx", "utf8");
    const check = readFileSync("app/check/page.tsx", "utf8");
    const seoPage = readFileSync("app/components/ComplianceSeoPage.tsx", "utf8");
    const policy = readFileSync("app/components/TrustPolicyPage.tsx", "utf8");

    expect(disclosure).toContain("SellComply regulatory review workflow");
    expect(disclosure).toContain("LAST REVIEWED / VERIFIED");
    expect(check).toContain("latestMatchedVerification");
    expect(check).toContain("Source verified");
    expect(seoPage).toContain("ReviewDisclosure");
    expect(policy).toContain("Last reviewed");
  });

  it("marks the trust editorial roadmap complete", () => {
    const roadmap = readFileSync("docs/TRAFFIC_ROADMAP.md", "utf8");
    const trustSection = roadmap
      .split("## SEO foundation")[0]
      .split("### 4. Trust / editorial architecture — DONE")[1];
    expect(roadmap).toContain("### 4. Trust / editorial architecture — DONE");
    expect(trustSection).not.toMatch(/- \[ \]/);
  });
});

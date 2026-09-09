import type { Metadata } from "next";
import Link from "next/link";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";
import SeoBreadcrumbs from "@/app/components/SeoBreadcrumbs";
import { getCoreBreadcrumbs } from "@/lib/seo-breadcrumbs";
import SeoJsonLd from "@/app/components/SeoJsonLd";
import { buildCollectionPageSchema } from "@/lib/seo-structured-data";
import { getMarketplaceHubLinks } from "@/lib/seo-internal-links";

export const metadata: Metadata = {
  title: "Marketplace Product Compliance",
  description: "Explore product compliance and listing checks for Amazon, Etsy, eBay, TikTok Shop and Shopify sellers.",
  alternates: { canonical: "/marketplaces" },
};

const hubLinks = getMarketplaceHubLinks();

const schema = buildCollectionPageSchema({
  path: "/marketplaces",
  name: "Marketplace Product Compliance",
  description: "Explore product compliance and listing checks for Amazon, Etsy, eBay, TikTok Shop and Shopify sellers.",
  items: hubLinks.map((link) => ({ name: link.label, href: link.href })),
});

export default function MarketplacesPage() {
  return (
    <div className="seo-page">
      <SeoHeader />
      <main className="seo-main">
        <SeoBreadcrumbs items={getCoreBreadcrumbs("/marketplaces")} />
        <section className="hub-hero">
          <span className="seo-kicker"><i /> Marketplace compliance</span>
          <h1>Platform rules are only <em>one layer.</em></h1>
          <p>Compare marketplace listing requirements with the product rules that apply in the destination market. SellComply is built to connect both layers.</p>
        </section>
        <div className="hub-grid">
          {hubLinks.map((link) => (
            <Link className="hub-card" key={link.href} href={link.href}>
              <span className="hub-icon">▦</span>
              <h2>{link.label}</h2>
              <p>{link.description}</p>
            </Link>
          ))}
        </div>
      </main>
      <SeoFooter />
      <SeoJsonLd data={schema} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { marketplaces } from "@/lib/seo-data";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";

export const metadata: Metadata = {
  title: "Marketplace Product Compliance",
  description: "Explore product compliance and listing checks for Amazon, Etsy, eBay, TikTok Shop and Shopify sellers.",
  alternates: { canonical: "/marketplaces" },
};

export default function MarketplacesPage() {
  return (
    <div className="seo-page">
      <SeoHeader />
      <main className="seo-main">
        <section className="hub-hero">
          <span className="seo-kicker"><i /> Marketplace compliance</span>
          <h1>Platform rules are only <em>one layer.</em></h1>
          <p>Compare marketplace listing requirements with the product rules that apply in the destination market. SellComply is built to connect both layers.</p>
        </section>
        <div className="hub-grid">
          {marketplaces.map((marketplace) => (
            <Link className="hub-card" key={marketplace.slug} href={`/marketplaces/${marketplace.slug}/wireless-headphones`}>
              <span className="hub-icon">▦</span>
              <h2>{marketplace.name}</h2>
              <p>{marketplace.reviewAreas.slice(0, 2).join(" · ")}</p>
            </Link>
          ))}
        </div>
      </main>
      <SeoFooter />
    </div>
  );
}

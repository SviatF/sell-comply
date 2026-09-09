import type { Metadata } from "next";
import Link from "next/link";
import { markets } from "@/lib/seo-data";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";
import SeoBreadcrumbs from "@/app/components/SeoBreadcrumbs";
import { getCoreBreadcrumbs } from "@/lib/seo-breadcrumbs";

export const metadata: Metadata = {
  title: "Global Product Compliance Markets",
  description: "Explore product compliance checks for Germany, France, the United States, United Kingdom, Canada and Australia.",
  alternates: { canonical: "/markets" },
};

export default function MarketsPage() {
  return (
    <div className="seo-page">
      <SeoHeader />
      <main className="seo-main">
        <SeoBreadcrumbs items={getCoreBreadcrumbs("/markets")} />
        <section className="hub-hero">
          <span className="seo-kicker"><i /> Global markets</span>
          <h1>Where do you want to <em>sell?</em></h1>
          <p>Start with a target market and explore how the compliance review changes by product category, language, regulator and supply-chain role.</p>
        </section>
        <div className="hub-grid">
          {markets.map((market) => (
            <Link className="hub-card" key={market.slug} href={`/sell/wireless-headphones/${market.slug}`}>
              <span className="hub-icon">{market.flag}</span>
              <h2>{market.name}</h2>
              <p>{market.region} · {market.language}</p>
            </Link>
          ))}
        </div>
      </main>
      <SeoFooter />
    </div>
  );
}

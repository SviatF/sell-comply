import type { Metadata } from "next";
import Link from "next/link";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";
import SeoBreadcrumbs from "@/app/components/SeoBreadcrumbs";
import { getCoreBreadcrumbs } from "@/lib/seo-breadcrumbs";
import SeoJsonLd from "@/app/components/SeoJsonLd";
import { buildCollectionPageSchema } from "@/lib/seo-structured-data";
import { getMarketHubLinks } from "@/lib/seo-internal-links";

export const metadata: Metadata = {
  title: "Global Product Compliance Markets",
  description: "Explore product compliance checks for Germany, France, the United States, United Kingdom, Canada and Australia.",
  alternates: { canonical: "/markets" },
};

const hubLinks = getMarketHubLinks();

const schema = buildCollectionPageSchema({
  path: "/markets",
  name: "Global Product Compliance Markets",
  description: "Explore product compliance checks for Germany, France, the United States, United Kingdom, Canada and Australia.",
  items: hubLinks.map((link) => ({ name: link.label, href: link.href })),
});

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
          {hubLinks.map((link) => (
            <Link className="hub-card" key={link.href} href={link.href}>
              <span className="hub-icon">{link.icon}</span>
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

import type { Metadata } from "next";
import Link from "next/link";
import { products } from "@/lib/seo-data";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";

export const metadata: Metadata = {
  title: "Product Compliance Checks",
  description: "Browse product-specific compliance checks for electronics, toys, cosmetics, candles, jewelry and more.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <div className="seo-page">
      <SeoHeader />
      <main className="seo-main">
        <section className="hub-hero">
          <span className="seo-kicker"><i /> Product library</span>
          <h1>Start with the <em>product.</em></h1>
          <p>Choose a product category, then compare the compliance review across markets and marketplaces. Each page is designed to move from a broad SEO question into a product-specific SellComply check.</p>
        </section>
        <div className="hub-grid">
          {products.map((product) => (
            <Link className="hub-card" key={product.slug} href={`/sell/${product.slug}/germany`}>
              <span className="hub-icon">◌</span>
              <h2>{product.name}</h2>
              <p>{product.category} · {product.reviewAreas.slice(0, 2).join(" · ")}</p>
            </Link>
          ))}
        </div>
      </main>
      <SeoFooter />
    </div>
  );
}

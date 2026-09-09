import Link from "next/link";
import { MarketSeo, MarketplaceSeo, ProductSeo, marketplaces, markets, products } from "@/lib/seo-data";
import { SeoFooter, SeoHeader } from "./SeoChrome";
import ReviewDisclosure from "./ReviewDisclosure";
import SeoBreadcrumbs from "./SeoBreadcrumbs";
import { getMarketplaceProductBreadcrumbs, getProductMarketBreadcrumbs } from "@/lib/seo-breadcrumbs";
import SeoJsonLd from "./SeoJsonLd";
import { buildFaqPageSchema, buildWebPageSchema } from "@/lib/seo-structured-data";

type Props = {
  product: ProductSeo;
  market?: MarketSeo;
  marketplace?: MarketplaceSeo;
};

export default function ComplianceSeoPage({ product, market, marketplace }: Props) {
  const title = market
    ? `Can I sell ${product.name} in ${market.name}?`
    : `${product.name} compliance for ${marketplace?.name}`;

  const pagePath = market
    ? `/sell/${product.slug}/${market.slug}`
    : marketplace
      ? `/marketplaces/${marketplace.slug}/${product.slug}`
      : "/";

  const breadcrumbs = market
    ? getProductMarketBreadcrumbs(product, market)
    : marketplace
      ? getMarketplaceProductBreadcrumbs(product, marketplace)
      : [];

  const lead = market
    ? `${product.intro} For ${market.name}, SellComply combines product-category review areas with market-specific checks so you can identify what needs verification before listing or importing.`
    : `${marketplace?.overview} This page focuses on ${product.name} and the compliance questions a seller should review before publishing or scaling a listing.`;

  const reviewAreas = market
    ? [...product.reviewAreas, ...market.reviewAreas].slice(0, 7)
    : [...product.reviewAreas, ...(marketplace?.reviewAreas ?? [])].slice(0, 7);

  const relatedMarkets = markets.slice(0, 6);
  const relatedProducts = products.filter((item) => item.slug !== product.slug).slice(0, 6);

  const faqs = market
    ? [
        {
          q: `Can I sell ${product.name} in ${market.name}?`,
          a: `Potentially, but the answer depends on the exact product specification, your role in the supply chain and the rules that apply to this product category. SellComply is designed to turn those variables into a structured review checklist.`,
        },
        {
          q: `What should I check first for ${product.name} in ${market.name}?`,
          a: `Start with product classification, intended use, technical characteristics, manufacturer or importer details, existing test evidence and the labels or instructions supplied with the product.`,
        },
        {
          q: `Do I need a specific certification?`,
          a: `Not every product uses the same certification route. The applicable requirements depend on the product category and characteristics, so a category-specific review is necessary before treating any mark or certificate as mandatory.`,
        },
        {
          q: `Is SellComply legal advice?`,
          a: `No. SellComply is a product-compliance intelligence and workflow tool. High-risk, ambiguous or regulated cases should be verified against current official rules or with a qualified professional.`,
        },
      ]
    : [
        {
          q: `Can I sell ${product.name} on ${marketplace?.name}?`,
          a: `That depends on both the platform's category policies and the product rules that apply in the destination market. A product may be allowed by a marketplace but still require market-specific compliance work.`,
        },
        {
          q: `What documents might ${marketplace?.name} ask for?`,
          a: `Requests vary by category and market. Sellers should be ready to substantiate product identity, manufacturer or importer details, safety or conformity evidence, labels and any category-specific documentation.`,
        },
        {
          q: `Does marketplace approval replace legal compliance?`,
          a: `No. Platform eligibility and legal market access are separate layers. Sellers remain responsible for the product rules that apply where the item is offered or supplied.`,
        },
        {
          q: `What should I prepare before listing?`,
          a: `Have the product specification, supplier details, test reports or certificates you already possess, packaging artwork, warnings, instructions and target-market information ready for review.`,
        },
      ];

  const schema = buildWebPageSchema({
    path: pagePath,
    name: title,
    description: lead,
    about: {
      "@type": "Thing",
      name: product.name,
      description: product.intro,
    },
  });

  const faqSchema = buildFaqPageSchema(pagePath, faqs);

  return (
    <div className="seo-page">
      <SeoHeader />
      <main className="seo-main">
        <SeoBreadcrumbs items={breadcrumbs} />

        <section className="seo-hero">
          <div>
            <span className="seo-kicker"><i /> {product.category} · {market?.name ?? marketplace?.name}</span>
            <h1>{market ? <>Can I sell <em>{product.name}</em> in {market.name}?</> : <><em>{product.name}</em> compliance for {marketplace?.name}</>}</h1>
            <p className="seo-lead">{lead}</p>
            <p className="seo-disclaimer">Informational compliance guidance only. Requirements change and depend on the exact product, business role and market. Verify critical decisions against current official sources.</p>
          </div>
          <aside className="seo-check-card">
            <h2>Check your exact product</h2>
            <p>Generic pages are only the starting point. Paste your product into SellComply to build a product-specific compliance review.</p>
            <Link className="button button-accent" href="/#checker">Check product for free →</Link>
          </aside>
        </section>

        <ReviewDisclosure
          lastReviewed="9 September 2026"
          basis="Editorial overview + structured compliance knowledge base"
        />

        <section className="seo-grid">
          <article className="seo-card">
            <h2>What SellComply should review</h2>
            <ul className="check-list">{reviewAreas.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="seo-card">
            <h2>Questions to answer before selling</h2>
            <ul className="check-list">{product.questions.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          {market && (
            <>
              <article className="seo-card">
                <h2>{market.name} market notes</h2>
                <ol className="number-list">{market.marketNotes.map((item) => <li key={item}>{item}</li>)}</ol>
              </article>
              <article className="seo-card">
                <h2>Typical workflow</h2>
                <ol className="number-list">
                  <li>Classify the exact product and intended use.</li>
                  <li>Map applicable product and market requirements.</li>
                  <li>Compare requirements with existing tests, labels and documents.</li>
                  <li>Close gaps before listing, importing or scaling sales.</li>
                </ol>
              </article>
            </>
          )}
          {marketplace && (
            <>
              <article className="seo-card">
                <h2>{marketplace.name} listing layer</h2>
                <ul className="check-list">{marketplace.reviewAreas.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="seo-card">
                <h2>Marketplace + law</h2>
                <p>A marketplace policy check is not a substitute for product-law review. Treat the platform's listing requirements and the destination market's regulatory requirements as two separate layers that both need to pass.</p>
              </article>
            </>
          )}
        </section>

        {market?.officialSources?.length ? (
          <section className="seo-section">
            <div className="seo-section-head"><h2>Official starting points</h2><p>Use primary regulator sources to confirm high-impact decisions and current requirements.</p></div>
            <div className="source-list">{market.officialSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
          </section>
        ) : null}

        <section className="seo-section">
          <div className="seo-section-head"><h2>{market ? "Check other markets" : "Popular target markets"}</h2><p>Reuse the same product profile and compare how the compliance review changes by market.</p></div>
          <div className="link-grid">
            {relatedMarkets.map((item) => <Link className="seo-link-card" key={item.slug} href={`/sell/${product.slug}/${item.slug}`}><strong>{item.flag} {item.name}</strong><span>{product.name} compliance check</span></Link>)}
          </div>
        </section>

        <section className="seo-section">
          <div className="seo-section-head"><h2>Related product checks</h2><p>Explore adjacent categories and build a wider product-compliance library.</p></div>
          <div className="link-grid">
            {relatedProducts.map((item) => {
              const href = market ? `/sell/${item.slug}/${market.slug}` : `/marketplaces/${marketplace?.slug}/${item.slug}`;
              return <Link className="seo-link-card" key={item.slug} href={href}><strong>{item.name}</strong><span>{item.category}</span></Link>;
            })}
          </div>
        </section>

        <section className="seo-section">
          <div className="seo-section-head"><h2>Frequently asked questions</h2></div>
          <div className="faq-list">{faqs.map((item) => <article className="faq-item" key={item.q}><h3>{item.q}</h3><p>{item.a}</p></article>)}</div>
        </section>

        <section className="seo-section">
          <div className="seo-section-head"><h2>Compare marketplace requirements</h2><p>Product compliance and platform eligibility should be reviewed together.</p></div>
          <div className="link-grid">{marketplaces.map((item) => <Link className="seo-link-card" key={item.slug} href={`/marketplaces/${item.slug}/${product.slug}`}><strong>{item.name}</strong><span>{product.name} marketplace compliance</span></Link>)}</div>
        </section>
      </main>
      <SeoFooter />
      <SeoJsonLd data={schema} />
      <SeoJsonLd data={faqSchema} />
    </div>
  );
}

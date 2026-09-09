import type { Metadata } from "next";
import Link from "next/link";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";

export const metadata: Metadata = {
  title: "About SellComply",
  description:
    "Learn what SellComply does, who it is for, how product-compliance screening works, and the limits of the platform.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    title: "Product-specific over generic",
    text: "Compliance depends on the exact product, its technical characteristics, intended use, target market and seller role. SellComply is built around those variables instead of static generic checklists.",
  },
  {
    title: "Official sources over unsupported claims",
    text: "Important review areas are tied back to regulator and other primary-source material wherever coverage is available, so users can verify critical decisions at the source.",
  },
  {
    title: "Uncertainty should stay visible",
    text: "When applicability depends on missing facts, SellComply surfaces open questions and evidence gaps instead of presenting a false binary pass or fail.",
  },
  {
    title: "Compliance is an ongoing process",
    text: "Rules, effective dates and official guidance can change. Saved checks and monitoring are designed to help users revisit product-market decisions over time.",
  },
];

const audiences = [
  "Marketplace sellers expanding into new countries",
  "DTC and ecommerce teams managing multiple product categories",
  "Importers, distributors and private-label operators",
  "Product, operations and compliance teams that need a structured first-pass review",
];

const does = [
  "Classify product facts and important technical features",
  "Map structured product and market rule packs",
  "Show required, likely and verify review areas",
  "Surface documents, labels, evidence gaps and risk drivers",
  "Attach official sources to supported regulatory checks",
  "Compare the same product across supported markets",
  "Save checks, create shareable reports and monitor reviewed source changes",
];

const doesNot = [
  "Provide legal advice or legal representation",
  "Issue certifications, approvals or conformity assessments",
  "Guarantee that a product is lawful to sell in every circumstance",
  "Replace laboratories, notified bodies, regulators or qualified legal/compliance professionals",
  "Treat marketplace approval as a substitute for product-law compliance",
];

export default function AboutPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About SellComply",
    url: "https://sellcomply.com/about",
    description:
      "SellComply is a product-compliance intelligence and workflow platform for sellers, importers and ecommerce teams.",
    isPartOf: {
      "@type": "WebSite",
      name: "SellComply",
      url: "https://sellcomply.com",
    },
    about: {
      "@type": "SoftwareApplication",
      name: "SellComply",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
    },
  };

  return (
    <div className="seo-page trust-page">
      <SeoHeader />
      <main className="seo-main trust-main">
        <div className="breadcrumbs">
          <Link href="/">Home</Link><span>/</span><span>About</span>
        </div>

        <section className="trust-hero">
          <div>
            <span className="seo-kicker"><i /> ABOUT SELLCOMPLY</span>
            <h1>Product compliance should be <em>understandable before it becomes expensive.</em></h1>
            <p className="seo-lead">
              SellComply is a product-compliance intelligence and workflow platform for sellers,
              importers and ecommerce teams. It turns a product, target market and optional
              marketplace into a structured screening of the regulatory areas that may need review.
            </p>
            <p className="seo-disclaimer">
              SellComply is an informational screening and workflow tool. It is not a law firm,
              regulator, certification body or substitute for professional advice in high-risk,
              ambiguous or regulated cases.
            </p>
          </div>

          <aside className="trust-fact-card">
            <span>WHAT THE PRODUCT IS BUILT TO DO</span>
            <strong>Reduce compliance uncertainty before listing, importing or scaling.</strong>
            <div className="trust-fact-grid">
              <div><b>6</b><small>launch markets</small></div>
              <div><b>5</b><small>marketplace layers</small></div>
              <div><b>0</b><small>forced signup steps</small></div>
            </div>
            <Link className="button button-accent" href="/#checker">Check a product for free →</Link>
          </aside>
        </section>

        <section className="trust-section">
          <div className="trust-section-head">
            <span>01</span>
            <div>
              <h2>Why SellComply exists</h2>
              <p>
                Product compliance is fragmented across product rules, market requirements,
                marketplace policies, technical characteristics, labels, documents and seller roles.
                The hard part is rarely finding one regulation; it is understanding which layers
                actually matter for one exact product.
              </p>
            </div>
          </div>
          <div className="trust-story-grid">
            <article>
              <strong>The problem</strong>
              <p>
                Sellers often discover compliance requirements only after a listing is blocked,
                inventory is already moving or a marketplace asks for documents that were never
                collected upstream.
              </p>
            </article>
            <article>
              <strong>The approach</strong>
              <p>
                SellComply structures the first-pass review around product facts, target market,
                marketplace and supply-chain context, then turns those inputs into review areas,
                evidence gaps and next actions.
              </p>
            </article>
            <article>
              <strong>The objective</strong>
              <p>
                Give teams a faster way to identify what deserves attention, what remains uncertain
                and which official sources should be checked before a high-impact decision is made.
              </p>
            </article>
          </div>
        </section>

        <section className="trust-section">
          <div className="trust-section-head">
            <span>02</span>
            <div>
              <h2>Who SellComply is for</h2>
              <p>
                The platform is designed for commercial teams that need a structured compliance
                starting point before they escalate a case to specialists.
              </p>
            </div>
          </div>
          <div className="trust-list-grid">
            {audiences.map((item) => (
              <div className="trust-list-item" key={item}><i />{item}</div>
            ))}
          </div>
        </section>

        <section className="trust-section">
          <div className="trust-section-head">
            <span>03</span>
            <div>
              <h2>What SellComply does — and what it does not do</h2>
              <p>
                This distinction matters. The product is designed to improve decision quality,
                not to manufacture certainty where the underlying facts or rules remain unresolved.
              </p>
            </div>
          </div>

          <div className="trust-boundary-grid">
            <article>
              <span>SELLCOMPLY DOES</span>
              <ul>{does.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article className="muted">
              <span>SELLCOMPLY DOES NOT</span>
              <ul>{doesNot.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>
        </section>

        <section className="trust-section">
          <div className="trust-section-head">
            <span>04</span>
            <div>
              <h2>Principles behind the product</h2>
              <p>
                The trust layer is part of the product itself. These principles guide how SellComply
                presents regulatory information and uncertainty.
              </p>
            </div>
          </div>

          <div className="trust-principles-grid">
            {principles.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="trust-section trust-transparency">
          <div>
            <span className="seo-kicker"><i /> TRANSPARENCY</span>
            <h2>Trust should be inspectable.</h2>
            <p>
              SellComply is building a public trust architecture around methodology, source
              selection, editorial standards, corrections, disclaimers and reviewer metadata.
              Those pages will explain how regulatory information enters the system, how changes
              are handled and where the platform's limits sit.
            </p>
          </div>
          <div className="trust-transparency-links">
            <span>Methodology — next</span>
            <span>Sources policy — planned</span>
            <span>Corrections policy — planned</span>
            <span>Reviewer / last-reviewed metadata — planned</span>
          </div>
        </section>

        <section className="trust-cta">
          <div>
            <span className="seo-kicker"><i /> START WITH THE PRODUCT</span>
            <h2>Turn an exact product-market combination into a structured compliance review.</h2>
            <p>No account required. Marketplace selection is optional.</p>
          </div>
          <Link className="button button-accent" href="/#checker">Check a product for free →</Link>
        </section>
      </main>
      <SeoFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { buildComplianceReview } from "@/lib/compliance-engine";
import { resolveProductInput } from "@/lib/product-resolver";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";
import CheckActions from "@/app/components/CheckActions";
import TrackEvent from "@/app/components/TrackEvent";

export const metadata: Metadata = {
  title: "Product Compliance Check Results",
  description: "Review product, market and marketplace compliance areas with SellComply.",
  robots: { index: false, follow: true },
};

const statusLabel = {
  required: "REQUIRED",
  likely: "LIKELY RELEVANT",
  verify: "VERIFY",
  marketplace: "PLATFORM",
} as const;

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; country?: string; marketplace?: string }>;
}) {
  const params = await searchParams;
  const rawProduct = (params.product || "wireless headphones").slice(0, 500);
  const country = params.country || "Germany";
  const marketplace = params.marketplace || "Amazon";
  const resolved = await resolveProductInput(rawProduct);
  const result = buildComplianceReview(resolved.resolvedText, country, marketplace);
  const displayProduct = resolved.title || rawProduct;

  return (
    <div className="seo-page check-results-page">
      <TrackEvent
        eventName="checker_completed"
        productSlug={result.product.slug}
        marketSlug={result.market.slug}
        marketplaceSlug={result.marketplace?.slug}
        metadata={{ sourceType: resolved.sourceType, fetchedProductPage: resolved.fetched }}
      />
      <SeoHeader />
      <main className="check-main">
        <div className="check-breadcrumbs">
          <Link href="/">Home</Link><span>/</span><span>Compliance check</span>
        </div>

        <section className="check-result-hero">
          <div>
            <span className="seo-kicker"><i /> INITIAL PRODUCT REVIEW</span>
            <h1>Review before you <em>sell.</em></h1>
            <p className="check-query">{displayProduct}</p>
            {resolved.sourceType === "url" && (
              <div className="resolved-product-note">
                <span>{resolved.fetched ? "Product page resolved" : "URL fallback used"}</span>
                <a href={resolved.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>
                {resolved.note && <small>{resolved.note}</small>}
              </div>
            )}
            <div className="check-target-row">
              <span>{result.market.flag} {result.market.name}</span>
              {result.marketplace && <span>▦ {result.marketplace.name}</span>}
              <span>Classification confidence: {result.certainty}</span>
              {result.classification.features.slice(0, 4).map((feature) => (
                <span key={feature}>Detected: {feature}</span>
              ))}
            </div>
          </div>

          <div className="check-summary-card">
            <span className="summary-label">INITIAL STATUS</span>
            <strong>{result.summary.required ? "Requirements found" : "Needs review"}</strong>
            <p>
              {result.summary.rulesMatched
                ? `${result.summary.rulesMatched} regulatory rule pack(s) matched this product-market combination.`
                : "No product-specific rule pack matched yet, so SellComply is showing a broader verification review."}
            </p>
            <div className="check-summary-stats">
              <div><span>Required</span><b>{result.summary.required}</b></div>
              <div><span>Likely</span><b>{result.summary.likely}</b></div>
              <div><span>Verify</span><b>{result.summary.verify}</b></div>
            </div>
            <div className="summary-product">
              <span>Detected category</span>
              <b>{result.product.category}</b>
            </div>
          </div>
        </section>

        <section className="check-layout">
          <div>
            <div className="check-section-head">
              <div>
                <span>01</span>
                <h2>Compliance review areas</h2>
              </div>
              <p>These are screening results, not a legal determination. Applicability must be confirmed against the exact product and current rules.</p>
            </div>

            <div className="review-list">
              {result.reviewItems.map((item, index) => (
                <article className="review-row" key={item.title}>
                  <span className="review-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                    {item.why && <small className="review-why"><b>Why:</b> {item.why}</small>}
                    <div className="review-rule-meta">
                      {item.effectiveNote && <span>{item.effectiveNote}</span>}
                      {item.sourceUrl && item.sourceLabel && (
                        <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                          {item.sourceLabel} ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`review-status ${item.status}`}>{statusLabel[item.status]}</span>
                </article>
              ))}
            </div>
          </div>

          <aside className="check-side">
            <CheckActions
              rawProduct={displayProduct}
              productSlug={result.product.slug}
              category={result.product.category}
              marketSlug={result.market.slug}
              marketName={result.market.name}
              marketplaceSlug={result.marketplace?.slug}
              marketplaceName={result.marketplace?.name}
              certainty={result.certainty}
              reviewCount={result.reviewItems.length}
            />

            <div className="side-card">
              <span className="side-card-label">TARGET MARKET</span>
              <strong>{result.market.flag} {result.market.name}</strong>
              <p>{result.market.overview}</p>
            </div>

            <div className="side-card">
              <span className="side-card-label">LANGUAGE</span>
              <strong>{result.market.language}</strong>
              <p>Review whether product labels, warnings or instructions need market-language adaptation.</p>
            </div>
          </aside>
        </section>

        <section className="check-evidence-section">
          <div className="check-section-head">
            <div><span>02</span><h2>What you need to collect</h2></div>
            <p>These are the documents, labels and product facts SellComply expects you to verify for the matched rule set.</p>
          </div>

          <div className="check-evidence-grid">
            <article className="evidence-panel">
              <div className="evidence-panel-head">
                <span>DOCUMENTS</span>
                <strong>{result.documents.length}</strong>
              </div>
              {result.documents.length ? (
                <ul>
                  {result.documents.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p>Product-specific document requirements are still being mapped for this combination.</p>
              )}
            </article>

            <article className="evidence-panel">
              <div className="evidence-panel-head">
                <span>LABELS & INFO</span>
                <strong>{result.labels.length}</strong>
              </div>
              {result.labels.length ? (
                <ul>
                  {result.labels.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p>Verify general product identification, warnings and market-language information.</p>
              )}
            </article>

            <article className="evidence-panel evidence-gaps">
              <div className="evidence-panel-head">
                <span>NEED FROM YOU</span>
                <strong>{result.evidenceGaps.length}</strong>
              </div>
              <ul>
                {result.evidenceGaps.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
        </section>

        <section className="check-action-section">
          <div className="check-section-head">
            <div><span>03</span><h2>Recommended action plan</h2></div>
            <p>Work through the list in order and keep evidence tied to the exact SKU or product model.</p>
          </div>
          <div className="action-plan-grid">
            {result.actionPlan.map((item, index) => (
              <article className="action-plan-card" key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="check-sources-section">
          <div className="check-section-head">
            <div><span>04</span><h2>Official sources</h2></div>
            <p>Use primary regulator material to confirm important requirements before taking action.</p>
          </div>
          <div className="check-source-list">
            {result.officialSources.map((source) => (
              <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
                <div><small>OFFICIAL SOURCE</small><strong>{source.label}</strong></div>
                <span>↗</span>
              </a>
            ))}
          </div>
        </section>

        <section className="check-next">
          <div>
            <span className="seo-kicker"><i /> NEXT CHECK</span>
            <h2>Compare another market.</h2>
            <p>Keep the product the same and see how the review changes across markets.</p>
          </div>
          <div className="check-market-links">
            {["Germany", "United States", "United Kingdom", "Canada", "Australia"]
              .filter((item) => item !== result.market.name)
              .map((item) => (
                <Link
                  key={item}
                  href={`/check?product=${encodeURIComponent(rawProduct)}&country=${encodeURIComponent(item)}&marketplace=${encodeURIComponent(marketplace)}`}
                >
                  {item} →
                </Link>
              ))}
          </div>
        </section>

        <p className="check-legal">
          SellComply provides compliance intelligence and workflow guidance, not legal advice or certification. Product rules change and may depend on technical characteristics, claims, supply-chain role, jurisdiction and current regulator guidance.
        </p>
      </main>
      <SeoFooter />
    </div>
  );
}

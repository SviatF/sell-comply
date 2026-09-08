import type { Metadata } from "next";
import Link from "next/link";
import { buildComplianceReview } from "@/lib/compliance-engine";
import { resolveProductInput } from "@/lib/product-resolver";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";
import CheckActions from "@/app/components/CheckActions";
import TrackEvent from "@/app/components/TrackEvent";
import CheckRefinementForm from "@/app/components/CheckRefinementForm";
import ReportLauncher from "@/app/components/ReportLauncher";
import MarketCompareLinks from "@/app/components/MarketCompareLinks";
import { buildCheckParams, parseCheckFacts } from "@/lib/check-query";

export const metadata: Metadata = {
  title: "Product Compliance Check Results",
  description: "Review product, market and marketplace compliance areas with SellComply.",
  robots: { index: false, follow: true },
};

const statusLabel = {
  required: "REQUIRED",
  likely: "LIKELY RELEVANT",
  verify: "VERIFY",
  platform: "PLATFORM",
} as const;

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string;
    country?: string;
    marketplace?: string;
    radio?: string;
    battery?: string;
    children?: string;
    mains?: string;
    role?: string;
  }>;
}) {
  const params = await searchParams;
  const rawProduct = (params.product || "wireless headphones").slice(0, 500);
  const country = params.country || "Germany";
  const marketplace = params.marketplace || "";

  const facts = parseCheckFacts(params);

  const resolved = await resolveProductInput(rawProduct);
  const result = buildComplianceReview(
    resolved.resolvedText,
    country,
    marketplace,
    facts
  );
  const displayProduct = resolved.title || rawProduct;
  const reportQuery = buildCheckParams({
    product: rawProduct,
    country,
    marketplace,
    facts,
  });
  const reportHref = `/report?${reportQuery.toString()}`;

  return (
    <div className="seo-page check-results-page">
      <TrackEvent
        eventName="checker_completed"
        productSlug={result.product.slug}
        marketSlug={result.market.slug}
        marketplaceSlug={result.marketplace?.slug}
        metadata={{
          sourceType: resolved.sourceType,
          fetchedProductPage: resolved.fetched,
          riskScore: result.risk.score,
          riskLevel: result.risk.level,
        }}
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

        <section className={`check-risk-section risk-${result.risk.level}`}>
          <div className="risk-score-panel">
            <span className="seo-kicker"><i /> SCREENING RISK SIGNAL</span>
            <div className="risk-score-row">
              <div className="risk-score-number">
                <strong>{result.risk.score}</strong>
                <span>/100</span>
              </div>
              <div>
                <span className={`risk-level-badge ${result.risk.level}`}>
                  {result.risk.label.toUpperCase()} RISK
                </span>
                <p>{result.risk.summary}</p>
              </div>
            </div>
            <div className="risk-meter" aria-label={`Risk score ${result.risk.score} out of 100`}>
              <i style={{ width: `${result.risk.score}%` }} />
            </div>
            <small>
              This is a transparent screening-complexity signal, not a legal conclusion or probability of non-compliance.
            </small>
          </div>

          <div className="risk-drivers-panel">
            <div className="risk-panel-head">
              <span>TOP RISK DRIVERS</span>
              <strong>{result.risk.topDrivers.length}</strong>
            </div>
            <div className="risk-driver-list">
              {result.risk.topDrivers.map((factor) => (
                <div className="risk-driver-row" key={factor.id}>
                  <div>
                    <strong>{factor.label}</strong>
                    <p>{factor.detail}</p>
                  </div>
                  <span>+{factor.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="risk-reducers-panel">
            <div className="risk-panel-head">
              <span>REDUCE UNCERTAINTY</span>
              <strong>{result.risk.reducers.length}</strong>
            </div>
            {result.risk.reducers.length ? (
              <ul>
                {result.risk.reducers.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <p>Core product facts are already well defined for this screening.</p>
            )}
          </div>
        </section>

        <section className="check-conversion-section" id="next-actions">
          <div className="conversion-priority-panel">
            <div className="conversion-priority-head">
              <span className="seo-kicker"><i /> YOUR NEXT MOVE</span>
              <h2>Turn the screening into action.</h2>
              <p>
                Start with the highest-leverage step, then save the result so you can
                come back to the same product-market review.
              </p>
            </div>

            <div className="conversion-step-list">
              <a href="#refine-review" className="conversion-step">
                <span>01</span>
                <div>
                  <strong>Confirm uncertain product facts</strong>
                  <p>
                    {result.risk.reducers.length
                      ? result.risk.reducers.length + " clarification point(s) can reduce screening uncertainty."
                      : "Core facts are already fairly well defined; confirm them before relying on the review."}
                  </p>
                </div>
                <b>Start here →</b>
              </a>

              <a href="#requirements" className="conversion-step">
                <span>02</span>
                <div>
                  <strong>Resolve the highest-priority requirements</strong>
                  <p>
                    {result.summary.required} required and {result.summary.verify} verification item(s)
                    are currently in this screening.
                  </p>
                </div>
                <b>Review rules →</b>
              </a>

              <a href="#action-plan" className="conversion-step">
                <span>03</span>
                <div>
                  <strong>Work through the action plan</strong>
                  <p>
                    Follow the ordered checklist and keep evidence tied to this exact
                    product model or SKU.
                  </p>
                </div>
                <b>Open plan →</b>
              </a>
            </div>
          </div>

          <div className="conversion-actions-panel" id="conversion-actions">
            <div className="conversion-actions-copy">
              <span className="side-card-label">KEEP THIS REVIEW</span>
              <strong>Save it now. Monitor it when it matters.</strong>
              <p>
                No account required. Your saved check stays available in the local
                dashboard, and monitoring can attach an email to this product-market watch.
              </p>
            </div>
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
          </div>
        </section>

        <div id="refine-review">
          <CheckRefinementForm
          rawProduct={rawProduct}
          country={country}
          marketplace={marketplace}
          inferredFeatures={result.classification.features}
          initial={{
            radio: params.radio,
            battery: params.battery,
            children: params.children,
            mains: params.mains,
            role: params.role,
          }}
        />
        </div>

        <ReportLauncher
          href={reportHref}
          productSlug={result.product.slug}
          marketSlug={result.market.slug}
          marketplaceSlug={result.marketplace?.slug}
        />

        <section className="check-layout" id="requirements">
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
            {(resolved.brand || resolved.sku || resolved.gtin || resolved.productCategory) && (
              <div className="side-card product-data-card">
                <span className="side-card-label">DETECTED PRODUCT DATA</span>
                <div className="product-data-list">
                  {resolved.brand && <div><span>Brand</span><strong>{resolved.brand}</strong></div>}
                  {resolved.productCategory && <div><span>Category</span><strong>{resolved.productCategory}</strong></div>}
                  {resolved.sku && <div><span>SKU</span><strong>{resolved.sku}</strong></div>}
                  {resolved.gtin && <div><span>GTIN</span><strong>{resolved.gtin}</strong></div>}
                </div>
              </div>
            )}

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

        <section className="check-action-section" id="action-plan">
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
          <MarketCompareLinks
            rawProduct={rawProduct}
            currentMarket={result.market.name}
            marketplace={marketplace}
            productSlug={result.product.slug}
            currentMarketSlug={result.market.slug}
            marketplaceSlug={result.marketplace?.slug}
          />
        </section>

        <p className="check-legal">
          SellComply provides compliance intelligence and workflow guidance, not legal advice or certification. Product rules change and may depend on technical characteristics, claims, supply-chain role, jurisdiction and current regulator guidance.
        </p>
      </main>
      <SeoFooter />
    </div>
  );
}

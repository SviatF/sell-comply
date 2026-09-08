"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics-client";

export type MarketComparisonCard = {
  slug: string;
  name: string;
  flag: string;
  href: string;
  isCurrent: boolean;
  riskScore: number;
  riskLevel: string;
  complexity: "lower" | "similar" | "higher" | "current";
  scoreDelta: number;
  required: number;
  likely: number;
  verify: number;
  rulesMatched: number;
  documents: number;
  labels: number;
  additionalRules: Array<{
    id: string;
    shortName: string;
    title: string;
    status: string;
  }>;
  removedRules: Array<{
    id: string;
    shortName: string;
    title: string;
    status: string;
  }>;
};

const bandCopy = {
  current: "CURRENT MARKET",
  lower: "LOWER COMPLEXITY",
  similar: "SIMILAR COMPLEXITY",
  higher: "HIGHER COMPLEXITY",
} as const;

export default function MarketComparisonGrid({
  cards,
  productSlug,
  currentMarketSlug,
  marketplaceSlug,
}: {
  cards: MarketComparisonCard[];
  productSlug: string;
  currentMarketSlug: string;
  marketplaceSlug?: string;
}) {
  const lowest = [...cards].sort((a, b) => a.riskScore - b.riskScore)[0];
  const highest = [...cards].sort((a, b) => b.riskScore - a.riskScore)[0];
  const current = cards.find((card) => card.isCurrent) || cards[0];

  return (
    <section className="market-compare-section" id="compare-markets">
      <div className="market-compare-head">
        <div>
          <span className="seo-kicker"><i /> COMPARE MARKETS</span>
          <h2>Same product. Different compliance load.</h2>
          <p>
            Compare the same product facts across supported markets. Scores reflect
            screening complexity — not market attractiveness, legal clearance, or
            a recommendation to sell.
          </p>
        </div>

        <div className="market-compare-summary">
          <div>
            <span>LOWEST SCORE</span>
            <strong>{lowest.flag} {lowest.name}</strong>
            <b>{lowest.riskScore}/100</b>
          </div>
          <div>
            <span>CURRENT</span>
            <strong>{current.flag} {current.name}</strong>
            <b>{current.riskScore}/100</b>
          </div>
          <div>
            <span>HIGHEST SCORE</span>
            <strong>{highest.flag} {highest.name}</strong>
            <b>{highest.riskScore}/100</b>
          </div>
        </div>
      </div>

      <div className="market-compare-grid">
        {cards.map((card) => {
          const deltaLabel =
            card.scoreDelta === 0
              ? "No score change"
              : (card.scoreDelta > 0 ? "+" : "") + card.scoreDelta + " vs current";

          return (
            <article
              className={
                "market-compare-card " +
                (card.isCurrent ? "current " : "") +
                "complexity-" +
                card.complexity
              }
              key={card.slug}
            >
              <div className="market-compare-card-head">
                <div>
                  <span className={"market-complexity-badge " + card.complexity}>
                    {bandCopy[card.complexity]}
                  </span>
                  <h3>{card.flag} {card.name}</h3>
                </div>
                <div className="market-risk-score">
                  <strong>{card.riskScore}</strong>
                  <span>/100</span>
                </div>
              </div>

              <div className="market-delta-row">
                <span>{card.riskLevel.toUpperCase()} RISK</span>
                <b>{card.isCurrent ? "Baseline" : deltaLabel}</b>
              </div>

              <div className="market-metric-grid">
                <div><span>Required</span><strong>{card.required}</strong></div>
                <div><span>Verify</span><strong>{card.verify}</strong></div>
                <div><span>Rules</span><strong>{card.rulesMatched}</strong></div>
                <div><span>Docs</span><strong>{card.documents}</strong></div>
                <div><span>Labels</span><strong>{card.labels}</strong></div>
              </div>

              <div className="market-rule-diff">
                <div className="market-rule-diff-head">
                  <span>DIFFERENCES VS CURRENT</span>
                  <strong>
                    +{card.additionalRules.length} / -{card.removedRules.length}
                  </strong>
                </div>

                {card.isCurrent ? (
                  <p className="market-rule-empty">
                    This is the baseline used for the comparison.
                  </p>
                ) : (
                  <>
                    <div className="market-rule-chip-list">
                      {card.additionalRules.slice(0, 3).map((rule) => (
                        <span className="added" key={"add-" + card.slug + "-" + rule.id}>
                          + {rule.shortName}
                        </span>
                      ))}
                      {card.removedRules.slice(0, 2).map((rule) => (
                        <span className="removed" key={"remove-" + card.slug + "-" + rule.id}>
                          − {rule.shortName}
                        </span>
                      ))}
                    </div>

                    {!card.additionalRules.length && !card.removedRules.length && (
                      <p className="market-rule-empty">
                        No matched rule-pack difference from the current market.
                      </p>
                    )}

                    {(card.additionalRules.length > 3 || card.removedRules.length > 2) && (
                      <small>
                        {Math.max(0, card.additionalRules.length - 3) +
                          Math.max(0, card.removedRules.length - 2)} more difference(s)
                        in the full review.
                      </small>
                    )}
                  </>
                )}
              </div>

              {card.isCurrent ? (
                <div className="market-current-cta">Current full review</div>
              ) : (
                <Link
                  href={card.href}
                  onClick={() =>
                    trackEvent("market_compare", {
                      productSlug,
                      marketSlug: currentMarketSlug,
                      marketplaceSlug,
                      metadata: {
                        destinationMarket: card.name,
                        destinationMarketSlug: card.slug,
                        riskDelta: card.scoreDelta,
                        complexity: card.complexity,
                        additionalRules: card.additionalRules.length,
                        removedRules: card.removedRules.length,
                      },
                    })
                  }
                >
                  Open full check for {card.name} →
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

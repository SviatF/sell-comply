"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics-client";

const markets = [
  "Germany",
  "France",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
];

export default function MarketCompareLinks({
  rawProduct,
  currentMarket,
  marketplace,
  productSlug,
  currentMarketSlug,
  marketplaceSlug,
}: {
  rawProduct: string;
  currentMarket: string;
  marketplace?: string;
  productSlug: string;
  currentMarketSlug: string;
  marketplaceSlug?: string;
}) {
  return (
    <div className="check-market-links">
      {markets
        .filter((item) => item !== currentMarket)
        .map((item) => {
          const query = new URLSearchParams({
            product: rawProduct,
            country: item,
          });

          if (marketplace) query.set("marketplace", marketplace);

          return (
            <Link
              key={item}
              href={`/check?${query.toString()}`}
              onClick={() =>
                trackEvent("market_compare", {
                  productSlug,
                  marketSlug: currentMarketSlug,
                  marketplaceSlug,
                  metadata: { destinationMarket: item },
                })
              }
            >
              {item} →
            </Link>
          );
        })}
    </div>
  );
}

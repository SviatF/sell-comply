import { getMarket, getMarketplace, products, ProductSeo } from "@/lib/seo-data";

export type ReviewStatus = "likely" | "verify" | "marketplace";

export type ReviewItem = {
  title: string;
  detail: string;
  status: ReviewStatus;
  source: "product" | "market" | "marketplace";
};

const aliases: Record<string, string[]> = {
  "wireless-headphones": ["wireless headphones", "bluetooth headphones", "headphones", "earphones", "earbuds", "airpods"],
  "bluetooth-speakers": ["bluetooth speaker", "wireless speaker", "portable speaker", "speaker"],
  "power-banks": ["power bank", "powerbank", "battery pack", "portable charger"],
  "led-lights": ["led light", "led lamp", "led strip", "lighting", "lamp"],
  toys: ["toy", "toys", "kids toy", "children toy", "plush", "doll"],
  cosmetics: ["cosmetic", "cosmetics", "cream", "serum", "lipstick", "makeup", "skincare", "shampoo"],
  candles: ["candle", "candles", "wax candle", "scented candle"],
  jewelry: ["jewelry", "jewellery", "necklace", "bracelet", "earring", "ring"],
};

const genericProduct: ProductSeo = {
  slug: "general-consumer-product",
  name: "consumer product",
  category: "General consumer product",
  intro: "The product could not be confidently classified from the supplied text, so SellComply is starting with a broad consumer-product review.",
  reviewAreas: [
    "Product classification and intended use",
    "General product-safety requirements",
    "Manufacturer, importer and traceability information",
    "Labels, warnings and supporting documentation",
  ],
  questions: [
    "What is the exact product type and intended use?",
    "Who manufactures and imports the product?",
    "Which materials, electronics, batteries or radio modules are included?",
    "What test reports, labels and instructions already exist?",
  ],
};

export function classifyProduct(input: string): ProductSeo {
  const text = decodeURIComponent(input || "").toLowerCase();

  let best: { slug: string; score: number } | null = null;
  for (const [slug, terms] of Object.entries(aliases)) {
    const score = terms.reduce((sum, term) => sum + (text.includes(term) ? term.length : 0), 0);
    if (!best || score > best.score) best = { slug, score };
  }

  if (!best || best.score === 0) return genericProduct;
  return products.find((product) => product.slug === best?.slug) ?? genericProduct;
}

const countrySlugByName: Record<string, string> = {
  Germany: "germany",
  France: "france",
  "United States": "united-states",
  "United Kingdom": "united-kingdom",
  Canada: "canada",
  Australia: "australia",
};

const marketplaceSlugByName: Record<string, string> = {
  Amazon: "amazon",
  Shopify: "shopify",
  Etsy: "etsy",
  eBay: "ebay",
  "TikTok Shop": "tiktok-shop",
};

export function buildComplianceReview(input: string, countryName: string, marketplaceName?: string) {
  const product = classifyProduct(input);
  const market = getMarket(countrySlugByName[countryName] ?? "germany");
  const marketplace = marketplaceName
    ? getMarketplace(marketplaceSlugByName[marketplaceName] ?? marketplaceName.toLowerCase())
    : undefined;

  if (!market) throw new Error("Unsupported market");

  const productItems: ReviewItem[] = product.reviewAreas.map((title) => ({
    title,
    detail: `Review this area against the exact ${product.name} specification and existing evidence.`,
    status: "verify",
    source: "product",
  }));

  const marketItems: ReviewItem[] = market.reviewAreas.map((title) => ({
    title,
    detail: `This is a common ${market.name} market-access review area. Applicability depends on the exact product and seller role.`,
    status: "likely",
    source: "market",
  }));

  const marketplaceItems: ReviewItem[] = (marketplace?.reviewAreas ?? []).map((title) => ({
    title,
    detail: `Check the current ${marketplace?.name} listing or category policy for this product and destination market.`,
    status: "marketplace",
    source: "marketplace",
  }));

  const dedupe = new Map<string, ReviewItem>();
  [...marketItems, ...productItems, ...marketplaceItems].forEach((item) => {
    const key = item.title.toLowerCase();
    if (!dedupe.has(key)) dedupe.set(key, item);
  });

  const reviewItems = [...dedupe.values()].slice(0, 10);
  const certainty = product.slug === "general-consumer-product" ? "Low" : "Medium";

  return {
    product,
    market,
    marketplace,
    certainty,
    reviewItems,
    actionPlan: [
      "Confirm the exact product classification, intended use and technical characteristics.",
      "Collect supplier, manufacturer, importer and model-identification details.",
      "Match existing test reports, declarations, labels and instructions to the exact product.",
      `Resolve the highest-risk ${market.name} market gaps before listing or importing.`,
      ...(marketplace ? [`Verify the current ${marketplace.name} category and listing requirements separately.`] : []),
    ],
  };
}

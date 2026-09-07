import { getMarket, getMarketplace, products, ProductSeo } from "@/lib/seo-data";
import {
  getRulesFor,
  RegulatoryRule,
  RuleStatus,
} from "@/lib/regulatory-rules";

export type ReviewStatus = RuleStatus;

export type ReviewItem = {
  id: string;
  title: string;
  detail: string;
  status: ReviewStatus;
  source: "rule" | "marketplace" | "fallback";
  group?: string;
  why?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  effectiveNote?: string;
};

export type ProductFacts = {
  radio?: boolean;
  battery?: boolean;
  children?: boolean;
  mains?: boolean;
  role?: "manufacturer" | "importer" | "distributor" | "seller";
};

export type ClassificationResult = {
  product: ProductSeo;
  confidence: "High" | "Medium" | "Low";
  score: number;
  matchedTerms: string[];
  features: string[];
};

const aliases: Record<string, string[]> = {
  "wireless-headphones": [
    "wireless headphones",
    "bluetooth headphones",
    "bluetooth earbuds",
    "wireless earbuds",
    "earbuds",
    "earphones",
    "airpods",
    "headphones",
  ],
  "bluetooth-speakers": [
    "bluetooth speaker",
    "wireless speaker",
    "portable speaker",
    "speaker",
  ],
  "power-banks": [
    "power bank",
    "powerbank",
    "battery pack",
    "portable charger",
  ],
  "led-lights": [
    "led light",
    "led lamp",
    "led strip",
    "lighting",
    "lamp",
  ],
  toys: [
    "children's toy",
    "childrens toy",
    "kids toy",
    "toy",
    "toys",
    "plush",
    "doll",
  ],
  cosmetics: [
    "cosmetic",
    "cosmetics",
    "face cream",
    "skin cream",
    "serum",
    "lipstick",
    "makeup",
    "skincare",
    "shampoo",
  ],
  candles: ["scented candle", "wax candle", "candle", "candles"],
  jewelry: [
    "jewelry",
    "jewellery",
    "necklace",
    "bracelet",
    "earring",
    "ring",
  ],
};

const defaultFeatures: Record<string, string[]> = {
  "wireless-headphones": ["electronic", "radio", "battery"],
  "bluetooth-speakers": ["electronic", "radio", "battery"],
  "power-banks": ["electronic", "battery"],
  "led-lights": ["electronic"],
  toys: ["toy", "children"],
  cosmetics: ["cosmetic"],
  candles: ["candle"],
  jewelry: ["jewelry"],
};

const featureTerms: Record<string, string[]> = {
  radio: ["bluetooth", "wi-fi", "wifi", "wireless", "radio", "2.4ghz", "5ghz", "nfc"],
  battery: [
    "battery",
    "rechargeable",
    "lithium",
    "li-ion",
    "li ion",
    "mah",
    "power bank",
    "powerbank",
  ],
  electronic: ["electronic", "electric", "usb", "charger", "voltage", "watt", "led"],
  mains: ["110v", "120v", "220v", "230v", "240v", "mains", "ac adapter"],
  children: ["child", "children", "kids", "kid", "baby", "toddler", "age 3", "age 6"],
  cosmetic: ["cosmetic", "skincare", "cream", "serum", "makeup", "lipstick", "shampoo"],
};

const genericProduct: ProductSeo = {
  slug: "general-consumer-product",
  name: "consumer product",
  category: "General consumer product",
  intro:
    "The product could not be confidently classified from the supplied text, so SellComply is starting with a broad consumer-product review.",
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

function normalizeInput(input: string) {
  try {
    return decodeURIComponent(input || "").toLowerCase();
  } catch {
    return (input || "").toLowerCase();
  }
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

export function classifyProductDetailed(input: string): ClassificationResult {
  const text = normalizeInput(input);

  let best: { slug: string; score: number; matchedTerms: string[] } | null = null;

  for (const [slug, terms] of Object.entries(aliases)) {
    const matchedTerms = terms.filter((term) => text.includes(term));
    const score = matchedTerms.reduce((sum, term) => sum + term.length, 0);

    if (!best || score > best.score) {
      best = { slug, score, matchedTerms };
    }
  }

  const product =
    best && best.score > 0
      ? products.find((item) => item.slug === best?.slug) ?? genericProduct
      : genericProduct;

  const detectedFeatures = Object.entries(featureTerms)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([feature]) => feature);

  const features = unique([
    ...(defaultFeatures[product.slug] ?? []),
    ...detectedFeatures,
  ]);

  let confidence: ClassificationResult["confidence"] = "Low";
  if (product.slug !== "general-consumer-product") {
    const longestMatch = Math.max(0, ...(best?.matchedTerms.map((term) => term.length) ?? []));
    confidence = longestMatch >= 14 || (best?.matchedTerms.length ?? 0) >= 2 ? "High" : "Medium";
  }

  return {
    product,
    confidence,
    score: best?.score ?? 0,
    matchedTerms: best?.matchedTerms ?? [],
    features,
  };
}

export function classifyProduct(input: string): ProductSeo {
  return classifyProductDetailed(input).product;
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

function ruleToReviewItem(rule: RegulatoryRule): ReviewItem {
  return {
    id: rule.id,
    title: rule.title,
    detail: rule.summary,
    status: rule.status,
    source: "rule",
    group: rule.group,
    why: rule.why,
    sourceLabel: rule.source.label,
    sourceUrl: rule.source.url,
    effectiveNote: rule.effectiveNote,
  };
}

export function buildComplianceReview(
  input: string,
  countryName: string,
  marketplaceName?: string,
  facts: ProductFacts = {}
) {
  const classification = classifyProductDetailed(input);

  for (const feature of ["radio", "battery", "children", "mains"] as const) {
    const value = facts[feature];
    if (value === true && !classification.features.includes(feature)) {
      classification.features.push(feature);
    }
    if (value === false) {
      classification.features = classification.features.filter((item) => item !== feature);
    }
  }
  const product = classification.product;
  const market = getMarket(countrySlugByName[countryName] ?? "germany");
  const marketplace = marketplaceName
    ? getMarketplace(
        marketplaceSlugByName[marketplaceName] ?? marketplaceName.toLowerCase()
      )
    : undefined;

  if (!market) throw new Error("Unsupported market");

  const matchedRules = getRulesFor({
    marketSlug: market.slug,
    productSlug: product.slug,
    features: classification.features,
  });

  const ruleItems = matchedRules.map(ruleToReviewItem);

  const marketplaceItems: ReviewItem[] = (marketplace?.reviewAreas ?? []).map(
    (title, index) => ({
      id: `marketplace-${marketplace?.slug ?? "unknown"}-${index}`,
      title,
      detail: `Verify the current ${marketplace?.name} listing/category policy for this product and destination market. Marketplace requests can be stricter than the underlying law.`,
      status: "platform",
      source: "marketplace",
      group: "marketplace",
      why: `You selected ${marketplace?.name} as the sales channel.`,
    })
  );

  const fallbackItems: ReviewItem[] =
    matchedRules.length === 0
      ? [
          ...market.reviewAreas.slice(0, 3).map((title, index) => ({
            id: `fallback-market-${index}`,
            title,
            detail: `SellComply does not yet have a product-specific rule pack for this combination. Verify this area against the exact ${product.name} specification and current ${market.name} regulator guidance.`,
            status: "verify" as const,
            source: "fallback" as const,
            group: "product-safety",
          })),
          ...product.reviewAreas.slice(0, 2).map((title, index) => ({
            id: `fallback-product-${index}`,
            title,
            detail: `Confirm this requirement area against the exact product design, claims, materials and supply-chain role.`,
            status: "verify" as const,
            source: "fallback" as const,
            group: "product",
          })),
        ]
      : [];

  const reviewItems = [...ruleItems, ...fallbackItems, ...marketplaceItems];

  const documents = unique(
    matchedRules.flatMap((rule) => rule.documents)
  ).slice(0, 12);

  const labels = unique(
    matchedRules.flatMap((rule) => rule.labels)
  ).slice(0, 12);

  const ruleActions = unique(
    matchedRules.flatMap((rule) => rule.actions)
  );

  const actionPlan = unique([
    "Confirm the exact product model, intended use, technical characteristics and seller/importer role.",
    ...ruleActions,
    ...(marketplace
      ? [`Verify current ${marketplace.name} category and listing requirements separately from legal compliance.`]
      : []),
    "Keep declarations, test evidence, labels and supplier records tied to the exact SKU/model being sold.",
  ]).slice(0, 9);

  const evidenceGaps = unique([
    ...product.questions,
    ...(facts.radio === undefined
      ? ["Confirm whether the final product contains Bluetooth, Wi-Fi or another intentional radio transmitter"]
      : []),
    ...(classification.features.includes("radio")
      ? ["Exact radio module/chipset, frequencies and authorization evidence"]
      : []),
    ...(facts.battery === undefined
      ? ["Confirm whether the final product contains or includes a battery"]
      : []),
    ...(classification.features.includes("battery")
      ? ["Battery chemistry, capacity, transport/compliance evidence and producer role"]
      : []),
    ...(facts.children === undefined && product.slug !== "toys"
      ? ["Confirm whether the product is designed or marketed for children"]
      : []),
    ...(facts.mains === undefined && classification.features.includes("electronic")
      ? ["Confirm whether the final product connects directly to mains electricity"]
      : []),
    ...(facts.role
      ? []
      : ["Confirm your supply-chain role: manufacturer, importer, distributor or seller"]),
  ]).slice(0, 10);

  const officialSources = unique(
    matchedRules.map((rule) => JSON.stringify(rule.source))
  )
    .map((item) => JSON.parse(item) as { label: string; url: string })
    .concat(
      market.officialSources.filter(
        (source) =>
          !matchedRules.some((rule) => rule.source.url === source.url)
      )
    )
    .slice(0, 12);

  const requiredCount = matchedRules.filter((rule) => rule.status === "required").length;
  const likelyCount = matchedRules.filter((rule) => rule.status === "likely").length;
  const verifyCount =
    matchedRules.filter((rule) => rule.status === "verify").length +
    fallbackItems.length;

  return {
    product,
    market,
    marketplace,
    certainty: classification.confidence,
    classification,
    matchedRules,
    reviewItems,
    documents,
    labels,
    evidenceGaps,
    officialSources,
    actionPlan,
    facts,
    summary: {
      required: requiredCount,
      likely: likelyCount,
      verify: verifyCount,
      rulesMatched: matchedRules.length,
      fallback: matchedRules.length === 0,
    },
  };
}

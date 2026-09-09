import { marketplaces, markets, products } from "./seo-data";

export type IndexableRouteType =
  | "home"
  | "hub"
  | "trust"
  | "product-market"
  | "marketplace-product";

export type IndexableRoute = {
  path: string;
  type: IndexableRouteType;
  intent: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
};

const coreRoutes: IndexableRoute[] = [
  {
    path: "/",
    type: "home",
    intent: "Product compliance checker",
    priority: 1,
    changeFrequency: "weekly",
  },
  {
    path: "/products",
    type: "hub",
    intent: "Product compliance categories",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/markets",
    type: "hub",
    intent: "Product compliance markets",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/marketplaces",
    type: "hub",
    intent: "Marketplace compliance",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    path: "/about",
    type: "trust",
    intent: "About SellComply",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/methodology",
    type: "trust",
    intent: "SellComply compliance methodology",
    priority: 0.72,
    changeFrequency: "monthly",
  },
  {
    path: "/sources-policy",
    type: "trust",
    intent: "Official source policy",
    priority: 0.68,
    changeFrequency: "monthly",
  },
  {
    path: "/editorial-policy",
    type: "trust",
    intent: "Editorial and compliance policy",
    priority: 0.66,
    changeFrequency: "monthly",
  },
  {
    path: "/corrections",
    type: "trust",
    intent: "Corrections policy",
    priority: 0.64,
    changeFrequency: "monthly",
  },
  {
    path: "/contact",
    type: "trust",
    intent: "Contact SellComply",
    priority: 0.55,
    changeFrequency: "monthly",
  },
  {
    path: "/privacy",
    type: "trust",
    intent: "Privacy policy",
    priority: 0.45,
    changeFrequency: "yearly",
  },
  {
    path: "/terms",
    type: "trust",
    intent: "Terms of use",
    priority: 0.45,
    changeFrequency: "yearly",
  },
  {
    path: "/disclaimer",
    type: "trust",
    intent: "Compliance disclaimer",
    priority: 0.5,
    changeFrequency: "yearly",
  },
];

const productMarketRoutes: IndexableRoute[] = products.flatMap((product) =>
  markets.map((market) => ({
    path: `/sell/${product.slug}/${market.slug}`,
    type: "product-market" as const,
    intent: `Can I sell ${product.name} in ${market.name}?`,
    priority: 0.78,
    changeFrequency: "monthly" as const,
  }))
);

const marketplaceProductRoutes: IndexableRoute[] = marketplaces.flatMap(
  (marketplace) =>
    products.map((product) => ({
      path: `/marketplaces/${marketplace.slug}/${product.slug}`,
      type: "marketplace-product" as const,
      intent: `${product.name} compliance for ${marketplace.name}`,
      priority: 0.72,
      changeFrequency: "monthly" as const,
    }))
);

export const indexableRoutes: IndexableRoute[] = [
  ...coreRoutes,
  ...productMarketRoutes,
  ...marketplaceProductRoutes,
];

export function getIndexableRouteStats() {
  const byType = indexableRoutes.reduce<Record<string, number>>((acc, route) => {
    acc[route.type] = (acc[route.type] || 0) + 1;
    return acc;
  }, {});

  return {
    total: indexableRoutes.length,
    byType,
    uniquePaths: new Set(indexableRoutes.map((route) => route.path)).size,
  };
}

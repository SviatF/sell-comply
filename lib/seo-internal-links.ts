import { indexableRoutes } from "./indexable-routes";
import {
  type MarketSeo,
  type MarketplaceSeo,
  type ProductSeo,
  marketplaces,
  markets,
  products,
} from "./seo-data";

export type SeoInternalLink = {
  href: string;
  label: string;
  description?: string;
};

export const SEO_HEADER_LINKS: SeoInternalLink[] = [
  { href: "/products", label: "Products" },
  { href: "/markets", label: "Markets" },
  { href: "/marketplaces", label: "Marketplaces" },
  { href: "/about", label: "About" },
  { href: "/methodology", label: "Methodology" },
];

export const SEO_FOOTER_PRIMARY_LINKS: SeoInternalLink[] = [
  { href: "/products", label: "Products" },
  { href: "/markets", label: "Markets" },
  { href: "/marketplaces", label: "Marketplaces" },
  { href: "/about", label: "About" },
  { href: "/methodology", label: "Methodology" },
  { href: "/sources-policy", label: "Sources" },
  { href: "/editorial-policy", label: "Editorial" },
  { href: "/corrections", label: "Corrections" },
];

export const SEO_FOOTER_LEGAL_LINKS: SeoInternalLink[] = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export const HOME_DISCOVERY_LINKS: SeoInternalLink[] = [
  {
    href: "/sell/wireless-headphones/germany",
    label: "Can I sell wireless headphones in Germany?",
    description: "Electronics · Germany",
  },
  {
    href: "/sell/toys/united-states",
    label: "Toy compliance for the United States",
    description: "Children's products · USA",
  },
  {
    href: "/sell/cosmetics/france",
    label: "Cosmetics compliance for France",
    description: "Beauty · France",
  },
  {
    href: "/marketplaces/amazon/power-banks",
    label: "Power bank compliance for Amazon sellers",
    description: "Amazon · Electronics",
  },
  {
    href: "/markets",
    label: "Explore global markets",
    description: "Browse by country",
  },
  {
    href: "/products",
    label: "Explore product compliance checks",
    description: "Browse by category",
  },
];

export function getProductHubLinks(): SeoInternalLink[] {
  return products.map((product) => ({
    href: `/sell/${product.slug}/germany`,
    label: product.name,
    description: `${product.category} · ${product.reviewAreas.slice(0, 2).join(" · ")}`,
  }));
}

export function getMarketHubLinks(): SeoInternalLink[] {
  return markets.map((market) => ({
    href: `/sell/wireless-headphones/${market.slug}`,
    label: market.name,
    description: `${market.region} · ${market.language}`,
  }));
}

export function getMarketplaceHubLinks(): SeoInternalLink[] {
  return marketplaces.map((marketplace) => ({
    href: `/marketplaces/${marketplace.slug}/wireless-headphones`,
    label: marketplace.name,
    description: marketplace.reviewAreas.slice(0, 2).join(" · "),
  }));
}

export function getProductMarketInternalLinks(
  product: ProductSeo,
  market: MarketSeo
) {
  return {
    markets: markets
      .filter((item) => item.slug !== market.slug)
      .map((item) => ({
        href: `/sell/${product.slug}/${item.slug}`,
        label: item.name,
        description: `${product.name} compliance check`,
      })),
    products: products
      .filter((item) => item.slug !== product.slug)
      .map((item) => ({
        href: `/sell/${item.slug}/${market.slug}`,
        label: item.name,
        description: item.category,
      })),
    marketplaces: marketplaces.map((item) => ({
      href: `/marketplaces/${item.slug}/${product.slug}`,
      label: item.name,
      description: `${product.name} marketplace compliance`,
    })),
  };
}

export function getMarketplaceProductInternalLinks(
  product: ProductSeo,
  marketplace: MarketplaceSeo
) {
  return {
    markets: markets.map((item) => ({
      href: `/sell/${product.slug}/${item.slug}`,
      label: item.name,
      description: `${product.name} compliance check`,
    })),
    products: products
      .filter((item) => item.slug !== product.slug)
      .map((item) => ({
        href: `/marketplaces/${marketplace.slug}/${item.slug}`,
        label: item.name,
        description: item.category,
      })),
    marketplaces: marketplaces
      .filter((item) => item.slug !== marketplace.slug)
      .map((item) => ({
        href: `/marketplaces/${item.slug}/${product.slug}`,
        label: item.name,
        description: `${product.name} marketplace compliance`,
      })),
  };
}

const sharedSeoChromeTargets = Array.from(
  new Set(
    [
      "/",
      ...SEO_HEADER_LINKS.map((link) => link.href),
      ...SEO_FOOTER_PRIMARY_LINKS.map((link) => link.href),
      ...SEO_FOOTER_LEGAL_LINKS.map((link) => link.href),
    ]
  )
);

export function buildSeoInternalLinkGraph() {
  const graph = new Map<string, Set<string>>();
  const add = (from: string, to: string) => {
    if (!graph.has(from)) graph.set(from, new Set());
    graph.get(from)!.add(to);
  };

  for (const route of indexableRoutes) {
    graph.set(route.path, new Set());

    if (route.path !== "/") {
      for (const target of sharedSeoChromeTargets) add(route.path, target);
    }
  }

  for (const link of [
    ...HOME_DISCOVERY_LINKS,
    ...SEO_HEADER_LINKS,
    ...SEO_FOOTER_PRIMARY_LINKS,
    ...SEO_FOOTER_LEGAL_LINKS,
  ]) {
    add("/", link.href);
  }

  for (const link of getProductHubLinks()) add("/products", link.href);
  for (const link of getMarketHubLinks()) add("/markets", link.href);
  for (const link of getMarketplaceHubLinks()) add("/marketplaces", link.href);

  for (const product of products) {
    for (const market of markets) {
      const from = `/sell/${product.slug}/${market.slug}`;
      const links = getProductMarketInternalLinks(product, market);

      for (const link of [
        ...links.markets,
        ...links.products,
        ...links.marketplaces,
      ]) {
        add(from, link.href);
      }
    }
  }

  for (const marketplace of marketplaces) {
    for (const product of products) {
      const from = `/marketplaces/${marketplace.slug}/${product.slug}`;
      const links = getMarketplaceProductInternalLinks(product, marketplace);

      for (const link of [
        ...links.markets,
        ...links.products,
        ...links.marketplaces,
      ]) {
        add(from, link.href);
      }
    }
  }

  return graph;
}

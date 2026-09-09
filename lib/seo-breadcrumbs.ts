import type { MarketSeo, MarketplaceSeo, ProductSeo } from "./seo-data";

export type SeoBreadcrumbItem = {
  name: string;
  href: string;
};

const coreBreadcrumbs: Record<string, SeoBreadcrumbItem[]> = {
  "/": [],
  "/products": [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
  ],
  "/markets": [
    { name: "Home", href: "/" },
    { name: "Markets", href: "/markets" },
  ],
  "/marketplaces": [
    { name: "Home", href: "/" },
    { name: "Marketplaces", href: "/marketplaces" },
  ],
  "/about": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
  ],
  "/methodology": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Methodology", href: "/methodology" },
  ],
  "/sources-policy": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Sources policy", href: "/sources-policy" },
  ],
  "/editorial-policy": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Editorial policy", href: "/editorial-policy" },
  ],
  "/corrections": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Corrections", href: "/corrections" },
  ],
  "/contact": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ],
  "/privacy": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Privacy", href: "/privacy" },
  ],
  "/terms": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Terms", href: "/terms" },
  ],
  "/disclaimer": [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Disclaimer", href: "/disclaimer" },
  ],
};

export function getCoreBreadcrumbs(path: string): SeoBreadcrumbItem[] {
  return coreBreadcrumbs[path] ?? [];
}

export function getProductMarketBreadcrumbs(
  product: ProductSeo,
  market: MarketSeo
): SeoBreadcrumbItem[] {
  const href = `/sell/${product.slug}/${market.slug}`;

  return [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: `${product.name} in ${market.name}`, href },
  ];
}

export function getMarketplaceProductBreadcrumbs(
  product: ProductSeo,
  marketplace: MarketplaceSeo
): SeoBreadcrumbItem[] {
  const href = `/marketplaces/${marketplace.slug}/${product.slug}`;

  return [
    { name: "Home", href: "/" },
    { name: "Marketplaces", href: "/marketplaces" },
    { name: `${product.name} on ${marketplace.name}`, href },
  ];
}

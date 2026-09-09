import { indexableRoutes } from "./indexable-routes";
import {
  HOME_DISCOVERY_LINKS,
  SEO_FOOTER_LEGAL_LINKS,
  SEO_FOOTER_PRIMARY_LINKS,
  SEO_HEADER_LINKS,
  getMarketHubLinks,
  getMarketplaceHubLinks,
  getMarketplaceProductInternalLinks,
  getProductHubLinks,
  getProductMarketInternalLinks,
} from "./seo-internal-links";
import { marketplaces, markets, products } from "./seo-data";

const sharedSeoChromeTargets = Array.from(
  new Set([
    "/",
    ...SEO_HEADER_LINKS.map((link) => link.href),
    ...SEO_FOOTER_PRIMARY_LINKS.map((link) => link.href),
    ...SEO_FOOTER_LEGAL_LINKS.map((link) => link.href),
  ])
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

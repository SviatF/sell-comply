import type { MetadataRoute } from "next";
import { marketplaces, markets, products } from "@/lib/seo-data";

const baseUrl = "https://sellcomply.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/markets`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/marketplaces`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
  ];

  const productMarket: MetadataRoute.Sitemap = products.flatMap((product) =>
    markets.map((market) => ({
      url: `${baseUrl}/sell/${product.slug}/${market.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.78,
    }))
  );

  const marketplaceProduct: MetadataRoute.Sitemap = marketplaces.flatMap((marketplace) =>
    products.map((product) => ({
      url: `${baseUrl}/marketplaces/${marketplace.slug}/${product.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.72,
    }))
  );

  return [...core, ...productMarket, ...marketplaceProduct];
}

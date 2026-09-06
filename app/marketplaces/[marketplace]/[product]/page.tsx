import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComplianceSeoPage from "@/app/components/ComplianceSeoPage";
import { getMarketplace, getProduct, marketplaces, products } from "@/lib/seo-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return marketplaces.flatMap((marketplace) =>
    products.map((product) => ({ marketplace: marketplace.slug, product: product.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ marketplace: string; product: string }>;
}): Promise<Metadata> {
  const { marketplace: marketplaceSlug, product: productSlug } = await params;
  const marketplace = getMarketplace(marketplaceSlug);
  const product = getProduct(productSlug);
  if (!marketplace || !product) return {};

  const title = `${product.name} Compliance for ${marketplace.name} Sellers`;
  const description = `Review common product-compliance and listing questions for selling ${product.name} on ${marketplace.name}. Compare platform and target-market requirements with SellComply.`;

  return {
    title,
    description,
    alternates: { canonical: `/marketplaces/${marketplace.slug}/${product.slug}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function MarketplaceProductPage({
  params,
}: {
  params: Promise<{ marketplace: string; product: string }>;
}) {
  const { marketplace: marketplaceSlug, product: productSlug } = await params;
  const marketplace = getMarketplace(marketplaceSlug);
  const product = getProduct(productSlug);
  if (!marketplace || !product) notFound();

  return <ComplianceSeoPage product={product} marketplace={marketplace} />;
}

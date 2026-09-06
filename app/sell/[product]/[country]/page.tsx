import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComplianceSeoPage from "@/app/components/ComplianceSeoPage";
import { getMarket, getProduct, markets, products } from "@/lib/seo-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.flatMap((product) =>
    markets.map((market) => ({ product: product.slug, country: market.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string; country: string }>;
}): Promise<Metadata> {
  const { product: productSlug, country: countrySlug } = await params;
  const product = getProduct(productSlug);
  const market = getMarket(countrySlug);
  if (!product || !market) return {};

  const title = `Can I Sell ${product.name} in ${market.name}? Compliance Check`;
  const description = `Check common product compliance, safety, labelling and documentation areas for selling ${product.name} in ${market.name}. Use SellComply to review your exact product.`;

  return {
    title,
    description,
    alternates: { canonical: `/sell/${product.slug}/${market.slug}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function ProductMarketPage({
  params,
}: {
  params: Promise<{ product: string; country: string }>;
}) {
  const { product: productSlug, country: countrySlug } = await params;
  const product = getProduct(productSlug);
  const market = getMarket(countrySlug);
  if (!product || !market) notFound();

  return <ComplianceSeoPage product={product} market={market} />;
}

export type RetentionTarget = {
  rawProduct: string;
  marketSlug?: string;
  marketName?: string;
  marketplaceSlug?: string | null;
  marketplaceName?: string | null;
};

function normalizePart(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

export function retentionKey(target: RetentionTarget) {
  return [
    normalizePart(target.rawProduct),
    normalizePart(target.marketSlug || target.marketName),
    normalizePart(target.marketplaceSlug || target.marketplaceName),
  ].join("::");
}

export function sameRetentionTarget(a: RetentionTarget, b: RetentionTarget) {
  return retentionKey(a) === retentionKey(b);
}

export function buildRetentionCheckHref(target: RetentionTarget) {
  const params = new URLSearchParams();
  params.set("product", target.rawProduct.trim());
  params.set("country", (target.marketName || "Germany").trim() || "Germany");

  const marketplace = (target.marketplaceName || "").trim();
  if (marketplace) params.set("marketplace", marketplace);

  return `/check?${params.toString()}`;
}

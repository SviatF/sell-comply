import type { SellComplyD1 } from "./cloudflare-db";
import { products } from "./seo-data";
import type { RegulatoryRule } from "./regulatory-rules";

export type ApplicabilityRow = {
  id: string;
  ruleKey: string;
  ruleVersion: number;
  marketSlug: string;
  productSlug: string;
  status: RegulatoryRule["status"];
  requiredFeatures: string[];
};

function stableId(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `app_${(hash >>> 0).toString(16)}`;
}

export function expandRuleApplicability(
  rule: RegulatoryRule,
  ruleVersion: number,
  productSlugs: string[] = products.map((product) => product.slug)
): ApplicabilityRow[] {
  const excluded = new Set(rule.excludesProducts ?? []);
  const scopedProducts =
    rule.products?.length
      ? rule.products
      : productSlugs.filter((slug) => !excluded.has(slug));

  const rows: ApplicabilityRow[] = [];

  for (const marketSlug of rule.markets) {
    for (const productSlug of scopedProducts) {
      if (excluded.has(productSlug)) continue;

      const id = stableId(
        [rule.id, ruleVersion, marketSlug, productSlug].join("|")
      );

      rows.push({
        id,
        ruleKey: rule.id,
        ruleVersion,
        marketSlug,
        productSlug,
        status: rule.status,
        requiredFeatures: [...(rule.requiresFeatures ?? [])],
      });
    }
  }

  return rows;
}

export async function syncRuleApplicability(
  db: SellComplyD1,
  rule: RegulatoryRule,
  ruleVersion: number
) {
  const rows = expandRuleApplicability(rule, ruleVersion);

  await db
    .prepare(
      `UPDATE regulatory_applicability
       SET is_current = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE rule_key = ?`
    )
    .bind(rule.id)
    .run();

  let upserted = 0;
  let featureConditions = 0;

  for (const row of rows) {
    await db
      .prepare(
        `INSERT INTO regulatory_applicability (
           id, rule_key, rule_version, market_slug, product_slug,
           status, feature_match_mode, is_current,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'all', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(rule_key, rule_version, market_slug, product_slug)
         DO UPDATE SET
           status = excluded.status,
           feature_match_mode = excluded.feature_match_mode,
           is_current = 1,
           updated_at = CURRENT_TIMESTAMP`
      )
      .bind(
        row.id,
        row.ruleKey,
        row.ruleVersion,
        row.marketSlug,
        row.productSlug,
        row.status
      )
      .run();

    await db
      .prepare(
        "DELETE FROM regulatory_applicability_features WHERE applicability_id = ?"
      )
      .bind(row.id)
      .run();

    for (const feature of row.requiredFeatures) {
      await db
        .prepare(
          `INSERT INTO regulatory_applicability_features (
             id, applicability_id, feature_key, required_value, created_at
           ) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
           ON CONFLICT(applicability_id, feature_key) DO UPDATE SET
             required_value = 1`
        )
        .bind(
          stableId([row.id, feature].join("|")),
          row.id,
          feature
        )
        .run();

      featureConditions += 1;
    }

    upserted += 1;
  }

  return {
    ruleKey: rule.id,
    ruleVersion,
    applicabilityRows: rows.length,
    upserted,
    featureConditions,
  };
}

type ApplicabilityQueryRow = {
  id: string;
  rule_key: string;
  rule_version: number;
  status: RegulatoryRule["status"];
  feature_key: string | null;
};

export async function getApplicableKnowledgeRules(
  db: SellComplyD1,
  {
    marketSlug,
    productSlug,
    features,
  }: {
    marketSlug: string;
    productSlug: string;
    features: string[];
  }
) {
  const result = await db
    .prepare(
      `SELECT
         a.id,
         a.rule_key,
         a.rule_version,
         a.status,
         f.feature_key
       FROM regulatory_applicability a
       LEFT JOIN regulatory_applicability_features f
         ON f.applicability_id = a.id
        AND f.required_value = 1
       WHERE a.market_slug = ?
         AND a.product_slug = ?
         AND a.is_current = 1
       ORDER BY a.rule_key, f.feature_key`
    )
    .bind(marketSlug, productSlug)
    .all<ApplicabilityQueryRow>();

  const grouped = new Map<
    string,
    {
      ruleKey: string;
      ruleVersion: number;
      status: RegulatoryRule["status"];
      requiredFeatures: string[];
    }
  >();

  for (const row of result.results || []) {
    const key = `${row.rule_key}:${row.rule_version}`;
    const existing = grouped.get(key) ?? {
      ruleKey: row.rule_key,
      ruleVersion: Number(row.rule_version),
      status: row.status,
      requiredFeatures: [],
    };

    if (row.feature_key && !existing.requiredFeatures.includes(row.feature_key)) {
      existing.requiredFeatures.push(row.feature_key);
    }

    grouped.set(key, existing);
  }

  const featureSet = new Set(features);

  return [...grouped.values()].filter((row) =>
    row.requiredFeatures.every((feature) => featureSet.has(feature))
  );
}

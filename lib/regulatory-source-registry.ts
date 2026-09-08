import type { SellComplyD1 } from "./cloudflare-db";
import type { RegulatoryRule } from "./regulatory-rules";

export type SourceKind =
  | "legislation"
  | "mandatory-standard"
  | "prohibition"
  | "regulator-guidance"
  | "business-guidance";

export type SourceRegistryMetadata = {
  canonicalUrl: string;
  canonicalHost: string;
  authoritySlug: string;
  authorityName: string;
  jurisdictionSlug: string;
  sourceKind: SourceKind;
  marketSlugs: string[];
};

type ExistingSource = {
  id: string;
  url: string;
};

function stableId(prefix: string, value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16)}`;
}

export function canonicalizeOfficialUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  for (const key of [...url.searchParams.keys()]) {
    if (
      key.toLowerCase().startsWith("utm_") ||
      ["fbclid", "gclid", "mc_cid", "mc_eid"].includes(key.toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.sort();

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

function authorityFrom(label: string, host: string) {
  const normalizedLabel = label.toLowerCase();

  if (host === "eur-lex.europa.eu") {
    return {
      authoritySlug: "eur-lex-eu",
      authorityName: "EUR-Lex / European Union",
    };
  }

  if (host.endsWith("cpsc.gov")) {
    return {
      authoritySlug: "us-cpsc",
      authorityName: "U.S. Consumer Product Safety Commission",
    };
  }

  if (host.endsWith("fcc.gov")) {
    return {
      authoritySlug: "us-fcc",
      authorityName: "U.S. Federal Communications Commission",
    };
  }

  if (host.endsWith("fda.gov")) {
    return {
      authoritySlug: "us-fda",
      authorityName: "U.S. Food and Drug Administration",
    };
  }

  if (host.endsWith("phmsa.dot.gov")) {
    return {
      authoritySlug: "us-phmsa",
      authorityName: "U.S. Pipeline and Hazardous Materials Safety Administration",
    };
  }

  if (host === "ised-isde.canada.ca" || normalizedLabel.startsWith("ised")) {
    return {
      authoritySlug: "ca-ised",
      authorityName: "Innovation, Science and Economic Development Canada",
    };
  }

  if (host.endsWith("canada.ca")) {
    if (normalizedLabel.startsWith("health canada")) {
      return {
        authoritySlug: "ca-health-canada",
        authorityName: "Health Canada",
      };
    }

    return {
      authoritySlug: "ca-government",
      authorityName: "Government of Canada",
    };
  }

  if (host === "www.gov.uk" || host === "gov.uk") {
    return {
      authoritySlug: "uk-government",
      authorityName: "GOV.UK",
    };
  }

  if (host.endsWith("acma.gov.au")) {
    return {
      authoritySlug: "au-acma",
      authorityName: "Australian Communications and Media Authority",
    };
  }

  if (host.endsWith("productsafety.gov.au")) {
    return {
      authoritySlug: "au-accc-product-safety",
      authorityName: "ACCC Product Safety",
    };
  }

  return {
    authoritySlug: host.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    authorityName: label.split("—")[0]?.trim() || host,
  };
}

function sourceKindFrom(label: string, host: string): SourceKind {
  const value = `${label} ${host}`.toLowerCase();

  if (host === "eur-lex.europa.eu") return "legislation";
  if (value.includes("mandatory standard")) return "mandatory-standard";
  if (value.includes(" ban") || value.includes("prohibition")) return "prohibition";
  if (
    value.includes("regulation") ||
    value.includes("directive") ||
    value.includes("act ")
  ) {
    return "legislation";
  }
  if (
    value.includes("business") ||
    value.includes("producer responsibilities") ||
    value.includes("supplier")
  ) {
    return "business-guidance";
  }

  return "regulator-guidance";
}

function jurisdictionFrom(markets: string[]) {
  const uniqueMarkets = [...new Set(markets)].sort();

  if (
    uniqueMarkets.length > 0 &&
    uniqueMarkets.every((market) => ["germany", "france"].includes(market))
  ) {
    return "european-union";
  }

  if (uniqueMarkets.length === 1) return uniqueMarkets[0];
  if (uniqueMarkets.length === 0) return "global";
  return "multi-market";
}

export function buildSourceRegistryMetadata({
  label,
  url,
  markets,
}: {
  label: string;
  url: string;
  markets: string[];
}): SourceRegistryMetadata {
  const canonicalUrl = canonicalizeOfficialUrl(url);
  const canonicalHost = new URL(canonicalUrl).hostname;
  const authority = authorityFrom(label, canonicalHost);

  return {
    canonicalUrl,
    canonicalHost,
    authoritySlug: authority.authoritySlug,
    authorityName: authority.authorityName,
    jurisdictionSlug: jurisdictionFrom(markets),
    sourceKind: sourceKindFrom(label, canonicalHost),
    marketSlugs: [...new Set(markets)].sort(),
  };
}

async function findOrCreateSource(
  db: SellComplyD1,
  {
    title,
    url,
    markets,
  }: {
    title: string;
    url: string;
    markets: string[];
    lastVerified?: string | null;
  }
) {
  const metadata = buildSourceRegistryMetadata({
    label: title,
    url,
    markets,
  });

  const existingRegistry = await db
    .prepare(
      `SELECT source_id
       FROM regulatory_source_registry
       WHERE canonical_url = ?
       LIMIT 1`
    )
    .bind(metadata.canonicalUrl)
    .first<{ source_id: string }>();

  let sourceId = existingRegistry?.source_id || "";

  if (!sourceId) {
    let source = await db
      .prepare("SELECT id, url FROM sources WHERE url = ? LIMIT 1")
      .bind(url)
      .first<ExistingSource>();

    if (!source && metadata.canonicalUrl !== url) {
      source = await db
        .prepare("SELECT id, url FROM sources WHERE url = ? LIMIT 1")
        .bind(metadata.canonicalUrl)
        .first<ExistingSource>();
    }

    sourceId = source?.id || stableId("src", metadata.canonicalUrl);

    if (!source) {
      await db
        .prepare(
          `INSERT INTO sources (
             id, jurisdiction, market_slug, regulator, title, url,
             source_type, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, 'official', CURRENT_TIMESTAMP)`
        )
        .bind(
          sourceId,
          metadata.jurisdictionSlug,
          metadata.marketSlugs[0] || null,
          metadata.authorityName,
          title,
          metadata.canonicalUrl
        )
        .run();
    }
  }

  await db
    .prepare(
      `UPDATE sources
       SET jurisdiction = ?,
           market_slug = COALESCE(market_slug, ?),
           regulator = ?,
           title = ?,
           source_type = 'official'
       WHERE id = ?`
    )
    .bind(
      metadata.jurisdictionSlug,
      metadata.marketSlugs[0] || null,
      metadata.authorityName,
      title,
      sourceId
    )
    .run();

  await db
    .prepare(
      `INSERT INTO regulatory_source_registry (
         source_id, canonical_url, canonical_host,
         authority_slug, authority_name, jurisdiction_slug,
         source_kind, is_primary, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(canonical_url) DO UPDATE SET
         canonical_host = excluded.canonical_host,
         authority_slug = excluded.authority_slug,
         authority_name = excluded.authority_name,
         jurisdiction_slug = excluded.jurisdiction_slug,
         source_kind = excluded.source_kind,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      sourceId,
      metadata.canonicalUrl,
      metadata.canonicalHost,
      metadata.authoritySlug,
      metadata.authorityName,
      metadata.jurisdictionSlug,
      metadata.sourceKind
    )
    .run();

  const canonicalRegistry = await db
    .prepare(
      "SELECT source_id FROM regulatory_source_registry WHERE canonical_url = ? LIMIT 1"
    )
    .bind(metadata.canonicalUrl)
    .first<{ source_id: string }>();

  sourceId = canonicalRegistry?.source_id || sourceId;

  for (const marketSlug of metadata.marketSlugs) {
    await db
      .prepare(
        `INSERT INTO regulatory_source_markets (
           id, source_id, market_slug, created_at
         ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(source_id, market_slug) DO NOTHING`
      )
      .bind(
        stableId("srcm", `${sourceId}|${marketSlug}`),
        sourceId,
        marketSlug
      )
      .run();
  }

  return {
    sourceId,
    metadata,
  };
}

export async function syncRuleSourceRegistry(
  db: SellComplyD1,
  rule: RegulatoryRule,
  ruleVersion: number
) {
  const source = await findOrCreateSource(db, {
    title: rule.source.label,
    url: rule.source.url,
    markets: rule.markets,
    lastVerified: rule.lastVerified,
  });

  await db
    .prepare(
      `UPDATE regulatory_rule_sources
       SET is_current = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE rule_key = ?`
    )
    .bind(rule.id)
    .run();

  await db
    .prepare(
      `INSERT INTO regulatory_rule_sources (
         id, rule_key, rule_version, source_id,
         relation_type, is_current, created_at, updated_at
       ) VALUES (?, ?, ?, ?, 'primary', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(rule_key, rule_version, source_id) DO UPDATE SET
         relation_type = 'primary',
         is_current = 1,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      stableId("rsrc", `${rule.id}|${ruleVersion}|${source.sourceId}`),
      rule.id,
      ruleVersion,
      source.sourceId
    )
    .run();

  return {
    ruleKey: rule.id,
    ruleVersion,
    sourceId: source.sourceId,
    ...source.metadata,
  };
}

export async function syncExistingOfficialSourcesToRegistry(db: SellComplyD1) {
  const rows = await db
    .prepare(
      `SELECT id, market_slug, title, url, last_verified_at
       FROM sources
       WHERE source_type = 'official'`
    )
    .all<{
      id: string;
      market_slug: string | null;
      title: string;
      url: string;
      last_verified_at: string | null;
    }>();

  let synced = 0;

  for (const row of rows.results || []) {
    await findOrCreateSource(db, {
      title: row.title,
      url: row.url,
      markets: row.market_slug ? [row.market_slug] : [],
      lastVerified: row.last_verified_at,
    });
    synced += 1;
  }

  return { synced };
}

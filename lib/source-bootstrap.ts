import { markets } from "@/lib/seo-data";
import { SellComplyD1 } from "@/lib/cloudflare-db";

function stableId(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `src_${(hash >>> 0).toString(16)}`;
}

export async function seedOfficialSources(db: SellComplyD1) {
  let inserted = 0;

  for (const market of markets) {
    for (const source of market.officialSources) {
      const id = stableId(source.url);

      await db
        .prepare(
          `INSERT INTO sources (
             id, jurisdiction, market_slug, regulator, title, url,
             source_type, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, 'official', CURRENT_TIMESTAMP)
           ON CONFLICT(url) DO UPDATE SET
             jurisdiction = excluded.jurisdiction,
             market_slug = excluded.market_slug,
             title = excluded.title`
        )
        .bind(
          id,
          market.name,
          market.slug,
          market.name,
          source.label,
          source.url
        )
        .run();

      inserted += 1;
    }
  }

  return { inserted };
}


let sourcesReady = false;

export async function ensureOfficialSources(db: SellComplyD1) {
  if (sourcesReady) return;

  await seedOfficialSources(db);
  sourcesReady = true;
}

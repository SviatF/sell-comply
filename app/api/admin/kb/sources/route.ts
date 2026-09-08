import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { ensureOfficialSources } from "@/lib/source-bootstrap";
import { ensureRegulatoryKnowledgeBase } from "@/lib/regulatory-kb";

function getSecret(name: string) {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const expected = getSecret("ADMIN_TOKEN");
  const supplied = request.headers.get("x-admin-token") || "";

  if (!expected || supplied !== expected) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "D1_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const authority = (url.searchParams.get("authority") || "").trim();
  const market = (url.searchParams.get("market") || "").trim();

  try {
    await ensureDatabaseSchema(db);
    await ensureOfficialSources(db);
    await ensureRegulatoryKnowledgeBase(db);

    const result = await db
      .prepare(
        `SELECT
           sr.source_id,
           sr.canonical_url,
           sr.canonical_host,
           sr.authority_slug,
           sr.authority_name,
           sr.jurisdiction_slug,
           sr.source_kind,
           s.title,
           s.last_verified_at,
           s.last_checked_at,
           s.last_http_status,
           s.last_content_hash,
           GROUP_CONCAT(DISTINCT sm.market_slug) AS markets,
           COUNT(DISTINCT CASE WHEN rs.is_current = 1 THEN rs.rule_key || ':' || rs.rule_version END) AS current_rule_links
         FROM regulatory_source_registry sr
         INNER JOIN sources s ON s.id = sr.source_id
         LEFT JOIN regulatory_source_markets sm ON sm.source_id = sr.source_id
         LEFT JOIN regulatory_rule_sources rs ON rs.source_id = sr.source_id
         WHERE (? = '' OR sr.authority_slug = ?)
           AND (
             ? = ''
             OR EXISTS (
               SELECT 1
               FROM regulatory_source_markets sm2
               WHERE sm2.source_id = sr.source_id
                 AND sm2.market_slug = ?
             )
           )
         GROUP BY
           sr.source_id,
           sr.canonical_url,
           sr.canonical_host,
           sr.authority_slug,
           sr.authority_name,
           sr.jurisdiction_slug,
           sr.source_kind,
           s.title,
           s.last_verified_at,
           s.last_checked_at,
           s.last_http_status,
           s.last_content_hash
         ORDER BY current_rule_links DESC, sr.authority_name, s.title
         LIMIT 150`
      )
      .bind(authority, authority, market, market)
      .all();

    return NextResponse.json({
      ok: true,
      filters: { authority: authority || null, market: market || null },
      count: result.results?.length || 0,
      sources: result.results || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SOURCE_REGISTRY_QUERY_FAILED",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

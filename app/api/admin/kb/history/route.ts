import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
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

type HistoryRow = {
  id: string;
  event_type: string;
  source_id: string | null;
  source_title: string | null;
  source_url: string | null;
  rule_key: string | null;
  rule_title: string | null;
  from_rule_version: number | null;
  to_rule_version: number | null;
  previous_source_hash: string | null;
  new_source_hash: string | null;
  changed_fields_json: string | null;
  summary: string | null;
  effective_from: string | null;
  detected_at: string;
  decision: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  affected_markets: string | null;
  affected_products: string | null;
  impact_count: number;
};

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
  const rule = (url.searchParams.get("rule") || "").trim();
  const source = (url.searchParams.get("source") || "").trim();
  const market = (url.searchParams.get("market") || "").trim();
  const product = (url.searchParams.get("product") || "").trim();
  const eventType = (url.searchParams.get("event_type") || "").trim();
  const decision = (url.searchParams.get("decision") || "").trim();
  const limit = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get("limit") || "50") || 50)
  );

  try {
    await ensureDatabaseSchema(db);
    await ensureRegulatoryKnowledgeBase(db);

    const result = await db
      .prepare(
        `SELECT
           e.id,
           e.event_type,
           e.source_id,
           s.title AS source_title,
           s.url AS source_url,
           e.rule_key,
           r.title AS rule_title,
           e.from_rule_version,
           e.to_rule_version,
           e.previous_source_hash,
           e.new_source_hash,
           e.changed_fields_json,
           e.summary,
           e.effective_from,
           e.detected_at,
           e.decision,
           e.reviewed_by,
           e.review_note,
           e.reviewed_at,
           GROUP_CONCAT(DISTINCT i.market_slug) AS affected_markets,
           GROUP_CONCAT(DISTINCT i.product_slug) AS affected_products,
           COUNT(DISTINCT i.id) AS impact_count
         FROM regulatory_change_events e
         LEFT JOIN sources s ON s.id = e.source_id
         LEFT JOIN regulatory_rules r ON r.rule_key = e.rule_key
         LEFT JOIN regulatory_change_impacts i ON i.change_event_id = e.id
         WHERE (? = '' OR e.rule_key = ?)
           AND (? = '' OR e.source_id = ?)
           AND (? = '' OR e.event_type = ?)
           AND (? = '' OR COALESCE(e.decision, '') = ?)
           AND (
             ? = ''
             OR EXISTS (
               SELECT 1
               FROM regulatory_change_impacts mi
               WHERE mi.change_event_id = e.id
                 AND mi.market_slug = ?
             )
           )
           AND (
             ? = ''
             OR EXISTS (
               SELECT 1
               FROM regulatory_change_impacts pi
               WHERE pi.change_event_id = e.id
                 AND pi.product_slug = ?
             )
           )
         GROUP BY
           e.id,
           e.event_type,
           e.source_id,
           s.title,
           s.url,
           e.rule_key,
           r.title,
           e.from_rule_version,
           e.to_rule_version,
           e.previous_source_hash,
           e.new_source_hash,
           e.changed_fields_json,
           e.summary,
           e.effective_from,
           e.detected_at,
           e.decision,
           e.reviewed_by,
           e.review_note,
           e.reviewed_at
         ORDER BY e.detected_at DESC
         LIMIT ?`
      )
      .bind(
        rule,
        rule,
        source,
        source,
        eventType,
        eventType,
        decision,
        decision,
        market,
        market,
        product,
        product,
        limit
      )
      .all<HistoryRow>();

    const items = (result.results || []).map((row) => ({
      id: row.id,
      eventType: row.event_type,
      source: row.source_id
        ? {
            id: row.source_id,
            title: row.source_title,
            url: row.source_url,
          }
        : null,
      rule: row.rule_key
        ? {
            key: row.rule_key,
            title: row.rule_title,
            fromVersion: row.from_rule_version,
            toVersion: row.to_rule_version,
          }
        : null,
      previousSourceHash: row.previous_source_hash,
      newSourceHash: row.new_source_hash,
      changedFields: row.changed_fields_json
        ? JSON.parse(row.changed_fields_json)
        : [],
      summary: row.summary,
      effectiveFrom: row.effective_from,
      detectedAt: row.detected_at,
      decision: row.decision,
      reviewedBy: row.reviewed_by,
      reviewNote: row.review_note,
      reviewedAt: row.reviewed_at,
      affectedMarkets: row.affected_markets
        ? row.affected_markets.split(",").filter(Boolean).sort()
        : [],
      affectedProducts: row.affected_products
        ? row.affected_products.split(",").filter(Boolean).sort()
        : [],
      impactCount: Number(row.impact_count || 0),
    }));

    return NextResponse.json({
      ok: true,
      count: items.length,
      filters: {
        rule: rule || null,
        source: source || null,
        market: market || null,
        product: product || null,
        eventType: eventType || null,
        decision: decision || null,
      },
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "CHANGE_HISTORY_QUERY_FAILED",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

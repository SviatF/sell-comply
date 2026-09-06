import { NextResponse } from "next/server";
import { getOptionalDb } from "@/lib/cloudflare-db";

export async function GET(request: Request) {
  const visitorId = new URL(request.url).searchParams.get("visitor_id") || "";
  if (!visitorId) {
    return NextResponse.json({ ok: false, error: "VISITOR_ID_REQUIRED" }, { status: 400 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false, items: [] });
  }

  try {
    const result = await db
      .prepare(
        `SELECT DISTINCT
           c.id, c.market_slug, c.change_type, c.title, c.summary,
           c.effective_date, c.detected_at, c.source_url, c.review_status
         FROM rule_changes c
         INNER JOIN monitoring_subscriptions m
           ON m.market_slug = c.market_slug
         WHERE m.visitor_id = ?
           AND m.is_active = 1
           AND c.detected_at >= m.created_at
         ORDER BY c.detected_at DESC
         LIMIT 30`
      )
      .bind(visitorId)
      .all();

    return NextResponse.json({
      ok: true,
      persisted: true,
      items: result.results || [],
    });
  } catch {
    return NextResponse.json({ ok: true, persisted: false, items: [] });
  }
}

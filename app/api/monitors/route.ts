import { NextResponse } from "next/server";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";

type MonitorPayload = {
  visitorId?: string;
  rawProduct?: string;
  productSlug?: string;
  marketSlug?: string;
  marketName?: string;
  marketplaceSlug?: string | null;
  marketplaceName?: string | null;
};

export async function POST(request: Request) {
  const body = (await request.json()) as MonitorPayload;
  if (!body.rawProduct || !body.marketSlug || !body.marketName) {
    return NextResponse.json({ ok: false, error: "INVALID_MONITOR_PAYLOAD" }, { status: 400 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false, reason: "D1_NOT_CONFIGURED" });
  }

  try {
    await ensureDatabaseSchema(db);
    const existing = await db
      .prepare(
        `SELECT id FROM monitoring_subscriptions
         WHERE visitor_id = ? AND raw_product = ? AND market_slug = ?
         AND COALESCE(marketplace_slug, '') = COALESCE(?, '')
         AND is_active = 1
         LIMIT 1`
      )
      .bind(
        body.visitorId || null,
        body.rawProduct,
        body.marketSlug,
        body.marketplaceSlug || null
      )
      .first<{ id: string }>();

    if (existing?.id) {
      return NextResponse.json({ ok: true, persisted: true, id: existing.id, existing: true });
    }

    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO monitoring_subscriptions (
          id, visitor_id, raw_product, product_slug,
          market_slug, market_name, marketplace_slug, marketplace_name,
          next_check_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))`
      )
      .bind(
        id,
        body.visitorId || null,
        body.rawProduct,
        body.productSlug || null,
        body.marketSlug,
        body.marketName,
        body.marketplaceSlug || null,
        body.marketplaceName || null
      )
      .run();

    return NextResponse.json({ ok: true, persisted: true, id });
  } catch {
    return NextResponse.json({ ok: true, persisted: false, reason: "D1_SCHEMA_NOT_READY" });
  }
}

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
        `SELECT id, raw_product, product_slug, market_slug, market_name,
          marketplace_slug, marketplace_name, is_active,
          last_checked_at, next_check_at, created_at
         FROM monitoring_subscriptions
         WHERE visitor_id = ? AND is_active = 1
         ORDER BY created_at DESC
         LIMIT 50`
      )
      .bind(visitorId)
      .all();

    return NextResponse.json({ ok: true, persisted: true, items: result.results || [] });
  } catch {
    return NextResponse.json({ ok: true, persisted: false, items: [] });
  }
}

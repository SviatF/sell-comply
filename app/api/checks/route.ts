import { NextResponse } from "next/server";
import { getOptionalDb } from "@/lib/cloudflare-db";

type CheckPayload = {
  visitorId?: string;
  rawProduct?: string;
  productSlug?: string;
  category?: string;
  marketSlug?: string;
  marketName?: string;
  marketplaceSlug?: string | null;
  marketplaceName?: string | null;
  status?: string;
  certainty?: string;
  reviewCount?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CheckPayload;
  if (!body.rawProduct || !body.marketSlug || !body.marketName) {
    return NextResponse.json({ ok: false, error: "INVALID_CHECK_PAYLOAD" }, { status: 400 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false, reason: "D1_NOT_CONFIGURED" });
  }

  const id = crypto.randomUUID();

  try {
    await db
      .prepare(
        `INSERT INTO checks (
          id, visitor_id, raw_product, product_slug, category,
          market_slug, market_name, marketplace_slug, marketplace_name,
          status, certainty, review_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        body.visitorId || null,
        body.rawProduct,
        body.productSlug || null,
        body.category || null,
        body.marketSlug,
        body.marketName,
        body.marketplaceSlug || null,
        body.marketplaceName || null,
        body.status || "needs_review",
        body.certainty || null,
        body.reviewCount || 0
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
        `SELECT id, raw_product, product_slug, category, market_slug, market_name,
          marketplace_slug, marketplace_name, status, certainty, review_count, created_at
         FROM checks
         WHERE visitor_id = ?
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

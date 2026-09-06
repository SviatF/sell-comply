import { NextResponse } from "next/server";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { ensureOfficialSources } from "@/lib/source-bootstrap";

type MonitorPayload = {
  visitorId?: string;
  email?: string;
  rawProduct?: string;
  productSlug?: string;
  marketSlug?: string;
  marketName?: string;
  marketplaceSlug?: string | null;
  marketplaceName?: string | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function POST(request: Request) {
  const body = (await request.json()) as MonitorPayload;
  const email = normalizeEmail(body.email || "");

  if (!body.rawProduct || !body.marketSlug || !body.marketName || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "INVALID_MONITOR_PAYLOAD" }, { status: 400 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: false, persisted: false, reason: "D1_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    await ensureDatabaseSchema(db);
    await ensureOfficialSources(db);

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

    const monitorId = existing?.id || crypto.randomUUID();

    if (!existing?.id) {
      await db
        .prepare(
          `INSERT INTO monitoring_subscriptions (
            id, visitor_id, raw_product, product_slug,
            market_slug, market_name, marketplace_slug, marketplace_name,
            next_check_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+1 day'))`
        )
        .bind(
          monitorId,
          body.visitorId || null,
          body.rawProduct,
          body.productSlug || null,
          body.marketSlug,
          body.marketName,
          body.marketplaceSlug || null,
          body.marketplaceName || null
        )
        .run();
    }

    const subscriberId = crypto.randomUUID();

    await db
      .prepare(
        `INSERT INTO email_subscribers (
          id, visitor_id, email, status, consent_source, consent_at, updated_at
        ) VALUES (?, ?, ?, 'active', 'monitor_product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(email) DO UPDATE SET
          visitor_id = COALESCE(email_subscribers.visitor_id, excluded.visitor_id),
          status = 'active',
          consent_source = 'monitor_product',
          consent_at = CURRENT_TIMESTAMP,
          unsubscribed_at = NULL,
          updated_at = CURRENT_TIMESTAMP`
      )
      .bind(subscriberId, body.visitorId || null, email)
      .run();

    const subscriber = await db
      .prepare("SELECT id FROM email_subscribers WHERE email = ? LIMIT 1")
      .bind(email)
      .first<{ id: string }>();

    if (!subscriber?.id) {
      return NextResponse.json({ ok: false, error: "SUBSCRIBER_CREATE_FAILED" }, { status: 500 });
    }

    await db
      .prepare(
        `INSERT INTO monitoring_recipients (
          id, monitor_id, subscriber_id, channel, is_active
        ) VALUES (?, ?, ?, 'email', 1)
        ON CONFLICT(monitor_id, subscriber_id, channel) DO UPDATE SET
          is_active = 1`
      )
      .bind(crypto.randomUUID(), monitorId, subscriber.id)
      .run();

    return NextResponse.json({
      ok: true,
      persisted: true,
      id: monitorId,
      existing: Boolean(existing?.id),
      emailReady: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "MONITOR_SAVE_FAILED",
        detail: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
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
    await ensureDatabaseSchema(db);

    const result = await db
      .prepare(
        `SELECT
          m.id, m.raw_product, m.product_slug, m.market_slug, m.market_name,
          m.marketplace_slug, m.marketplace_name, m.is_active,
          m.last_checked_at, m.next_check_at, m.created_at,
          CASE WHEN EXISTS (
            SELECT 1
            FROM monitoring_recipients mr
            INNER JOIN email_subscribers es ON es.id = mr.subscriber_id
            WHERE mr.monitor_id = m.id
              AND mr.channel = 'email'
              AND mr.is_active = 1
              AND es.status = 'active'
          ) THEN 1 ELSE 0 END AS email_ready
         FROM monitoring_subscriptions m
         WHERE m.visitor_id = ? AND m.is_active = 1
         ORDER BY m.created_at DESC
         LIMIT 50`
      )
      .bind(visitorId)
      .all();

    return NextResponse.json({ ok: true, persisted: true, items: result.results || [] });
  } catch {
    return NextResponse.json({ ok: true, persisted: false, items: [] });
  }
}

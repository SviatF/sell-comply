import { NextResponse } from "next/server";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";

type EventPayload = {
  visitorId?: string;
  eventName?: string;
  path?: string;
  productSlug?: string;
  marketSlug?: string;
  marketplaceSlug?: string;
  metadata?: Record<string, unknown>;
};

const allowedEvents = new Set([
  "checker_started",
  "checker_completed",
  "save_check",
  "monitor_product",
  "dashboard_open",
  "market_compare",
]);

export async function POST(request: Request) {
  let body: EventPayload;
  try {
    body = (await request.json()) as EventPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  if (!body.eventName || !allowedEvents.has(body.eventName)) {
    return NextResponse.json({ ok: false, error: "INVALID_EVENT" }, { status: 400 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    await ensureDatabaseSchema(db);
    await db
      .prepare(
        `INSERT INTO events (
          id, visitor_id, event_name, path, product_slug,
          market_slug, marketplace_slug, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        body.visitorId || null,
        body.eventName,
        body.path || null,
        body.productSlug || null,
        body.marketSlug || null,
        body.marketplaceSlug || null,
        body.metadata ? JSON.stringify(body.metadata).slice(0, 3000) : null
      )
      .run();

    return NextResponse.json({ ok: true, persisted: true });
  } catch {
    return NextResponse.json({ ok: true, persisted: false });
  }
}

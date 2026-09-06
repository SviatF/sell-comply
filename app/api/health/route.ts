import { NextResponse } from "next/server";
import { databaseState, getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { ensureOfficialSources } from "@/lib/source-bootstrap";

export async function GET() {
  const db = getOptionalDb();

  if (!db) {
    return NextResponse.json({
      ok: true,
      d1: databaseState(db),
      schema: "unavailable",
      sources: 0,
    });
  }

  try {
    await ensureDatabaseSchema(db);
    await ensureOfficialSources(db);

    const version = await db
      .prepare("SELECT value FROM schema_meta WHERE key = 'schema_version' LIMIT 1")
      .first<{ value: string }>();

    const sourceCount = await db
      .prepare("SELECT COUNT(*) AS total FROM sources WHERE source_type = 'official'")
      .first<{ total: number }>();

    const monitorCount = await db
      .prepare("SELECT COUNT(*) AS total FROM monitoring_subscriptions WHERE is_active = 1")
      .first<{ total: number }>();

    const subscriberCount = await db
      .prepare("SELECT COUNT(*) AS total FROM email_subscribers WHERE status = 'active'")
      .first<{ total: number }>();

    return NextResponse.json({
      ok: true,
      d1: "connected",
      schema: version?.value === "4" ? "ready" : "unknown",
      schemaVersion: version?.value || null,
      officialSources: Number(sourceCount?.total || 0),
      monitoredProducts: Number(monitorCount?.total || 0),
      emailSubscribers: Number(subscriberCount?.total || 0),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        d1: "connected",
        schema: "error",
        error: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}

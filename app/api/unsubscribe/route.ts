import { NextResponse } from "next/server";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const token = (body.token || "").trim();

  if (!token || token.length < 40 || token.length > 160) {
    return NextResponse.json({ ok: false, error: "INVALID_TOKEN" }, { status: 400 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "D1_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    await ensureDatabaseSchema(db);

    const row = await db
      .prepare(
        `SELECT subscriber_id
         FROM unsubscribe_tokens
         WHERE token = ?
         LIMIT 1`
      )
      .bind(token)
      .first<{ subscriber_id: string }>();

    if (!row?.subscriber_id) {
      return NextResponse.json({ ok: false, error: "TOKEN_NOT_FOUND" }, { status: 404 });
    }

    await db
      .prepare(
        `UPDATE email_subscribers
         SET status = 'unsubscribed',
             unsubscribed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(row.subscriber_id)
      .run();

    await db
      .prepare(
        `UPDATE monitoring_recipients
         SET is_active = 0
         WHERE subscriber_id = ? AND channel = 'email'`
      )
      .bind(row.subscriber_id)
      .run();

    await db
      .prepare(
        `UPDATE alert_jobs
         SET status = 'cancelled',
             last_error = 'UNSUBSCRIBED'
         WHERE subscriber_id = ?
           AND status IN ('queued', 'failed')`
      )
      .bind(row.subscriber_id)
      .run();

    return NextResponse.json({ ok: true, unsubscribed: true });
  } catch {
    return NextResponse.json({ ok: false, error: "UNSUBSCRIBE_FAILED" }, { status: 500 });
  }
}

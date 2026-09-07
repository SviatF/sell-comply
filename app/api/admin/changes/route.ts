import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";

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
    return NextResponse.json({ ok: false, error: "D1_NOT_CONFIGURED" }, { status: 503 });
  }

  await ensureDatabaseSchema(db);

  const result = await db
    .prepare(
      `SELECT
         c.id, c.market_slug, c.product_slug, c.change_type,
         c.title, c.summary, c.detected_at, c.source_url, c.review_status,
         cr.decision, cr.review_note, cr.reviewed_at
       FROM rule_changes c
       LEFT JOIN change_reviews cr ON cr.change_id = c.id
       ORDER BY
         CASE c.review_status WHEN 'needs_review' THEN 0 ELSE 1 END,
         c.detected_at DESC
       LIMIT 100`
    )
    .all();

  return NextResponse.json({ ok: true, items: result.results || [] });
}

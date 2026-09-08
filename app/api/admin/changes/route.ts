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

type ChangeQueueRow = {
  id: string;
  market_slug: string | null;
  product_slug: string | null;
  change_type: string;
  title: string;
  summary: string | null;
  detected_at: string;
  source_url: string | null;
  review_status: string;
  triage_outcome: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  seller_alert_eligible: number | null;
  requires_rule_update: number | null;
  impacted_rule_keys: string | null;
  reviewed_rule_keys: string | null;
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

  await ensureDatabaseSchema(db);

  const result = await db
    .prepare(
      `SELECT
         c.id,
         c.market_slug,
         c.product_slug,
         c.change_type,
         c.title,
         c.summary,
         c.detected_at,
         c.source_url,
         c.review_status,
         ur.triage_outcome,
         ur.review_note,
         ur.reviewed_by,
         ur.reviewed_at,
         ur.seller_alert_eligible,
         ur.requires_rule_update,
         GROUP_CONCAT(DISTINCT i.rule_key) AS impacted_rule_keys,
         GROUP_CONCAT(DISTINCT rr.rule_key) AS reviewed_rule_keys
       FROM rule_changes c
       LEFT JOIN regulatory_update_reviews ur
         ON ur.change_id = c.id
       LEFT JOIN regulatory_change_events e
         ON e.legacy_change_id = c.id
       LEFT JOIN regulatory_change_impacts i
         ON i.change_event_id = e.id
       LEFT JOIN regulatory_update_review_rules rr
         ON rr.review_id = ur.id
       GROUP BY
         c.id,
         c.market_slug,
         c.product_slug,
         c.change_type,
         c.title,
         c.summary,
         c.detected_at,
         c.source_url,
         c.review_status,
         ur.triage_outcome,
         ur.review_note,
         ur.reviewed_by,
         ur.reviewed_at,
         ur.seller_alert_eligible,
         ur.requires_rule_update
       ORDER BY
         CASE
           WHEN ur.triage_outcome IS NULL THEN 0
           WHEN ur.triage_outcome = 'needs_rule_update' THEN 1
           ELSE 2
         END,
         c.detected_at DESC
       LIMIT 100`
    )
    .all<ChangeQueueRow>();

  const items = (result.results || []).map((row) => ({
    ...row,
    impacted_rule_keys: row.impacted_rule_keys
      ? row.impacted_rule_keys.split(",").filter(Boolean).sort()
      : [],
    reviewed_rule_keys: row.reviewed_rule_keys
      ? row.reviewed_rule_keys.split(",").filter(Boolean).sort()
      : [],
    seller_alert_eligible: Boolean(row.seller_alert_eligible),
    requires_rule_update: Boolean(row.requires_rule_update),
  }));

  return NextResponse.json({ ok: true, items });
}

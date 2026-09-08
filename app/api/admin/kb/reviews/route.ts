import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { ensureRegulatoryKnowledgeBase } from "@/lib/regulatory-kb";
import { deriveRuleReviewStatus } from "@/lib/regulatory-review";

function getSecret(name: string) {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

type Row = {
  rule_key: string;
  title: string;
  short_name: string;
  current_version: number;
  last_reviewed_at: string | null;
  reviewed_by: string | null;
  review_origin: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  verified_source_id: string | null;
  verified_source_hash: string | null;
  verification_note: string | null;
  source_id: string | null;
  source_title: string | null;
  source_url: string | null;
  current_source_hash: string | null;
  source_last_checked_at: string | null;
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
  const statusFilter = (url.searchParams.get("status") || "").trim();

  try {
    await ensureDatabaseSchema(db);
    await ensureRegulatoryKnowledgeBase(db);

    const result = await db
      .prepare(
        `SELECT
           r.rule_key,
           r.title,
           r.short_name,
           r.current_version,
           st.last_reviewed_at,
           st.reviewed_by,
           st.review_origin,
           st.last_verified_at,
           st.verified_by,
           st.verified_source_id,
           st.verified_source_hash,
           st.verification_note,
           rs.source_id,
           s.title AS source_title,
           s.url AS source_url,
           s.last_content_hash AS current_source_hash,
           s.last_checked_at AS source_last_checked_at
         FROM regulatory_rules r
         LEFT JOIN regulatory_rule_review_state st
           ON st.rule_key = r.rule_key
          AND st.rule_version = r.current_version
         LEFT JOIN regulatory_rule_sources rs
           ON rs.rule_key = r.rule_key
          AND rs.rule_version = r.current_version
          AND rs.relation_type = 'primary'
          AND rs.is_current = 1
         LEFT JOIN sources s ON s.id = rs.source_id
         WHERE r.is_active = 1
         ORDER BY r.rule_key`
      )
      .all<Row>();

    const items = (result.results || []).map((row) => {
      const status = deriveRuleReviewStatus({
        lastReviewedAt: row.last_reviewed_at,
        reviewedBy: row.reviewed_by,
        reviewOrigin: row.review_origin,
        lastVerifiedAt: row.last_verified_at,
        verifiedBy: row.verified_by,
        verifiedSourceId: row.verified_source_id,
        verifiedSourceHash: row.verified_source_hash,
        currentSourceHash: row.current_source_hash,
        sourceLastCheckedAt: row.source_last_checked_at,
      });

      return {
        ruleKey: row.rule_key,
        title: row.title,
        shortName: row.short_name,
        version: Number(row.current_version),
        status,
        lastReviewedAt: row.last_reviewed_at,
        reviewedBy: row.reviewed_by,
        reviewOrigin: row.review_origin,
        lastVerifiedAt: row.last_verified_at,
        verifiedBy: row.verified_by,
        verificationNote: row.verification_note,
        source: row.source_id
          ? {
              id: row.source_id,
              title: row.source_title,
              url: row.source_url,
              lastCheckedAt: row.source_last_checked_at,
              currentHash: row.current_source_hash,
              verifiedHash: row.verified_source_hash,
            }
          : null,
      };
    });

    const filtered =
      statusFilter && ["unreviewed", "reviewed", "verified", "stale"].includes(statusFilter)
        ? items.filter((item) => item.status === statusFilter)
        : items;

    return NextResponse.json({
      ok: true,
      count: filtered.length,
      statusFilter: statusFilter || null,
      items: filtered,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "REVIEW_STATE_QUERY_FAILED",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

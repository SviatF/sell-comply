import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { ensureRegulatoryKnowledgeBase } from "@/lib/regulatory-kb";
import { ensureKnowledgeCoverage } from "@/lib/regulatory-coverage";

function getSecret(name: string) {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

type CoverageRow = {
  product_slug: string;
  market_slug: string;
  rule_count: number;
  source_covered_rules: number;
  timing_covered_rules: number;
  structured_timing_rules: number;
  reviewed_rules: number;
  manually_reviewed_rules: number;
  verified_rules: number;
  stale_verified_rules: number;
  untriaged_updates: number;
  needs_rule_update: number;
  source_coverage: number;
  timing_coverage: number;
  review_coverage: number;
  verification_coverage: number;
  quality_score: number;
  readiness: string;
  is_indexable: number;
  gaps_json: string;
  computed_at: string;
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
  const readiness = (url.searchParams.get("readiness") || "").trim();
  const market = (url.searchParams.get("market") || "").trim();
  const product = (url.searchParams.get("product") || "").trim();
  const minScore = Math.max(
    0,
    Math.min(100, Number(url.searchParams.get("min_score") || "0") || 0)
  );

  if (
    readiness &&
    !["ready", "partial", "blocked"].includes(readiness)
  ) {
    return NextResponse.json(
      { ok: false, error: "INVALID_READINESS" },
      { status: 400 }
    );
  }

  try {
    await ensureDatabaseSchema(db);
    await ensureRegulatoryKnowledgeBase(db);
    await ensureKnowledgeCoverage(db);

    const result = await db
      .prepare(
        `SELECT
           product_slug,
           market_slug,
           rule_count,
           source_covered_rules,
           timing_covered_rules,
           structured_timing_rules,
           reviewed_rules,
           manually_reviewed_rules,
           verified_rules,
           stale_verified_rules,
           untriaged_updates,
           needs_rule_update,
           source_coverage,
           timing_coverage,
           review_coverage,
           verification_coverage,
           quality_score,
           readiness,
           is_indexable,
           gaps_json,
           computed_at
         FROM regulatory_coverage_snapshots
         WHERE (? = '' OR readiness = ?)
           AND (? = '' OR market_slug = ?)
           AND (? = '' OR product_slug = ?)
           AND quality_score >= ?
         ORDER BY
           CASE readiness
             WHEN 'blocked' THEN 0
             WHEN 'partial' THEN 1
             ELSE 2
           END,
           quality_score ASC,
           market_slug,
           product_slug`
      )
      .bind(
        readiness,
        readiness,
        market,
        market,
        product,
        product,
        minScore
      )
      .all<CoverageRow>();

    const summary = await db
      .prepare(
        `SELECT
           COUNT(*) AS total_pairs,
           SUM(CASE WHEN readiness = 'ready' THEN 1 ELSE 0 END) AS ready_pairs,
           SUM(CASE WHEN readiness = 'partial' THEN 1 ELSE 0 END) AS partial_pairs,
           SUM(CASE WHEN readiness = 'blocked' THEN 1 ELSE 0 END) AS blocked_pairs,
           SUM(CASE WHEN is_indexable = 1 THEN 1 ELSE 0 END) AS indexable_pairs,
           ROUND(AVG(quality_score), 1) AS average_score,
           ROUND(AVG(source_coverage) * 100, 1) AS source_coverage_pct,
           ROUND(AVG(timing_coverage) * 100, 1) AS timing_coverage_pct,
           ROUND(AVG(review_coverage) * 100, 1) AS review_coverage_pct,
           ROUND(AVG(verification_coverage) * 100, 1) AS verification_coverage_pct
         FROM regulatory_coverage_snapshots`
      )
      .first<{
        total_pairs: number;
        ready_pairs: number;
        partial_pairs: number;
        blocked_pairs: number;
        indexable_pairs: number;
        average_score: number;
        source_coverage_pct: number;
        timing_coverage_pct: number;
        review_coverage_pct: number;
        verification_coverage_pct: number;
      }>();

    const items = (result.results || []).map((row) => ({
      productSlug: row.product_slug,
      marketSlug: row.market_slug,
      ruleCount: Number(row.rule_count),
      sourceCoveredRules: Number(row.source_covered_rules),
      timingCoveredRules: Number(row.timing_covered_rules),
      structuredTimingRules: Number(row.structured_timing_rules),
      reviewedRules: Number(row.reviewed_rules),
      manuallyReviewedRules: Number(row.manually_reviewed_rules),
      verifiedRules: Number(row.verified_rules),
      staleVerifiedRules: Number(row.stale_verified_rules),
      untriagedUpdates: Number(row.untriaged_updates),
      needsRuleUpdate: Number(row.needs_rule_update),
      sourceCoverage: Number(row.source_coverage),
      timingCoverage: Number(row.timing_coverage),
      reviewCoverage: Number(row.review_coverage),
      verificationCoverage: Number(row.verification_coverage),
      qualityScore: Number(row.quality_score),
      readiness: row.readiness,
      isIndexable: Boolean(row.is_indexable),
      gaps: JSON.parse(row.gaps_json || "[]"),
      computedAt: row.computed_at,
    }));

    return NextResponse.json({
      ok: true,
      filters: {
        readiness: readiness || null,
        market: market || null,
        product: product || null,
        minScore,
      },
      summary: {
        totalPairs: Number(summary?.total_pairs || 0),
        readyPairs: Number(summary?.ready_pairs || 0),
        partialPairs: Number(summary?.partial_pairs || 0),
        blockedPairs: Number(summary?.blocked_pairs || 0),
        indexablePairs: Number(summary?.indexable_pairs || 0),
        averageScore: Number(summary?.average_score || 0),
        sourceCoveragePct: Number(summary?.source_coverage_pct || 0),
        timingCoveragePct: Number(summary?.timing_coverage_pct || 0),
        reviewCoveragePct: Number(summary?.review_coverage_pct || 0),
        verificationCoveragePct: Number(summary?.verification_coverage_pct || 0),
      },
      count: items.length,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "COVERAGE_QUERY_FAILED",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

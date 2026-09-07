import { NextResponse } from "next/server";
import { databaseState, getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { ensureOfficialSources } from "@/lib/source-bootstrap";
import { getEmailProviderState } from "@/lib/email-provider";
import { ensureRegulatoryKnowledgeBase } from "@/lib/regulatory-kb";

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
    await ensureRegulatoryKnowledgeBase(db);

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

    const pendingChangeCount = await db
      .prepare("SELECT COUNT(*) AS total FROM rule_changes WHERE review_status = 'needs_review'")
      .first<{ total: number }>();

    const queuedAlertCount = await db
      .prepare("SELECT COUNT(*) AS total FROM alert_jobs WHERE status = 'queued'")
      .first<{ total: number }>();

    const sentAlertCount = await db
      .prepare("SELECT COUNT(*) AS total FROM alert_jobs WHERE status = 'sent'")
      .first<{ total: number }>();

    const kbRuleCount = await db
      .prepare("SELECT COUNT(*) AS total FROM regulatory_rules WHERE is_active = 1")
      .first<{ total: number }>();

    const kbVersionCount = await db
      .prepare("SELECT COUNT(*) AS total FROM regulatory_rule_versions")
      .first<{ total: number }>();

    const kbApplicabilityCount = await db
      .prepare("SELECT COUNT(*) AS total FROM regulatory_applicability WHERE is_current = 1")
      .first<{ total: number }>();

    const kbFeatureConditionCount = await db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM regulatory_applicability_features f
         INNER JOIN regulatory_applicability a ON a.id = f.applicability_id
         WHERE a.is_current = 1`
      )
      .first<{ total: number }>();

    const kbCoveredPairCount = await db
      .prepare(
        `SELECT COUNT(*) AS total FROM (
           SELECT market_slug, product_slug
           FROM regulatory_applicability
           WHERE is_current = 1
           GROUP BY market_slug, product_slug
         )`
      )
      .first<{ total: number }>();

    const kbTimingCount = await db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM regulatory_rule_timing t
         INNER JOIN regulatory_rules r
           ON r.rule_key = t.rule_key
          AND r.current_version = t.rule_version
         WHERE r.is_active = 1`
      )
      .first<{ total: number }>();

    const kbStructuredTimingCount = await db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM regulatory_rule_timing t
         INNER JOIN regulatory_rules r
           ON r.rule_key = t.rule_key
          AND r.current_version = t.rule_version
         WHERE r.is_active = 1
           AND (
             t.effective_from IS NOT NULL
             OR t.effective_to IS NOT NULL
             OR t.transition_start IS NOT NULL
             OR t.transition_end IS NOT NULL
           )`
      )
      .first<{ total: number }>();

    return NextResponse.json({
      ok: true,
      d1: "connected",
      schema: version?.value === "8" ? "ready" : "unknown",
      schemaVersion: version?.value || null,
      officialSources: Number(sourceCount?.total || 0),
      monitoredProducts: Number(monitorCount?.total || 0),
      emailSubscribers: Number(subscriberCount?.total || 0),
      pendingChanges: Number(pendingChangeCount?.total || 0),
      queuedAlerts: Number(queuedAlertCount?.total || 0),
      sentAlerts: Number(sentAlertCount?.total || 0),
      regulatoryKbRules: Number(kbRuleCount?.total || 0),
      regulatoryKbVersions: Number(kbVersionCount?.total || 0),
      regulatoryKbApplicability: Number(kbApplicabilityCount?.total || 0),
      regulatoryKbFeatureConditions: Number(kbFeatureConditionCount?.total || 0),
      regulatoryKbCoveredPairs: Number(kbCoveredPairCount?.total || 0),
      regulatoryKbTimingRows: Number(kbTimingCount?.total || 0),
      regulatoryKbStructuredTiming: Number(kbStructuredTimingCount?.total || 0),
      emailProvider: getEmailProviderState(),
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

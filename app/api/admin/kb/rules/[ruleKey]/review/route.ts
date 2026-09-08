import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { ensureRegulatoryKnowledgeBase } from "@/lib/regulatory-kb";
import {
  markRuleReviewed,
  markRuleVerified,
  resetRuleVerification,
} from "@/lib/regulatory-review";

function getSecret(name: string) {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ruleKey: string }> }
) {
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

  const { ruleKey } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: "reviewed" | "verified" | "reset_verification";
    actor?: string;
    note?: string;
  };

  if (!body.action || !["reviewed", "verified", "reset_verification"].includes(body.action)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_ACTION" },
      { status: 400 }
    );
  }

  const actor = (body.actor || "ops-console").trim().slice(0, 120);
  const note = (body.note || "").trim().slice(0, 2000);

  try {
    await ensureDatabaseSchema(db);
    await ensureRegulatoryKnowledgeBase(db);

    const current = await db
      .prepare(
        `SELECT current_version
         FROM regulatory_rules
         WHERE rule_key = ? AND is_active = 1
         LIMIT 1`
      )
      .bind(ruleKey)
      .first<{ current_version: number }>();

    if (!current?.current_version) {
      return NextResponse.json(
        { ok: false, error: "RULE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const version = Number(current.current_version);

    if (body.action === "reviewed") {
      const result = await markRuleReviewed(db, {
        ruleKey,
        ruleVersion: version,
        reviewedBy: actor,
        note,
      });

      return NextResponse.json({
        ok: true,
        action: "reviewed",
        ruleKey,
        version,
        ...result,
      });
    }

    if (body.action === "verified") {
      const result = await markRuleVerified(db, {
        ruleKey,
        ruleVersion: version,
        verifiedBy: actor,
        note,
      });

      return NextResponse.json({
        ok: true,
        action: "verified",
        ruleKey,
        version,
        ...result,
      });
    }

    const result = await resetRuleVerification(db, ruleKey, version);
    return NextResponse.json({
      ok: true,
      action: "reset_verification",
      ruleKey,
      version,
      ...result,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const status =
      detail === "RULE_REVIEW_STATE_NOT_FOUND" ||
      detail === "PRIMARY_SOURCE_NOT_FOUND"
        ? 409
        : 500;

    return NextResponse.json(
      {
        ok: false,
        error: detail,
      },
      { status }
    );
  }
}

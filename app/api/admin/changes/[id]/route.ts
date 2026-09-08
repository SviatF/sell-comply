import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import {
  isRegulatoryTriageOutcome,
  triageRegulatoryChange,
  type RegulatoryTriageOutcome,
} from "@/lib/regulatory-update-review";

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
  { params }: { params: Promise<{ id: string }> }
) {
  const expected = getSecret("ADMIN_TOKEN");
  const supplied = request.headers.get("x-admin-token") || "";

  if (!expected || supplied !== expected) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "D1_NOT_CONFIGURED" }, { status: 503 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    outcome?: string;
    decision?: string;
    note?: string;
    reviewedBy?: string;
    ruleKeys?: string[];
  };

  const legacyMap: Record<string, RegulatoryTriageOutcome> = {
    approved: "requirement_changed",
    rejected: "no_regulatory_change",
  };

  const requestedOutcome =
    body.outcome ||
    (body.decision ? legacyMap[body.decision] : undefined) ||
    "";

  if (!isRegulatoryTriageOutcome(requestedOutcome)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_TRIAGE_OUTCOME" },
      { status: 400 }
    );
  }

  try {
    await ensureDatabaseSchema(db);

    const result = await triageRegulatoryChange(db, id, {
      outcome: requestedOutcome,
      note: body.note,
      reviewedBy: body.reviewedBy,
      ruleKeys: Array.isArray(body.ruleKeys) ? body.ruleKeys : undefined,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REVIEW_FAILED";
    const status = message === "CHANGE_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

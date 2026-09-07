import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { approveChangeAndQueueAlerts, rejectChange } from "@/lib/alert-queue";

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
    decision?: string;
    note?: string;
    reviewedBy?: string;
  };

  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json({ ok: false, error: "INVALID_DECISION" }, { status: 400 });
  }

  try {
    await ensureDatabaseSchema(db);

    if (body.decision === "approved") {
      const result = await approveChangeAndQueueAlerts(db, id, {
        note: body.note,
        reviewedBy: body.reviewedBy,
      });
      return NextResponse.json({ ok: true, decision: "approved", ...result });
    }

    const result = await rejectChange(db, id, {
      note: body.note,
      reviewedBy: body.reviewedBy,
    });
    return NextResponse.json({ ok: true, decision: "rejected", ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REVIEW_FAILED";
    const status = message === "CHANGE_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

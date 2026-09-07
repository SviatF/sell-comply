import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { dispatchQueuedAlerts } from "@/lib/alert-dispatch";
import { getEmailProviderState } from "@/lib/email-provider";

function getSecret(name: string) {
  try {
    const { env } = getCloudflareContext();
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const expected = getSecret("MONITOR_SECRET");
  const supplied = request.headers.get("x-monitor-token") || "";

  if (!expected || supplied !== expected) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "D1_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    await ensureDatabaseSchema(db);
    const result = await dispatchQueuedAlerts(db, 20);
    return NextResponse.json({
      ok: true,
      emailProvider: getEmailProviderState(),
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "ALERT_DISPATCH_FAILED",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

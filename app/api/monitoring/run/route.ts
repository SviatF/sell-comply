import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { monitorOfficialSources } from "@/lib/source-monitor";

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
    const result = await monitorOfficialSources(db, 12);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "MONITOR_RUN_FAILED", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getOptionalDb } from "@/lib/cloudflare-db";
import { ensureDatabaseSchema } from "@/lib/db-schema";
import { ensureRegulatoryKnowledgeBase } from "@/lib/regulatory-kb";
import { getApplicableKnowledgeRules } from "@/lib/regulatory-applicability";

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

  const url = new URL(request.url);
  const marketSlug = (url.searchParams.get("market") || "").trim();
  const productSlug = (url.searchParams.get("product") || "").trim();
  const features = (url.searchParams.get("features") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!marketSlug || !productSlug) {
    return NextResponse.json(
      { ok: false, error: "MARKET_AND_PRODUCT_REQUIRED" },
      { status: 400 }
    );
  }

  const db = getOptionalDb();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "D1_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  try {
    await ensureDatabaseSchema(db);
    await ensureRegulatoryKnowledgeBase(db);

    const rules = await getApplicableKnowledgeRules(db, {
      marketSlug,
      productSlug,
      features,
    });

    return NextResponse.json({
      ok: true,
      query: {
        marketSlug,
        productSlug,
        features,
      },
      count: rules.length,
      rules,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "APPLICABILITY_QUERY_FAILED",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

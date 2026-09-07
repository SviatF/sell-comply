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
  const asOf = (url.searchParams.get("as_of") || "").trim() || undefined;
  const includeNonApplicable = url.searchParams.get("include_all") === "1";

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
      asOf,
      includeNonApplicable,
    });

    return NextResponse.json({
      ok: true,
      query: {
        marketSlug,
        productSlug,
        features,
        asOf: asOf || new Date().toISOString().slice(0, 10),
        includeNonApplicable,
      },
      count: rules.length,
      rules,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error:
          detail === "INVALID_AS_OF_DATE"
            ? "INVALID_AS_OF_DATE"
            : "APPLICABILITY_QUERY_FAILED",
        detail,
      },
      { status: detail === "INVALID_AS_OF_DATE" ? 400 : 500 }
    );
  }
}

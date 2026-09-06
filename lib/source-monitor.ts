import { SellComplyD1 } from "@/lib/cloudflare-db";

type SourceRow = {
  id: string;
  market_slug: string | null;
  title: string;
  url: string;
  last_content_hash: string | null;
};

function normalizePageText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500_000);
}

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function monitorOfficialSources(db: SellComplyD1, limit = 12) {
  const rows = await db
    .prepare(
      `SELECT id, market_slug, title, url, last_content_hash
       FROM sources
       WHERE source_type = 'official'
       ORDER BY COALESCE(last_checked_at, '1970-01-01') ASC
       LIMIT ?`
    )
    .bind(limit)
    .all<SourceRow>();

  const items = rows.results || [];
  const outcomes: Array<{ id: string; changed: boolean; status: number | null }> = [];

  for (const source of items) {
    let status: number | null = null;
    let nextHash: string | null = null;

    try {
      const response = await fetch(source.url, {
        redirect: "follow",
        headers: {
          "user-agent": "SellComply Regulatory Monitor/1.0 (+https://sellcomply.com)",
          accept: "text/html,application/xhtml+xml",
        },
      });
      status = response.status;

      if (response.ok) {
        const html = await response.text();
        const normalized = normalizePageText(html);
        if (normalized.length > 250) nextHash = await sha256(normalized);
      }
    } catch {
      status = null;
    }

    const changed = Boolean(
      nextHash &&
        source.last_content_hash &&
        nextHash !== source.last_content_hash
    );

    await db
      .prepare(
        `UPDATE sources
         SET last_content_hash = COALESCE(?, last_content_hash),
             last_http_status = ?,
             last_checked_at = CURRENT_TIMESTAMP,
             last_verified_at = CASE WHEN ? BETWEEN 200 AND 299 THEN CURRENT_TIMESTAMP ELSE last_verified_at END
         WHERE id = ?`
      )
      .bind(nextHash, status, status, source.id)
      .run();

    if (changed) {
      await db
        .prepare(
          `INSERT INTO rule_changes (
             id, market_slug, change_type, title, summary,
             detected_at, source_url, source_id, review_status
           ) VALUES (?, ?, 'source_updated', ?, ?, CURRENT_TIMESTAMP, ?, ?, 'needs_review')`
        )
        .bind(
          crypto.randomUUID(),
          source.market_slug || "global",
          `Official source updated: ${source.title}`,
          "SellComply detected a meaningful content fingerprint change on an official regulatory source. The change requires review before it is treated as a regulatory requirement change.",
          source.url,
          source.id
        )
        .run();
    }

    outcomes.push({ id: source.id, changed, status });
  }

  await db
    .prepare(
      `UPDATE monitoring_subscriptions
       SET last_checked_at = CURRENT_TIMESTAMP,
           next_check_at = datetime('now', '+1 day'),
           updated_at = CURRENT_TIMESTAMP
       WHERE is_active = 1`
    )
    .run();

  return {
    checked: outcomes.length,
    changed: outcomes.filter((item) => item.changed).length,
    outcomes,
  };
}

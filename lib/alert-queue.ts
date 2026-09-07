import type { SellComplyD1 } from "@/lib/cloudflare-db";

type ChangeRow = {
  id: string;
  market_slug: string;
  product_slug: string | null;
  title: string;
  summary: string | null;
  source_url: string | null;
};

type RecipientRow = {
  monitor_id: string;
  subscriber_id: string;
  raw_product: string;
  market_name: string;
  marketplace_name: string | null;
  email: string;
};

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value).slice(0, 5000);
  } catch {
    return "{}";
  }
}

export async function approveChangeAndQueueAlerts(
  db: SellComplyD1,
  changeId: string,
  options: { note?: string; reviewedBy?: string } = {}
) {
  const change = await db
    .prepare(
      `SELECT id, market_slug, product_slug, title, summary, source_url
       FROM rule_changes
       WHERE id = ?
       LIMIT 1`
    )
    .bind(changeId)
    .first<ChangeRow>();

  if (!change) throw new Error("CHANGE_NOT_FOUND");

  await db
    .prepare(
      `INSERT INTO change_reviews (
        id, change_id, decision, review_note, reviewed_by, reviewed_at
      ) VALUES (?, ?, 'approved', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(change_id) DO UPDATE SET
        decision = 'approved',
        review_note = excluded.review_note,
        reviewed_by = excluded.reviewed_by,
        reviewed_at = CURRENT_TIMESTAMP`
    )
    .bind(
      crypto.randomUUID(),
      changeId,
      options.note || null,
      options.reviewedBy || "admin"
    )
    .run();

  await db
    .prepare("UPDATE rule_changes SET review_status = 'approved' WHERE id = ?")
    .bind(changeId)
    .run();

  const recipients = await db
    .prepare(
      `SELECT
         m.id AS monitor_id,
         es.id AS subscriber_id,
         m.raw_product,
         m.market_name,
         m.marketplace_name,
         es.email
       FROM monitoring_subscriptions m
       INNER JOIN monitoring_recipients mr
         ON mr.monitor_id = m.id
        AND mr.channel = 'email'
        AND mr.is_active = 1
       INNER JOIN email_subscribers es
         ON es.id = mr.subscriber_id
        AND es.status = 'active'
       WHERE m.is_active = 1
         AND m.market_slug = ?
         AND (? IS NULL OR m.product_slug = ?)`
    )
    .bind(change.market_slug, change.product_slug, change.product_slug)
    .all<RecipientRow>();

  let queued = 0;

  for (const recipient of recipients.results || []) {
    const subject = `Compliance update for ${recipient.raw_product} in ${recipient.market_name}`;

    const payload = {
      rawProduct: recipient.raw_product,
      marketName: recipient.market_name,
      marketplaceName: recipient.marketplace_name,
      email: recipient.email,
      changeTitle: change.title,
      changeSummary: change.summary,
      sourceUrl: change.source_url,
    };

    await db
      .prepare(
        `INSERT INTO alert_jobs (
          id, change_id, monitor_id, subscriber_id,
          status, subject, payload_json, created_at
        ) VALUES (?, ?, ?, ?, 'queued', ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(change_id, monitor_id, subscriber_id) DO NOTHING`
      )
      .bind(
        crypto.randomUUID(),
        changeId,
        recipient.monitor_id,
        recipient.subscriber_id,
        subject,
        safeJson(payload)
      )
      .run();

    queued += 1;
  }

  return { queued };
}

export async function rejectChange(
  db: SellComplyD1,
  changeId: string,
  options: { note?: string; reviewedBy?: string } = {}
) {
  const exists = await db
    .prepare("SELECT id FROM rule_changes WHERE id = ? LIMIT 1")
    .bind(changeId)
    .first<{ id: string }>();

  if (!exists) throw new Error("CHANGE_NOT_FOUND");

  await db
    .prepare(
      `INSERT INTO change_reviews (
        id, change_id, decision, review_note, reviewed_by, reviewed_at
      ) VALUES (?, ?, 'rejected', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(change_id) DO UPDATE SET
        decision = 'rejected',
        review_note = excluded.review_note,
        reviewed_by = excluded.reviewed_by,
        reviewed_at = CURRENT_TIMESTAMP`
    )
    .bind(
      crypto.randomUUID(),
      changeId,
      options.note || null,
      options.reviewedBy || "admin"
    )
    .run();

  await db
    .prepare("UPDATE rule_changes SET review_status = 'rejected' WHERE id = ?")
    .bind(changeId)
    .run();

  return { rejected: true };
}

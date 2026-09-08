import type { SellComplyD1 } from "@/lib/cloudflare-db";
import { syncChangeReviewDecision } from "@/lib/regulatory-change-history";

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
};

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value).slice(0, 5000);
  } catch {
    return "{}";
  }
}

export async function queueAlertsForChange(
  db: SellComplyD1,
  changeId: string,
  options: { ruleKeys?: string[] } = {}
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

  const historyEvent = await db
    .prepare(
      `SELECT id
       FROM regulatory_change_events
       WHERE legacy_change_id = ?
       ORDER BY detected_at DESC
       LIMIT 1`
    )
    .bind(changeId)
    .first<{ id: string }>();

  let recipients;

  if (historyEvent?.id) {
    const selectedRules = [...new Set(options.ruleKeys || [])].filter(Boolean);
    const ruleFilter = selectedRules.length
      ? ` AND i.rule_key IN (${selectedRules.map(() => "?").join(",")})`
      : "";

    recipients = await db
      .prepare(
        `SELECT DISTINCT
           m.id AS monitor_id,
           es.id AS subscriber_id,
           m.raw_product,
           m.market_name,
           m.marketplace_name
         FROM monitoring_subscriptions m
         INNER JOIN monitoring_recipients mr
           ON mr.monitor_id = m.id
          AND mr.channel = 'email'
          AND mr.is_active = 1
         INNER JOIN email_subscribers es
           ON es.id = mr.subscriber_id
          AND es.status = 'active'
         INNER JOIN regulatory_change_impacts i
           ON i.change_event_id = ?
          AND i.impact_phase = 'detected'
          AND i.market_slug = m.market_slug
          AND i.product_slug = m.product_slug
         WHERE m.is_active = 1
         ${ruleFilter}`
      )
      .bind(historyEvent.id, ...selectedRules)
      .all<RecipientRow>();
  } else {
    recipients = await db
      .prepare(
        `SELECT
           m.id AS monitor_id,
           es.id AS subscriber_id,
           m.raw_product,
           m.market_name,
           m.marketplace_name
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
  }

  let queued = 0;

  for (const recipient of recipients.results || []) {
    const subject = `Compliance update for ${recipient.raw_product} in ${recipient.market_name}`;

    const payload = {
      rawProduct: recipient.raw_product,
      marketName: recipient.market_name,
      marketplaceName: recipient.marketplace_name,
      changeTitle: change.title,
      changeSummary: change.summary,
      sourceUrl: change.source_url,
    };

    const existingJob = await db
      .prepare(
        `SELECT id FROM alert_jobs
         WHERE change_id = ? AND monitor_id = ? AND subscriber_id = ?
         LIMIT 1`
      )
      .bind(changeId, recipient.monitor_id, recipient.subscriber_id)
      .first<{ id: string }>();

    if (!existingJob?.id) {
      await db
        .prepare(
          `INSERT INTO alert_jobs (
            id, change_id, monitor_id, subscriber_id,
            status, subject, payload_json, created_at
          ) VALUES (?, ?, ?, ?, 'queued', ?, ?, CURRENT_TIMESTAMP)`
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
  }

  return { queued };
}

export async function approveChangeAndQueueAlerts(
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

  await syncChangeReviewDecision(db, {
    legacyChangeId: changeId,
    decision: "approved",
    reviewedBy: options.reviewedBy,
    reviewNote: options.note,
  });

  return queueAlertsForChange(db, changeId);
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

  await syncChangeReviewDecision(db, {
    legacyChangeId: changeId,
    decision: "rejected",
    reviewedBy: options.reviewedBy,
    reviewNote: options.note,
  });

  return { rejected: true };
}

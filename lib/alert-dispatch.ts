import type { SellComplyD1 } from "@/lib/cloudflare-db";
import { getSiteUrl, sendEmail } from "@/lib/email-provider";

type AlertJob = {
  id: string;
  subject: string;
  payload_json: string | null;
  subscriber_id: string;
  email: string;
};

type Payload = {
  rawProduct?: string;
  marketName?: string;
  marketplaceName?: string | null;
  changeTitle?: string;
  changeSummary?: string | null;
  sourceUrl?: string | null;
};

async function getOrCreateUnsubscribeToken(db: SellComplyD1, subscriberId: string) {
  const existing = await db
    .prepare("SELECT token FROM unsubscribe_tokens WHERE subscriber_id = ? LIMIT 1")
    .bind(subscriberId)
    .first<{ token: string }>();

  if (existing?.token) return existing.token;

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

  await db
    .prepare(
      `INSERT INTO unsubscribe_tokens (id, subscriber_id, token)
       VALUES (?, ?, ?)
       ON CONFLICT(subscriber_id) DO NOTHING`
    )
    .bind(crypto.randomUUID(), subscriberId, token)
    .run();

  const created = await db
    .prepare("SELECT token FROM unsubscribe_tokens WHERE subscriber_id = ? LIMIT 1")
    .bind(subscriberId)
    .first<{ token: string }>();

  if (!created?.token) throw new Error("UNSUBSCRIBE_TOKEN_FAILED");
  return created.token;
}

function safeExternalUrl(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmail(payload: Payload, unsubscribeUrl: string) {
  const product = payload.rawProduct || "your product";
  const market = payload.marketName || "your market";
  const title = payload.changeTitle || "Compliance source updated";
  const summary = payload.changeSummary || "SellComply detected and reviewed a compliance-related update.";
  const marketplace = payload.marketplaceName ? ` · ${payload.marketplaceName}` : "";
  const sourceUrl = safeExternalUrl(payload.sourceUrl);

  const text = [
    "SellComply compliance alert",
    "",
    `${product} · ${market}${marketplace}`,
    "",
    title,
    summary,
    "",
    sourceUrl ? `Official source: ${sourceUrl}` : "",
    "",
    "This is compliance intelligence, not legal advice.",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].filter(Boolean).join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;background:#08080a;color:#f6f6f7;padding:32px">
    <div style="max-width:640px;margin:auto">
      <div style="font-size:12px;letter-spacing:.12em;color:#ff72b4;font-weight:700">SELLCOMPLY ALERT</div>
      <h1 style="font-size:30px;line-height:1.1;margin:16px 0 8px">Compliance update detected</h1>
      <p style="color:#a6a6af;line-height:1.6">${escapeHtml(product)} · ${escapeHtml(market)}${escapeHtml(marketplace)}</p>
      <div style="margin:28px 0;padding:22px;border:1px solid #2a2a30;border-radius:16px;background:#101014">
        <h2 style="font-size:18px;margin:0 0 10px">${escapeHtml(title)}</h2>
        <p style="color:#b7b7bf;line-height:1.65;margin:0">${escapeHtml(summary)}</p>
      </div>
      ${sourceUrl ? `<p><a href="${sourceUrl}" style="color:#ff72b4">Open official source →</a></p>` : ""}
      <p style="margin-top:30px;color:#666671;font-size:12px;line-height:1.6">SellComply provides compliance intelligence and workflow guidance, not legal advice or certification.</p>
      <p style="margin-top:18px"><a href="${unsubscribeUrl}" style="color:#777781;font-size:11px">Unsubscribe from SellComply alerts</a></p>
    </div>
  </div>`;

  return { html, text };
}

export async function dispatchQueuedAlerts(db: SellComplyD1, limit = 20) {
  const rows = await db
    .prepare(
      `SELECT
         j.id, j.subject, j.payload_json, j.subscriber_id, es.email
       FROM alert_jobs j
       INNER JOIN email_subscribers es
         ON es.id = j.subscriber_id
        AND es.status = 'active'
       WHERE (
         j.status = 'queued'
         OR (j.status = 'failed' AND j.attempts < 3)
       )
       ORDER BY j.created_at ASC
       LIMIT ?`
    )
    .bind(limit)
    .all<AlertJob>();

  let sent = 0;
  let failed = 0;
  let deferred = 0;

  for (const job of rows.results || []) {
    let payload: Payload = {};
    try {
      payload = JSON.parse(job.payload_json || "{}") as Payload;
    } catch {
      payload = {};
    }

    const token = await getOrCreateUnsubscribeToken(db, job.subscriber_id);
    const unsubscribeUrl = `${getSiteUrl()}/unsubscribe/${token}`;
    const rendered = renderEmail(payload, unsubscribeUrl);

    const result = await sendEmail({
      to: job.email,
      subject: job.subject,
      html: rendered.html,
      text: rendered.text,
    });

    if (!result.ok && result.error === "EMAIL_PROVIDER_NOT_CONFIGURED") {
      deferred += 1;
      continue;
    }

    if (!result.ok) {
      await db
        .prepare(
          `UPDATE alert_jobs
           SET status = 'failed',
               attempts = attempts + 1,
               provider = ?,
               last_error = ?
           WHERE id = ?`
        )
        .bind(result.provider, result.error || "SEND_FAILED", job.id)
        .run();
      failed += 1;
      continue;
    }

    await db
      .prepare(
        `UPDATE alert_jobs
         SET status = 'sent',
             attempts = attempts + 1,
             provider = ?,
             provider_message_id = ?,
             last_error = NULL,
             sent_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(result.provider, result.messageId || null, job.id)
      .run();

    sent += 1;
  }

  return { processed: (rows.results || []).length, sent, failed, deferred };
}

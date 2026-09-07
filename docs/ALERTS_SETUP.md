# SellComply alert delivery

SellComply's alert pipeline is fully implemented but intentionally remains dormant until the required secrets are configured.

## Cloudflare Worker secrets

Configure these secrets on the deployed Worker:

- `ADMIN_TOKEN` — protects the internal regulatory review API and test email endpoint.
- `MONITOR_SECRET` — protects scheduled monitor and alert-dispatch endpoints.
- `RESEND_API_KEY` — transactional email provider API key.
- `ALERT_FROM_EMAIL` — verified sender, e.g. `SellComply <alerts@sellcomply.com>`.
- `SITE_URL` — public origin used for unsubscribe links, e.g. `https://sellcomply.com`.

Never commit secret values.

## GitHub repository secrets

The daily workflow `.github/workflows/monitor.yml` uses:

- `APP_URL` — deployed SellComply origin.
- `MONITOR_SECRET` — the same secret configured in Cloudflare.

Legacy `MONITOR_URL` is still accepted as a fallback.

## Daily flow

1. GitHub Actions calls `POST /api/monitoring/run`.
2. SellComply fingerprints curated official regulator pages.
3. A changed source creates a `rule_changes` row with `needs_review`.
4. No seller email is sent automatically.
5. Open `/ops/review`, enter `ADMIN_TOKEN`, inspect the official source and approve or reject the change.
6. Approval queues alerts only for matching active product monitors and active email recipients.
7. GitHub Actions calls `POST /api/alerts/run`.
8. If the email provider is configured, alerts are sent. If not, jobs remain queued.
9. Failed provider deliveries retry up to three times.
10. Every alert contains an unsubscribe link.

## Internal review console

URL:

`/ops/review`

The token is entered by the operator and stored only in browser `sessionStorage`.

## Test email

Once the sender is configured:

```bash
curl -X POST \
  -H "content-type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"email":"you@example.com"}' \
  https://sellcomply.com/api/admin/email/test
```

## Health

`GET /api/health`

The response exposes counts only and never subscriber addresses:

- D1 connectivity
- schema version
- official source count
- monitored product count
- active subscriber count
- pending review count
- queued alert count
- sent alert count
- whether the email provider is configured

## Safety model

A regulator website edit is not automatically a regulatory change.

The required sequence is:

`source updated → needs_review → approved/rejected → alert queued → delivered`

This review gate protects sellers from false alerts caused by navigation, formatting, cookie-banner or other non-regulatory page edits.

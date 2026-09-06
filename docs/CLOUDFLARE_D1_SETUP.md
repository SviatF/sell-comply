# SellComply — Cloudflare D1 activation

The application works local-first without D1. Connecting D1 turns saved checks, monitoring, regulatory changes and funnel events into persistent cloud data.

## 1. Create the database

```bash
npx wrangler d1 create sell-comply-db
```

Cloudflare will return a `database_id`.

## 2. Add the binding to wrangler.jsonc

Add this top-level property:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "sell-comply-db",
    "database_id": "PASTE_DATABASE_ID_HERE",
    "migrations_dir": "migrations"
  }
]
```

The application expects the binding name to be exactly `DB`.

## 3. Apply migrations

```bash
npx wrangler d1 migrations apply sell-comply-db --remote
```

Current migrations:

- `0001_product_core.sql` — users, checks, monitoring, requirements, sources, rule changes
- `0002_source_monitoring.sql` — source fingerprints and monitoring fields
- `0003_events.sql` — first-party funnel events

## 4. Add Worker secrets

Generate two long random values and configure:

```bash
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put MONITOR_SECRET
```

Never commit these values.

## 5. Deploy

```bash
npm run build:cloudflare
npx wrangler deploy
```

## 6. Seed official regulator sources

After deployment:

```bash
curl -X POST \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  https://sellcomply.com/api/admin/bootstrap
```

This seeds only official regulator URLs already curated in SellComply market data.

## 7. Enable free scheduled monitoring via GitHub Actions

Repository workflow: `.github/workflows/monitor.yml`

Add GitHub repository secrets:

- `MONITOR_URL` = `https://sellcomply.com/api/monitoring/run`
- `MONITOR_SECRET` = the same value configured in Cloudflare

If the secrets are absent, the workflow exits safely and does nothing.

The workflow runs once per day. It checks official source fingerprints and records a `source_updated` event when content changes. A source fingerprint change is **not** automatically treated as a legal requirement change; it is put into `needs_review` status.

## Safety model

SellComply monitoring intentionally separates:

1. **Official source changed**
2. **Change reviewed**
3. **Requirement updated**

This prevents a website content edit from being presented to sellers as a confirmed regulatory change without review.

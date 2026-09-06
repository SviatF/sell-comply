# SellComply — Cloudflare D1

## Production database

- Database: `sell-comply-db`
- Binding: `DB`
- Database ID: `15c02f17-c27a-45b3-a543-637685c90c4c`

The binding is configured in `wrangler.jsonc`.

## Automatic schema bootstrap

SellComply does **not** require a manual SQL step for a new empty database.

The first request to a database-backed endpoint runs the idempotent schema bootstrap in:

`lib/db-schema.ts`

It creates the current schema and stores:

`schema_meta.schema_version = 3`

The health endpoint also initializes the database:

`GET /api/health`

Expected healthy response:

```json
{
  "ok": true,
  "d1": "connected",
  "schema": "ready",
  "schemaVersion": "3",
  "officialSources": 1
}
```

The exact official source count can grow as markets are added.

## Historical migrations

The files under `migrations/` document the evolution of the schema. Do not manually apply migrations 0001–0003 to a database that has already been initialized by the application bootstrap.

Future production schema changes should be implemented through a versioned, idempotent update to `lib/db-schema.ts`.

## Official sources

The first health check or first monitored-product save seeds curated official regulator URLs into D1 automatically.

A page fetch does **not** count as human verification. SellComply keeps:

- source checked
- source changed
- requirement reviewed

as separate states.

## Regulatory monitor

The scheduled GitHub workflow is:

`.github/workflows/monitor.yml`

To activate daily checks later, configure:

- Cloudflare secret: `MONITOR_SECRET`
- GitHub secret: `MONITOR_SECRET`
- GitHub secret: `MONITOR_URL=https://sellcomply.com/api/monitoring/run`

If these secrets are not configured, the workflow exits safely without cost or errors.

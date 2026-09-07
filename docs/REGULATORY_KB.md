# SellComply Regulatory Knowledge Base

## Purpose

The Regulatory Knowledge Base is the durable data layer behind SellComply's checker and future programmatic SEO system.

The checker currently continues to read the rule-pack source in code while the D1 knowledge layer is built and verified in parallel.

## Schema version 6

### regulatory_rules

One current pointer per logical rule:

- `rule_key`
- title
- short name
- regulatory group
- current version
- current content hash
- active/inactive status
- timestamps

### regulatory_rule_versions

Immutable version history for each rule:

- rule key
- version number
- content fingerprint
- applicability status
- summary
- why-it-applies text
- documents
- labels
- actions
- raw market/product/feature scope
- official source label and URL
- transition note
- last verified date
- creation timestamp

## Versioning behaviour

A rule's current content is fingerprinted with SHA-256.

- New rule → version 1.
- Unchanged rule → no new version.
- Changed rule → next version.
- Deliberate revert to an older content state → still creates a new version.
- Removed rule → current pointer is marked inactive; history remains.

Old versions are never overwritten.

## Automatic sync

`ensureRegulatoryKnowledgeBase()` compares the deployed rule-set fingerprint with the D1 sync fingerprint.

If they differ, SellComply synchronizes the rule set and creates only the versions that changed.

The health endpoint triggers this after schema bootstrap.

## Health

`GET /api/health` exposes counts only:

- `regulatoryKbRules`
- `regulatoryKbVersions`

No private seller data is exposed.

## Current migration strategy

The production database uses idempotent application-managed schema bootstrap. SQL migrations in `/migrations` remain historical documentation and should not be manually replayed against an already bootstrapped production database unless the migration strategy is intentionally changed.

## Next normalization step

Raw scope is currently preserved inside each immutable rule version.

The next KB phase normalizes:

`rule/version × market × product × required feature × exclusion`

into queryable applicability records so the checker, SEO pages and coverage metrics can all use the same structured knowledge graph.

# SellComply Regulatory Knowledge Base

Timing query status: production-ready.

Current implementation status: applicability graph and regulatory timing are complete. Next phase: official source registry.

## Purpose

The Regulatory Knowledge Base is the durable data layer behind SellComply's checker and future programmatic SEO system.

The checker currently continues to read the rule-pack source in code while the D1 knowledge layer is built and verified in parallel.

## Schema version 8

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

### regulatory_applicability

Materialized, queryable product-market scope for the current rule graph:

- rule key
- rule version
- market slug
- product slug
- applicability status
- feature match mode
- current/inactive flag

Broad rules are expanded across the current SellComply product taxonomy. Explicit product scopes remain narrow. Excluded products are omitted.

### regulatory_applicability_features

Normalized feature conditions attached to applicability rows:

- applicability row
- feature key
- required value

Example:

`eu-red v1 × germany × wireless-headphones → required`

with:

`radio = true`

## Applicability sync

Every KB sync also materializes the current applicability graph.

The KB fingerprint includes:

- regulatory rule content
- current product taxonomy
- applicability-model version

This means adding a new product category can expand broad regulatory rules without editing each rule manually.

Old version-specific applicability rows remain available as history but are marked non-current when a new rule version becomes current.

### regulatory_rule_timing

Structured timing metadata is version-specific and stored separately from applicability:

- rule key
- rule version
- effective from
- effective to
- transition start
- transition end
- timing note

SellComply derives a runtime lifecycle for any `as_of` date:

- `future`
- `active`
- `transitional`
- `expired`

Only `active` and `transitional` rules are returned by default from applicability queries.

Examples currently structured:

- EU GPSR: effective from 2024-12-13
- EU Batteries Regulation: effective from 2024-02-18 with phased transitional timing
- current EU Toy Safety Directive: current through 2030-07-31, then transitional legacy treatment
- Regulation (EU) 2025/2509: transition period before general application from 2030-08-01

## Time-aware applicability queries

The internal D1 query accepts:

`as_of=YYYY-MM-DD`

and evaluates the lifecycle for that date.

Use:

`include_all=1`

to inspect future and expired rules as well as currently applicable ones.

## Direct knowledge query

The internal protected endpoint can query the D1 graph directly:

`GET /api/admin/kb/applicability?market=germany&product=wireless-headphones&features=radio,battery`

It requires `x-admin-token`.

The response contains only current rules whose required feature conditions are satisfied.

## Health coverage

`GET /api/health` additionally reports:

- `regulatoryKbApplicability`
- `regulatoryKbFeatureConditions`
- `regulatoryKbCoveredPairs`

These counts describe the current normalized knowledge graph.

## Next KB step

Normalize the official source registry so every current rule version is linked to a canonical regulator/source record with verification and monitoring metadata.

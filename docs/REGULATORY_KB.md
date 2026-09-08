# SellComply Regulatory Knowledge Base

Coverage quality gate status: production-ready.

Requirement change history status: production-ready.

Official source registry status: production-ready.

Timing query status: production-ready.

Current implementation status: the Regulatory Knowledge Base foundation is complete, including applicability, timing, source provenance, review/verification metadata, change history, human triage, and product-market coverage quality gates.

## Purpose

The Regulatory Knowledge Base is the durable data layer behind SellComply's checker and future programmatic SEO system.

The checker currently continues to read the rule-pack source in code while the D1 knowledge layer is built and verified in parallel.

## Schema version 13

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

### regulatory_source_registry

The existing `sources` table remains SellComply's single source identity and monitoring store.

The registry layer adds canonical metadata without duplicating source-monitor state:

- canonical URL
- canonical host
- authority slug/name
- jurisdiction
- source kind
- primary-source flag

Known regulator families are normalized, including:

- EUR-Lex / European Union
- U.S. CPSC
- U.S. FCC
- U.S. FDA
- U.S. PHMSA
- GOV.UK
- Health Canada
- ISED Canada
- ACMA
- ACCC Product Safety

### regulatory_source_markets

Maps one canonical source to one or more SellComply markets.

This is important for EU sources that cover multiple Member State pages such as Germany and France.

### regulatory_rule_sources

Version-specific provenance link:

`rule_key × rule_version → source_id`

Current rule versions keep `is_current = 1`; old version links remain as history.

Every rule currently has one primary source, but the model supports multiple source relations later.

## Source canonicalization

Official URLs are normalized before registry identity is created:

- fragments removed
- tracking parameters removed
- query parameters sorted
- non-root trailing slashes normalized
- host lower-cased

Meaningful query parameters are preserved.

## Source monitoring integration

The registry does not create a separate monitoring system.

Canonical sources continue to use `sources` for:

- last checked time
- HTTP status
- content fingerprint
- last verified time
- source-change monitoring

New rule sources automatically become monitorable because they are inserted into the same official `sources` catalog.

## Source registry query

Protected internal endpoint:

`GET /api/admin/kb/sources`

Optional filters:

- `authority=<authority_slug>`
- `market=<market_slug>`

The response includes source authority, source kind, market scope, last checked, last verified, content hash, HTTP status, and current rule-link count.

### regulatory_rule_review_state

Review and verification are explicit version-specific metadata.

SellComply deliberately separates:

1. automated source check
2. rule review
3. rule verification

Stored fields include:

- last reviewed at
- reviewed by
- review origin
- last verified at
- verified by
- verified source id
- verified source content hash
- verification note

A newly created rule version is never automatically marked verified.

Existing curated rule-pack dates are imported only as curation/review metadata, not as human verification.

## Verification freshness

When a rule is explicitly verified, SellComply captures the current official-source content fingerprint.

Derived states:

- `unreviewed`
- `reviewed`
- `verified`
- `stale`

A verified rule becomes `stale` automatically when the monitored canonical source later has a different content fingerprint.

A routine source check with the same fingerprint does not invalidate verification.

## Protected review APIs

List current rule review states:

`GET /api/admin/kb/reviews`

Optional filter:

`?status=unreviewed|reviewed|verified|stale`

Mark the current version of a rule reviewed or verified:

`POST /api/admin/kb/rules/<rule-key>/review`

Supported actions:

- `reviewed`
- `verified`
- `reset_verification`

All endpoints require `x-admin-token`.

## Health verification coverage

`GET /api/health` reports:

- `regulatoryKbReviewedRules`
- `regulatoryKbManuallyReviewedRules`
- `regulatoryKbVerifiedRules`
- `regulatoryKbStaleVerifiedRules`

These metrics never treat a simple HTTP fetch as human verification.

### regulatory_change_events

SellComply stores a durable regulatory change timeline rather than reconstructing history from logs.

Event types currently include:

- `source_fingerprint_changed`
- `rule_version_created`

A source-change event stores:

- source id
- previous source fingerprint
- new source fingerprint
- detection timestamp
- review decision / reviewer / note when reviewed

A rule-version event stores:

- rule key
- from version
- to version
- changed fields
- effective-from date for the new version
- canonical source link

Source fingerprint changes remain explicitly described as source-content changes until human review confirms regulatory significance.

### regulatory_change_impacts

Each change event snapshots affected applicability rows:

- rule key
- rule version
- market
- product
- applicability status
- required feature conditions
- phase

Impact phases:

- `detected` — current applicability when a source change was detected
- `before` — applicability before a rule-version change
- `after` — applicability after a rule-version change

This lets SellComply answer which product-market combinations were affected at the time of a change even if the current KB changes later.

## Version diffs

When a rule changes from `vN → vN+1`, SellComply records exactly which structured fields changed, including:

- status
- summary
- rationale
- documents
- labels
- actions
- markets
- products
- feature conditions
- exclusions
- official source
- effective dates
- transition notes

## Change review linkage

The existing source-change review workflow remains compatible.

Approve/reject decisions are written back to the matching history event with:

- decision
- reviewed by
- review note
- reviewed at

This preserves one connected timeline from detection through review.

## Protected change-history query

Internal endpoint:

`GET /api/admin/kb/history`

Supported filters:

- `rule=<rule-key>`
- `source=<source-id>`
- `market=<market-slug>`
- `product=<product-slug>`
- `event_type=<event-type>`
- `decision=approved|rejected`
- `limit=1..100`

The response includes source/rule metadata, hashes, version transition, changed fields, effective date, review state, affected markets/products, and impact count.

## Change-history health

`GET /api/health` reports:

- `regulatoryKbChangeEvents`
- `regulatoryKbSourceChangeEvents`
- `regulatoryKbRuleVersionChangeEvents`
- `regulatoryKbChangeImpacts`
- `regulatoryKbReviewedChangeEvents`

### regulatory_update_reviews

Detected source changes now use an explicit human regulatory triage workflow instead of binary approve/reject.

Supported outcomes:

- `no_regulatory_change`
- `informational`
- `requirement_changed`
- `needs_rule_update`

Stored review metadata includes:

- triage outcome
- seller-alert eligibility
- requires-rule-update flag
- reviewer note
- reviewed by
- reviewed at

Only `requirement_changed` is seller-alert eligible.

`needs_rule_update` explicitly blocks alerts until the knowledge-base rule is updated and reviewed again.

### regulatory_update_review_rules

Human review can confirm the exact rule keys affected by a detected source update.

Rule relations include:

- `reviewed_no_change`
- `informational`
- `confirmed_affected`
- `update_required`

Seller alerts for confirmed requirement changes are scoped to the reviewer-confirmed rule impacts rather than every rule linked to the source.

## Operations triage console

`/ops/review` now provides:

- affected rule selection
- regulatory outcome
- reviewer note
- explicit alert consequence
- rule-update blocking state
- previous review metadata

A source fingerprint change is never presented as proof of a legal requirement change.

## Backward compatibility

Legacy API requests using:

- `approved`
- `rejected`

are mapped to:

- `requirement_changed`
- `no_regulatory_change`

The new operations UI uses only the explicit four-state regulatory model.

## Triage health

`GET /api/health` reports:

- `regulatoryKbUntriagedUpdates`
- `regulatoryKbNoRegulatoryChange`
- `regulatoryKbInformationalUpdates`
- `regulatoryKbRequirementChanges`
- `regulatoryKbNeedsRuleUpdate`

### regulatory_coverage_snapshots

SellComply materializes one quality snapshot per current:

`product × market`

For the current taxonomy this produces 48 coverage pairs.

Each snapshot contains:

- current rule count
- official-source provenance coverage
- lifecycle/timing coverage
- structured timing count
- fresh review coverage
- fresh manual-review count
- fresh explicit verification coverage
- stale verified-rule count
- untriaged regulatory-update count
- pending rule-update count
- deterministic quality score
- readiness
- indexability gate
- explicit gap codes
- computed timestamp

## Coverage quality score

The score is deterministic and never generated by AI.

Weights:

- regulatory rules: 25
- official source provenance: 25
- timing/lifecycle metadata: 15
- fresh review metadata: 20
- fresh explicit verification: 15

Review and verification freshness currently use a 180-day window.

Verification counts toward coverage only when:

- the rule was explicitly verified
- a source fingerprint was captured
- the captured fingerprint still matches the current monitored source fingerprint

## Coverage readiness

Derived readiness states:

- `ready`
- `partial`
- `blocked`

A pair is blocked by critical trust gaps such as:

- no regulatory rules
- missing official-source provenance
- stale verified rule
- untriaged source update
- pending KB rule update

A pair is `ready` only when the critical blockers are clear and source/timing/review/verification coverage is complete.

Only `ready` pairs receive:

`is_indexable = 1`

This is an internal quality gate for future programmatic SEO expansion. It does not automatically change existing page robots metadata yet.

## Coverage refresh

Coverage snapshots refresh after:

- full regulatory KB sync
- rule review
- rule verification/reset
- regulatory update triage
- official-source monitoring

A safety refresh also runs when the matrix is incomplete or older than one hour.

## Protected coverage matrix

Internal endpoint:

`GET /api/admin/kb/coverage`

Supported filters:

- `readiness=ready|partial|blocked`
- `market=<market-slug>`
- `product=<product-slug>`
- `min_score=0..100`

The response includes a global summary plus pair-level quality metrics and explicit gaps.

## Coverage health

`GET /api/health` reports:

- `regulatoryKbCoveragePairs`
- `regulatoryKbReadyPairs`
- `regulatoryKbPartialPairs`
- `regulatoryKbBlockedPairs`
- `regulatoryKbIndexablePairs`
- `regulatoryKbAverageCoverageScore`

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

## Regulatory KB phase status

The P0 Regulatory Knowledge Base phase is complete.

The next roadmap phase is Core UX. Coverage readiness will later be wired into the SEO quality gate before large-scale programmatic page expansion.

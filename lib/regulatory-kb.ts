import type { SellComplyD1 } from "@/lib/cloudflare-db";
import { regulatoryRules, type RegulatoryRule } from "@/lib/regulatory-rules";
import { products } from "@/lib/seo-data";
import { syncRuleApplicability } from "@/lib/regulatory-applicability";
import { syncRuleTiming } from "@/lib/regulatory-timing";
import {
  syncExistingOfficialSourcesToRegistry,
  syncRuleSourceRegistry,
} from "@/lib/regulatory-source-registry";
import { ensureRuleReviewState } from "@/lib/regulatory-review";
import { recordRuleVersionChange } from "@/lib/regulatory-change-history";
import { syncKnowledgeCoverage } from "@/lib/regulatory-coverage";

const APPLICABILITY_MODEL_VERSION = 1;
const SOURCE_REGISTRY_MODEL_VERSION = 1;

type CurrentRuleRow = {
  rule_key: string;
  current_version: number;
  current_hash: string;
  is_active: number;
};

function stablePayload(rule: RegulatoryRule) {
  return JSON.stringify({
    id: rule.id,
    title: rule.title,
    shortName: rule.shortName,
    group: rule.group,
    markets: rule.markets,
    products: rule.products ?? null,
    requiresFeatures: rule.requiresFeatures ?? null,
    excludesProducts: rule.excludesProducts ?? null,
    status: rule.status,
    summary: rule.summary,
    why: rule.why,
    documents: rule.documents,
    labels: rule.labels,
    actions: rule.actions,
    source: rule.source,
    lastVerified: rule.lastVerified,
    effectiveNote: rule.effectiveNote ?? null,
    ...(rule.timing ? { timing: rule.timing } : {}),
  });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function ruleHash(rule: RegulatoryRule) {
  return sha256(stablePayload(rule));
}

async function knowledgeBaseHash() {
  const rows = await Promise.all(
    [...regulatoryRules]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(async (rule) => ({
        id: rule.id,
        hash: await ruleHash(rule),
      }))
  );

  return sha256(
    JSON.stringify({
      rules: rows,
      products: products.map((product) => product.slug).sort(),
      applicabilityModelVersion: APPLICABILITY_MODEL_VERSION,
      sourceRegistryModelVersion: SOURCE_REGISTRY_MODEL_VERSION,
    })
  );
}

export async function syncRegulatoryKnowledgeBase(db: SellComplyD1) {
  let createdRules = 0;
  let createdVersions = 0;
  let unchanged = 0;
  let reactivated = 0;
  let applicabilityRows = 0;
  let featureConditions = 0;
  let timingRows = 0;
  let structuredTimingRules = 0;
  let ruleSourceLinks = 0;
  let registeredSources = 0;

  for (const rule of regulatoryRules) {
    const hash = await ruleHash(rule);

    const current = await db
      .prepare(
        `SELECT rule_key, current_version, current_hash, is_active
         FROM regulatory_rules
         WHERE rule_key = ?
         LIMIT 1`
      )
      .bind(rule.id)
      .first<CurrentRuleRow>();

    if (!current) {
      await db
        .prepare(
          `INSERT INTO regulatory_rules (
             rule_key, title, short_name, rule_group,
             current_version, current_hash, is_active,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, 1, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(
          rule.id,
          rule.title,
          rule.shortName,
          rule.group,
          hash
        )
        .run();

      await insertVersion(db, rule, 1, hash);
      const timing = await syncRuleTiming(db, rule, 1);
      timingRows += 1;
      if (timing.hasStructuredTiming) structuredTimingRules += 1;
      await syncRuleSourceRegistry(db, rule, 1);
      await ensureRuleReviewState(db, rule, 1);
      ruleSourceLinks += 1;
      const applicability = await syncRuleApplicability(db, rule, 1);
      applicabilityRows += applicability.applicabilityRows;
      featureConditions += applicability.featureConditions;
      createdRules += 1;
      createdVersions += 1;
      continue;
    }

    if (current.current_hash === hash) {
      const timing = await syncRuleTiming(
        db,
        rule,
        Number(current.current_version)
      );
      timingRows += 1;
      if (timing.hasStructuredTiming) structuredTimingRules += 1;

      await syncRuleSourceRegistry(
        db,
        rule,
        Number(current.current_version)
      );
      await ensureRuleReviewState(
        db,
        rule,
        Number(current.current_version)
      );
      ruleSourceLinks += 1;

      const applicability = await syncRuleApplicability(
        db,
        rule,
        Number(current.current_version)
      );
      applicabilityRows += applicability.applicabilityRows;
      featureConditions += applicability.featureConditions;

      if (!current.is_active) {
        await db
          .prepare(
            `UPDATE regulatory_rules
             SET is_active = 1,
                 title = ?,
                 short_name = ?,
                 rule_group = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE rule_key = ?`
          )
          .bind(rule.title, rule.shortName, rule.group, rule.id)
          .run();
        reactivated += 1;
      } else {
        unchanged += 1;
      }
      continue;
    }

    const nextVersion = Number(current.current_version || 0) + 1;
    await insertVersion(db, rule, nextVersion, hash);
    const timing = await syncRuleTiming(db, rule, nextVersion);
    timingRows += 1;
    if (timing.hasStructuredTiming) structuredTimingRules += 1;
    await syncRuleSourceRegistry(db, rule, nextVersion);
    await ensureRuleReviewState(db, rule, nextVersion);
    ruleSourceLinks += 1;
    const applicability = await syncRuleApplicability(db, rule, nextVersion);
    applicabilityRows += applicability.applicabilityRows;
    featureConditions += applicability.featureConditions;

    await db
      .prepare(
        `UPDATE regulatory_rules
         SET title = ?,
             short_name = ?,
             rule_group = ?,
             current_version = ?,
             current_hash = ?,
             is_active = 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE rule_key = ?`
      )
      .bind(
        rule.title,
        rule.shortName,
        rule.group,
        nextVersion,
        hash,
        rule.id
      )
      .run();

    await recordRuleVersionChange(db, {
      ruleKey: rule.id,
      fromVersion: Number(current.current_version),
      toVersion: nextVersion,
    });

    createdVersions += 1;
  }

  const currentKeys = new Set(regulatoryRules.map((rule) => rule.id));
  const existing = await db
    .prepare("SELECT rule_key FROM regulatory_rules WHERE is_active = 1")
    .all<{ rule_key: string }>();

  let deactivated = 0;
  for (const row of existing.results || []) {
    if (currentKeys.has(row.rule_key)) continue;

    await db
      .prepare(
        `UPDATE regulatory_rules
         SET is_active = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE rule_key = ?`
      )
      .bind(row.rule_key)
      .run();

    await db
      .prepare(
        `UPDATE regulatory_applicability
         SET is_current = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE rule_key = ?`
      )
      .bind(row.rule_key)
      .run();

    await db
      .prepare(
        `UPDATE regulatory_rule_sources
         SET is_current = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE rule_key = ?`
      )
      .bind(row.rule_key)
      .run();

    deactivated += 1;
  }

  const legacySources = await syncExistingOfficialSourcesToRegistry(db);
  registeredSources = legacySources.synced;

  await syncKnowledgeCoverage(db);

  const syncHash = await knowledgeBaseHash();
  await db
    .prepare(
      `INSERT INTO schema_meta (key, value, updated_at)
       VALUES ('regulatory_kb_hash', ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(syncHash)
    .run();

  return {
    totalRules: regulatoryRules.length,
    createdRules,
    createdVersions,
    unchanged,
    reactivated,
    deactivated,
    applicabilityRows,
    featureConditions,
    timingRows,
    structuredTimingRules,
    ruleSourceLinks,
    registeredSources,
    hash: syncHash,
  };
}

async function insertVersion(
  db: SellComplyD1,
  rule: RegulatoryRule,
  version: number,
  hash: string
) {
  await db
    .prepare(
      `INSERT INTO regulatory_rule_versions (
         id, rule_key, version, content_hash, status,
         summary, why_text, documents_json, labels_json, actions_json,
         markets_json, products_json, required_features_json, excluded_products_json,
         source_label, source_url, effective_from, effective_to,
         transition_note, last_verified_at, created_at
       ) VALUES (
         ?, ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, CURRENT_TIMESTAMP
       )`
    )
    .bind(
      crypto.randomUUID(),
      rule.id,
      version,
      hash,
      rule.status,
      rule.summary,
      rule.why,
      JSON.stringify(rule.documents),
      JSON.stringify(rule.labels),
      JSON.stringify(rule.actions),
      JSON.stringify(rule.markets),
      rule.products ? JSON.stringify(rule.products) : null,
      rule.requiresFeatures ? JSON.stringify(rule.requiresFeatures) : null,
      rule.excludesProducts ? JSON.stringify(rule.excludesProducts) : null,
      rule.source.label,
      rule.source.url,
      rule.timing?.effectiveFrom || null,
      rule.timing?.effectiveTo || null,
      rule.effectiveNote || null,
      rule.lastVerified || null
    )
    .run();
}

let kbReady = false;

export async function ensureRegulatoryKnowledgeBase(db: SellComplyD1) {
  if (kbReady) return;

  const expectedHash = await knowledgeBaseHash();
  const stored = await db
    .prepare(
      "SELECT value FROM schema_meta WHERE key = 'regulatory_kb_hash' LIMIT 1"
    )
    .first<{ value: string }>();

  if (stored?.value !== expectedHash) {
    await syncRegulatoryKnowledgeBase(db);
  }

  kbReady = true;
}

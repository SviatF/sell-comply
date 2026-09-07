import type { SellComplyD1 } from "./cloudflare-db";
import type { RegulatoryRule } from "./regulatory-rules";

export type RegulatoryLifecycle =
  | "future"
  | "active"
  | "transitional"
  | "expired";

export type RegulatoryTiming = {
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  transitionStart?: string | null;
  transitionEnd?: string | null;
  note?: string | null;
};

function stableId(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `timing_${(hash >>> 0).toString(16)}`;
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeAsOfDate(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (!isIsoDate(value)) throw new Error("INVALID_AS_OF_DATE");
  return value;
}

export function getRegulatoryLifecycle(
  timing: RegulatoryTiming,
  asOf: string
): RegulatoryLifecycle {
  const date = normalizeAsOfDate(asOf);
  const effectiveFrom = timing.effectiveFrom || null;
  const effectiveTo = timing.effectiveTo || null;
  const transitionStart = timing.transitionStart || null;
  const transitionEnd = timing.transitionEnd || null;

  if (
    transitionStart &&
    transitionEnd &&
    date >= transitionStart &&
    date <= transitionEnd
  ) {
    if (!effectiveFrom || date < effectiveFrom || (effectiveTo && date > effectiveTo)) {
      return "transitional";
    }
  }

  if (effectiveFrom && date < effectiveFrom) {
    return "future";
  }

  if (effectiveTo && date > effectiveTo) {
    if (
      transitionStart &&
      transitionEnd &&
      date >= transitionStart &&
      date <= transitionEnd
    ) {
      return "transitional";
    }
    return "expired";
  }

  if (
    transitionStart &&
    transitionEnd &&
    date >= transitionStart &&
    date <= transitionEnd
  ) {
    return "transitional";
  }

  return "active";
}

export function isLifecycleApplicable(lifecycle: RegulatoryLifecycle) {
  return lifecycle === "active" || lifecycle === "transitional";
}

export async function syncRuleTiming(
  db: SellComplyD1,
  rule: RegulatoryRule,
  ruleVersion: number
) {
  const timing = rule.timing ?? {};

  await db
    .prepare(
      `INSERT INTO regulatory_rule_timing (
         id, rule_key, rule_version,
         effective_from, effective_to,
         transition_start, transition_end,
         timing_note, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(rule_key, rule_version) DO UPDATE SET
         effective_from = excluded.effective_from,
         effective_to = excluded.effective_to,
         transition_start = excluded.transition_start,
         transition_end = excluded.transition_end,
         timing_note = excluded.timing_note,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      stableId(`${rule.id}|${ruleVersion}`),
      rule.id,
      ruleVersion,
      timing.effectiveFrom || null,
      timing.effectiveTo || null,
      timing.transitionStart || null,
      timing.transitionEnd || null,
      rule.effectiveNote || null
    )
    .run();

  return {
    ruleKey: rule.id,
    ruleVersion,
    hasStructuredTiming: Boolean(
      timing.effectiveFrom ||
        timing.effectiveTo ||
        timing.transitionStart ||
        timing.transitionEnd
    ),
  };
}

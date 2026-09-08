import { describe, expect, it } from "vitest";
import {
  diffRuleVersionSnapshots,
  summarizeRuleVersionChange,
  type RuleVersionSnapshot,
} from "../lib/regulatory-change-history";

function snapshot(
  overrides: Partial<RuleVersionSnapshot> = {}
): RuleVersionSnapshot {
  return {
    status: "required",
    summary: "Original summary",
    why_text: "Original why",
    documents_json: '["Doc A"]',
    labels_json: '["Label A"]',
    actions_json: '["Action A"]',
    markets_json: '["germany"]',
    products_json: '["wireless-headphones"]',
    required_features_json: '["radio"]',
    excluded_products_json: null,
    source_label: "Official source",
    source_url: "https://example.gov/rule",
    effective_from: "2026-01-01",
    effective_to: null,
    transition_note: null,
    ...overrides,
  };
}

describe("regulatory version diffing", () => {
  it("returns no changed fields for identical versions", () => {
    const before = snapshot();
    const after = snapshot();

    expect(diffRuleVersionSnapshots(before, after)).toEqual([]);
  });

  it("detects substantive requirement changes", () => {
    const before = snapshot();
    const after = snapshot({
      status: "verify",
      summary: "Updated summary",
      documents_json: '["Doc A","Doc B"]',
      effective_from: "2026-06-01",
    });

    expect(diffRuleVersionSnapshots(before, after)).toEqual([
      "status",
      "summary",
      "documents_json",
      "effective_from",
    ]);
  });

  it("detects applicability-scope changes", () => {
    const before = snapshot();
    const after = snapshot({
      markets_json: '["germany","france"]',
      products_json: '["wireless-headphones","bluetooth-speakers"]',
      required_features_json: '["radio","battery"]',
    });

    expect(diffRuleVersionSnapshots(before, after)).toEqual([
      "markets_json",
      "products_json",
      "required_features_json",
    ]);
  });

  it("detects official-source changes separately", () => {
    const before = snapshot();
    const after = snapshot({
      source_label: "Updated official source",
      source_url: "https://example.gov/new-rule",
    });

    expect(diffRuleVersionSnapshots(before, after)).toEqual([
      "source_label",
      "source_url",
    ]);
  });

  it("creates a readable version-change summary", () => {
    expect(
      summarizeRuleVersionChange(
        "eu-red",
        2,
        3,
        ["summary", "documents_json"]
      )
    ).toBe(
      "eu-red changed from v2 to v3. Updated fields: summary, documents_json."
    );
  });
});

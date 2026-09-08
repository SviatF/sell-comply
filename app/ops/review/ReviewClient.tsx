"use client";

import { useEffect, useState } from "react";

type TriageOutcome =
  | ""
  | "no_regulatory_change"
  | "informational"
  | "requirement_changed"
  | "needs_rule_update";

type ChangeItem = {
  id: string;
  market_slug?: string | null;
  product_slug?: string | null;
  change_type?: string;
  title: string;
  summary?: string | null;
  detected_at?: string;
  source_url?: string | null;
  review_status?: string;
  triage_outcome?: TriageOutcome | null;
  review_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  seller_alert_eligible?: boolean;
  requires_rule_update?: boolean;
  impacted_rule_keys?: string[];
  reviewed_rule_keys?: string[];
};

type Draft = {
  outcome: TriageOutcome;
  note: string;
  ruleKeys: string[];
};

const TOKEN_KEY = "sellcomply-admin-token";

const outcomeCopy: Record<
  Exclude<TriageOutcome, "">,
  { label: string; detail: string }
> = {
  no_regulatory_change: {
    label: "No regulatory change",
    detail: "Source content changed, but no requirement change was confirmed.",
  },
  informational: {
    label: "Informational",
    detail: "Useful regulator/source update, but no seller requirement change.",
  },
  requirement_changed: {
    label: "Requirement changed",
    detail: "Confirmed seller-facing requirement change. Eligible alerts will be queued.",
  },
  needs_rule_update: {
    label: "Needs rule update",
    detail: "Regulatory significance confirmed or suspected, but the KB rule must be updated first.",
  },
};

function makeDraft(item: ChangeItem): Draft {
  return {
    outcome: item.triage_outcome || "",
    note: item.review_note || "",
    ruleKeys:
      item.reviewed_rule_keys?.length
        ? item.reviewed_rule_keys
        : item.impacted_rule_keys || [],
  };
}

export default function ReviewClient() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<ChangeItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY) || "";
    if (saved) {
      setToken(saved);
      void load(saved);
    }
  }, []);

  const load = async (adminToken = token) => {
    const value = adminToken.trim();
    if (!value) {
      setMessage("Enter ADMIN_TOKEN first.");
      setState("error");
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/admin/changes", {
        headers: { "x-admin-token": value },
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "LOAD_FAILED");
      }

      const nextItems: ChangeItem[] = Array.isArray(result.items)
        ? result.items
        : [];

      sessionStorage.setItem(TOKEN_KEY, value);
      setItems(nextItems);
      setDrafts(
        Object.fromEntries(nextItems.map((item) => [item.id, makeDraft(item)]))
      );
      setState("ready");
    } catch {
      setItems([]);
      setDrafts({});
      setState("error");
      setMessage("Token rejected or the review API is unavailable.");
    }
  };

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || { outcome: "", note: "", ruleKeys: [] }),
        ...patch,
      },
    }));
  };

  const toggleRule = (id: string, ruleKey: string) => {
    const current = drafts[id] || { outcome: "", note: "", ruleKeys: [] };
    const hasRule = current.ruleKeys.includes(ruleKey);

    updateDraft(id, {
      ruleKeys: hasRule
        ? current.ruleKeys.filter((item) => item !== ruleKey)
        : [...current.ruleKeys, ruleKey].sort(),
    });
  };

  const submitTriage = async (item: ChangeItem) => {
    const draft = drafts[item.id];
    if (!draft?.outcome) {
      setMessage("Choose a regulatory triage outcome first.");
      return;
    }

    setBusyId(item.id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/changes/${encodeURIComponent(item.id)}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-admin-token": token.trim(),
          },
          body: JSON.stringify({
            outcome: draft.outcome,
            note: draft.note.trim(),
            reviewedBy: "ops-console",
            ruleKeys: draft.ruleKeys,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "TRIAGE_FAILED");
      }

      if (draft.outcome === "requirement_changed") {
        setMessage(
          `Requirement change confirmed. ${result.queued || 0} seller alert job(s) queued.`
        );
      } else if (draft.outcome === "needs_rule_update") {
        setMessage(
          "Marked for KB rule update. Seller alerts remain blocked until the rule is updated and reviewed again."
        );
      } else if (draft.outcome === "informational") {
        setMessage("Saved as informational. No seller requirement alert was queued.");
      } else {
        setMessage("Closed as no regulatory change. No seller alert was queued.");
      }

      await load();
    } catch {
      setMessage("Triage action failed.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <section className="ops-hero">
        <div>
          <span className="seo-kicker"><i /> INTERNAL OPERATIONS</span>
          <h1>Regulatory<br /><em>triage queue.</em></h1>
          <p>
            A source fingerprint change is evidence that a page changed — not proof
            that a legal requirement changed. Classify the update before any seller-facing action.
          </p>
        </div>

        <div className="ops-auth-card">
          <label htmlFor="ops-token">ADMIN_TOKEN</label>
          <input
            id="ops-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste Cloudflare ADMIN_TOKEN"
            autoComplete="off"
          />
          <button onClick={() => void load()} disabled={state === "loading"}>
            {state === "loading" ? "Loading…" : "Open triage queue"}
          </button>
          <small>The token is stored only in this browser session, not in local storage.</small>
        </div>
      </section>

      {message && <div className="ops-message">{message}</div>}

      <section className="ops-review-section">
        <div className="ops-section-head">
          <div>
            <span>01</span>
            <h2>Detected source updates</h2>
          </div>
          <strong>{items.length} total</strong>
        </div>

        {state !== "ready" ? (
          <div className="ops-empty">
            <h3>{state === "loading" ? "Loading triage queue…" : "Triage queue is locked."}</h3>
            <p>Enter the server-side ADMIN_TOKEN to inspect regulatory source changes.</p>
          </div>
        ) : items.length ? (
          <div className="ops-change-list">
            {items.map((item) => {
              const draft = drafts[item.id] || makeDraft(item);
              const impactedRules = item.impacted_rule_keys || [];
              const selectedCopy = draft.outcome ? outcomeCopy[draft.outcome] : null;

              return (
                <article className="ops-change-card" key={item.id}>
                  <div className="ops-change-head">
                    <div>
                      <span className={`ops-status ${item.triage_outcome || "needs_triage"}`}>
                        {item.triage_outcome || "needs_triage"}
                      </span>
                      <span className="ops-market">{item.market_slug || "global"}</span>
                    </div>
                    <small>{item.detected_at || ""}</small>
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.summary || "Official source fingerprint changed."}</p>

                  {impactedRules.length > 0 && (
                    <div className="ops-affected-rules">
                      <span>AFFECTED RULES</span>
                      <div>
                        {impactedRules.map((ruleKey) => (
                          <label key={ruleKey}>
                            <input
                              type="checkbox"
                              checked={draft.ruleKeys.includes(ruleKey)}
                              onChange={() => toggleRule(item.id, ruleKey)}
                            />
                            <b>{ruleKey}</b>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="ops-triage-grid">
                    <label className="ops-triage-field">
                      <span>TRIAGE OUTCOME</span>
                      <select
                        value={draft.outcome}
                        onChange={(event) =>
                          updateDraft(item.id, {
                            outcome: event.target.value as TriageOutcome,
                          })
                        }
                      >
                        <option value="">Choose outcome…</option>
                        <option value="no_regulatory_change">No regulatory change</option>
                        <option value="informational">Informational</option>
                        <option value="requirement_changed">Requirement changed</option>
                        <option value="needs_rule_update">Needs rule update</option>
                      </select>
                    </label>

                    <label className="ops-triage-field ops-note-field">
                      <span>REVIEW NOTE</span>
                      <textarea
                        value={draft.note}
                        onChange={(event) =>
                          updateDraft(item.id, { note: event.target.value })
                        }
                        placeholder="Explain what changed and why this outcome is correct."
                      />
                    </label>
                  </div>

                  {selectedCopy && (
                    <div className={`ops-triage-explainer ${draft.outcome}`}>
                      <strong>{selectedCopy.label}</strong>
                      <p>{selectedCopy.detail}</p>
                    </div>
                  )}

                  <div className="ops-change-footer">
                    <div className="ops-change-links">
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noreferrer">
                          Official source ↗
                        </a>
                      )}
                      {item.reviewed_at && (
                        <span>
                          Last reviewed {item.reviewed_at}
                          {item.reviewed_by ? ` · ${item.reviewed_by}` : ""}
                        </span>
                      )}
                    </div>

                    <div className="ops-actions">
                      <button
                        className={
                          draft.outcome === "requirement_changed"
                            ? "approve"
                            : draft.outcome === "needs_rule_update"
                              ? "rule-update"
                              : "save-triage"
                        }
                        onClick={() => void submitTriage(item)}
                        disabled={!draft.outcome || busyId === item.id}
                      >
                        {busyId === item.id
                          ? "Saving…"
                          : draft.outcome === "requirement_changed"
                            ? "Confirm & queue eligible alerts"
                            : draft.outcome === "needs_rule_update"
                              ? "Flag rule update"
                              : "Save triage"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="ops-empty">
            <h3>No source updates waiting in the queue.</h3>
            <p>When monitoring detects a content fingerprint change, it will appear here for human triage.</p>
          </div>
        )}
      </section>
    </>
  );
}

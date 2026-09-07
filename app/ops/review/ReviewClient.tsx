"use client";

import { useEffect, useState } from "react";

type ChangeItem = {
  id: string;
  market_slug?: string;
  product_slug?: string | null;
  change_type?: string;
  title: string;
  summary?: string;
  detected_at?: string;
  source_url?: string;
  review_status?: string;
  decision?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
};

const TOKEN_KEY = "sellcomply-admin-token";

export default function ReviewClient() {
  const [token, setToken] = useState("");
  const [items, setItems] = useState<ChangeItem[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
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

      if (!response.ok || !result?.ok) throw new Error(result?.error || "LOAD_FAILED");

      sessionStorage.setItem(TOKEN_KEY, value);
      setItems(Array.isArray(result.items) ? result.items : []);
      setState("ready");
    } catch {
      setItems([]);
      setState("error");
      setMessage("Token rejected or the review API is unavailable.");
    }
  };

  const review = async (id: string, decision: "approved" | "rejected") => {
    const note =
      decision === "approved"
        ? "Reviewed in SellComply operations console."
        : "Rejected in SellComply operations console.";

    setMessage("");

    try {
      const response = await fetch(`/api/admin/changes/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-token": token.trim(),
        },
        body: JSON.stringify({
          decision,
          note,
          reviewedBy: "ops-console",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "REVIEW_FAILED");

      setMessage(
        decision === "approved"
          ? `Approved. ${result.queued || 0} alert job(s) queued.`
          : "Change rejected. No alerts will be sent."
      );
      await load();
    } catch {
      setMessage("Review action failed.");
    }
  };

  return (
    <>
      <section className="ops-hero">
        <div>
          <span className="seo-kicker"><i /> INTERNAL OPERATIONS</span>
          <h1>Regulatory<br /><em>review queue.</em></h1>
          <p>Detected source changes never become seller alerts until they are reviewed here.</p>
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
            {state === "loading" ? "Loading…" : "Open review queue"}
          </button>
          <small>The token is stored only in this browser session, not in local storage.</small>
        </div>
      </section>

      {message && <div className="ops-message">{message}</div>}

      <section className="ops-review-section">
        <div className="ops-section-head">
          <div>
            <span>01</span>
            <h2>Detected changes</h2>
          </div>
          <strong>{items.length} total</strong>
        </div>

        {state !== "ready" ? (
          <div className="ops-empty">
            <h3>{state === "loading" ? "Loading review queue…" : "Review queue is locked."}</h3>
            <p>Enter the server-side ADMIN_TOKEN to view regulatory source changes.</p>
          </div>
        ) : items.length ? (
          <div className="ops-change-list">
            {items.map((item) => (
              <article className="ops-change-card" key={item.id}>
                <div className="ops-change-head">
                  <div>
                    <span className={`ops-status ${item.review_status || "needs_review"}`}>
                      {item.review_status || "needs_review"}
                    </span>
                    <span className="ops-market">{item.market_slug || "global"}</span>
                  </div>
                  <small>{item.detected_at || ""}</small>
                </div>

                <h3>{item.title}</h3>
                <p>{item.summary || "Official source fingerprint changed."}</p>

                <div className="ops-change-footer">
                  <div>
                    {item.source_url && (
                      <a href={item.source_url} target="_blank" rel="noreferrer">
                        Official source ↗
                      </a>
                    )}
                  </div>

                  {item.review_status === "needs_review" ? (
                    <div className="ops-actions">
                      <button className="reject" onClick={() => void review(item.id, "rejected")}>
                        Reject
                      </button>
                      <button className="approve" onClick={() => void review(item.id, "approved")}>
                        Approve & queue alerts
                      </button>
                    </div>
                  ) : (
                    <span className="ops-reviewed">
                      {item.decision || item.review_status}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="ops-empty">
            <h3>No changes waiting for review.</h3>
            <p>When the official-source monitor detects a content change, it will appear here.</p>
          </div>
        )}
      </section>
    </>
  );
}

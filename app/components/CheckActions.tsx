"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics-client";
import { sameRetentionTarget } from "@/lib/retention";
import {
  getVisitorId,
  MONITORED_PRODUCTS_KEY,
  readLocalArray,
  SAVED_CHECKS_KEY,
  writeLocalArray,
} from "@/lib/visitor";

type Props = {
  rawProduct: string;
  productSlug: string;
  category: string;
  marketSlug: string;
  marketName: string;
  marketplaceSlug?: string;
  marketplaceName?: string;
  certainty: string;
  reviewCount: number;
};

type LocalCheck = {
  id: string;
  rawProduct: string;
  productSlug: string;
  category: string;
  marketSlug: string;
  marketName: string;
  marketplaceSlug?: string;
  marketplaceName?: string;
  status: string;
  certainty: string;
  reviewCount: number;
  createdAt: string;
};

type LocalMonitor = {
  id: string;
  rawProduct: string;
  productSlug: string;
  marketSlug: string;
  marketName: string;
  marketplaceSlug?: string;
  marketplaceName?: string;
  emailReady?: boolean;
  savedAt: string;
};

const EMAIL_KEY = "sellcomply-alert-email";

export default function CheckActions(props: Props) {
  const [saved, setSaved] = useState(false);
  const [monitored, setMonitored] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [monitorError, setMonitorError] = useState("");
  const [busy, setBusy] = useState<"save" | "monitor" | null>(null);

  const target = {
    rawProduct: props.rawProduct,
    marketSlug: props.marketSlug,
    marketName: props.marketName,
    marketplaceSlug: props.marketplaceSlug,
    marketplaceName: props.marketplaceName,
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(EMAIL_KEY) || "";
    if (rememberedEmail) setEmail(rememberedEmail);

    const localChecks = readLocalArray<LocalCheck>(SAVED_CHECKS_KEY);
    const localMonitors = readLocalArray<LocalMonitor>(MONITORED_PRODUCTS_KEY);

    setSaved(localChecks.some((item) => sameRetentionTarget(item, target)));
    setMonitored(localMonitors.some((item) => sameRetentionTarget(item, target)));
  }, [
    props.rawProduct,
    props.marketSlug,
    props.marketName,
    props.marketplaceSlug,
    props.marketplaceName,
  ]);

  const persistSavedCheck = async (visitorId: string) => {
    const local: LocalCheck = {
      id: crypto.randomUUID(),
      rawProduct: props.rawProduct,
      productSlug: props.productSlug,
      category: props.category,
      marketSlug: props.marketSlug,
      marketName: props.marketName,
      marketplaceSlug: props.marketplaceSlug,
      marketplaceName: props.marketplaceName,
      status: "needs_review",
      certainty: props.certainty,
      reviewCount: props.reviewCount,
      createdAt: new Date().toISOString(),
    };

    const current = readLocalArray<LocalCheck>(SAVED_CHECKS_KEY);
    if (!current.some((item) => sameRetentionTarget(item, local))) {
      writeLocalArray(SAVED_CHECKS_KEY, [local, ...current].slice(0, 100));
    }
    setSaved(true);

    try {
      await fetch("/api/checks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          visitorId,
          rawProduct: props.rawProduct,
          productSlug: props.productSlug,
          category: props.category,
          marketSlug: props.marketSlug,
          marketName: props.marketName,
          marketplaceSlug: props.marketplaceSlug || null,
          marketplaceName: props.marketplaceName || null,
          status: "needs_review",
          certainty: props.certainty,
          reviewCount: props.reviewCount,
        }),
      });
    } catch {
      // Local storage remains the fallback for saved checks.
    }
  };

  const saveCheck = async () => {
    if (saved || busy) return;
    setBusy("save");

    const visitorId = getVisitorId();
    await persistSavedCheck(visitorId);

    trackEvent("save_check", {
      productSlug: props.productSlug,
      marketSlug: props.marketSlug,
      marketplaceSlug: props.marketplaceSlug,
    });

    setBusy(null);
  };

  const submitMonitor = async (event: FormEvent) => {
    event.preventDefault();
    if (monitored || busy) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMonitorError("Enter a valid email address.");
      return;
    }

    setMonitorError("");
    setBusy("monitor");

    const visitorId = getVisitorId();

    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          visitorId,
          email: normalizedEmail,
          rawProduct: props.rawProduct,
          productSlug: props.productSlug,
          marketSlug: props.marketSlug,
          marketName: props.marketName,
          marketplaceSlug: props.marketplaceSlug || null,
          marketplaceName: props.marketplaceName || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.ok || !result?.persisted) {
        throw new Error(result?.reason || result?.error || "Monitoring could not be enabled.");
      }

      const local: LocalMonitor = {
        id: result.id || crypto.randomUUID(),
        rawProduct: props.rawProduct,
        productSlug: props.productSlug,
        marketSlug: props.marketSlug,
        marketName: props.marketName,
        marketplaceSlug: props.marketplaceSlug,
        marketplaceName: props.marketplaceName,
        emailReady: true,
        savedAt: new Date().toISOString(),
      };

      const current = readLocalArray<LocalMonitor>(MONITORED_PRODUCTS_KEY);
      const filtered = current.filter((item) => !sameRetentionTarget(item, local));

      writeLocalArray(MONITORED_PRODUCTS_KEY, [local, ...filtered].slice(0, 100));
      localStorage.setItem(EMAIL_KEY, normalizedEmail);

      if (!saved) await persistSavedCheck(visitorId);

      trackEvent("monitor_product", {
        productSlug: props.productSlug,
        marketSlug: props.marketSlug,
        marketplaceSlug: props.marketplaceSlug,
        metadata: { emailCaptured: true, savedWithMonitor: !saved },
      });

      setSaved(true);
      setMonitored(true);
      setMonitorOpen(false);
    } catch {
      setMonitorError("We couldn't enable monitoring right now. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="check-action-buttons">
      <div className="retention-state-grid" aria-live="polite">
        <div className={saved ? "retention-state active" : "retention-state"}>
          <span>{saved ? "✓" : "01"}</span>
          <div><strong>Saved</strong><small>{saved ? "In your dashboard" : "Not saved yet"}</small></div>
        </div>
        <div className={monitored ? "retention-state active" : "retention-state"}>
          <span>{monitored ? "✓" : "02"}</span>
          <div><strong>Monitoring</strong><small>{monitored ? "Watch is active" : "Off"}</small></div>
        </div>
        <div className={monitored ? "retention-state active" : "retention-state"}>
          <span>{monitored ? "✓" : "03"}</span>
          <div><strong>Email attached</strong><small>{monitored ? "Alerts connected" : "Attach when monitoring"}</small></div>
        </div>
      </div>

      <button
        className={saved ? "save-check-button saved" : "save-check-button"}
        onClick={saveCheck}
        disabled={saved || busy === "save"}
        type="button"
      >
        <span>{saved ? "✓" : "＋"}</span>
        <div>
          <strong>{saved ? "Check saved" : busy === "save" ? "Saving…" : "Save this check"}</strong>
          <small>{saved ? "Available from your dashboard on this browser." : "Keep this exact product-market result for later."}</small>
        </div>
      </button>

      {monitored ? (
        <div className="monitor-button saved monitor-complete">
          <span>✓</span>
          <div>
            <strong>Monitoring enabled</strong>
            <small>This review is saved and its compliance watch has email alerts attached.</small>
          </div>
        </div>
      ) : (
        <>
          <button
            className={monitorOpen ? "monitor-button active" : "monitor-button"}
            onClick={() => {
              setMonitorOpen((value) => {
                const next = !value;
                if (next) {
                  trackEvent("monitor_form_open", {
                    productSlug: props.productSlug,
                    marketSlug: props.marketSlug,
                    marketplaceSlug: props.marketplaceSlug,
                  });
                }
                return next;
              });
              setMonitorError("");
            }}
            type="button"
          >
            <span>◎</span>
            <div>
              <strong>Monitor this product</strong>
              <small>Monitoring also saves this review. No account required.</small>
            </div>
          </button>

          {monitorOpen && (
            <form className="monitor-email-form" onSubmit={submitMonitor}>
              <div className="monitor-email-head">
                <span>EMAIL ALERTS</span>
                <strong>Where should we send important compliance changes?</strong>
              </div>

              <div className="monitor-email-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (monitorError) setMonitorError("");
                  }}
                  placeholder="you@company.com"
                  autoComplete="email"
                  aria-label="Email for compliance alerts"
                  required
                />
                <button type="submit" disabled={busy === "monitor"}>
                  {busy === "monitor" ? "Enabling…" : "Save + monitor"}
                </button>
              </div>

              {monitorError ? (
                <p className="monitor-email-error">{monitorError}</p>
              ) : (
                <p className="monitor-consent">
                  One action saves this check and enables product-compliance monitoring.
                  No account required. Unsubscribe will be available from every alert.
                </p>
              )}
            </form>
          )}
        </>
      )}

      {(saved || monitored) && (
        <Link
          className="retention-dashboard-link"
          href="/dashboard"
          onClick={() =>
            trackEvent("dashboard_cta", {
              productSlug: props.productSlug,
              marketSlug: props.marketSlug,
              marketplaceSlug: props.marketplaceSlug,
            })
          }
        >
          <span>
            <strong>Open compliance dashboard</strong>
            <small>Saved checks and monitored products in one workspace.</small>
          </span>
          <b>Dashboard →</b>
        </Link>
      )}
    </div>
  );
}

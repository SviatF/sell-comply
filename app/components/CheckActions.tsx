"use client";

import { FormEvent, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics-client";
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

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(EMAIL_KEY) || "";
    if (rememberedEmail) setEmail(rememberedEmail);
  }, []);

  const saveCheck = async () => {
    if (saved || busy) return;
    setBusy("save");

    const visitorId = getVisitorId();
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
    const duplicate = current.some(
      (item) =>
        item.rawProduct === local.rawProduct &&
        item.marketSlug === local.marketSlug &&
        (item.marketplaceSlug || "") === (local.marketplaceSlug || "")
    );
    if (!duplicate) writeLocalArray(SAVED_CHECKS_KEY, [local, ...current].slice(0, 100));

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
      // Local storage remains a fallback for saved checks.
    }

    trackEvent("save_check", {
      productSlug: props.productSlug,
      marketSlug: props.marketSlug,
      marketplaceSlug: props.marketplaceSlug,
    });

    setSaved(true);
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
      const filtered = current.filter(
        (item) =>
          !(
            item.rawProduct === local.rawProduct &&
            item.marketSlug === local.marketSlug &&
            (item.marketplaceSlug || "") === (local.marketplaceSlug || "")
          )
      );

      writeLocalArray(MONITORED_PRODUCTS_KEY, [local, ...filtered].slice(0, 100));
      localStorage.setItem(EMAIL_KEY, normalizedEmail);

      trackEvent("monitor_product", {
        productSlug: props.productSlug,
        marketSlug: props.marketSlug,
        marketplaceSlug: props.marketplaceSlug,
        metadata: { emailCaptured: true },
      });

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
      <button className={saved ? "save-check-button saved" : "save-check-button"} onClick={saveCheck}>
        <span>{saved ? "✓" : "＋"}</span>
        <div>
          <strong>{saved ? "Check saved" : busy === "save" ? "Saving…" : "Save this check"}</strong>
          <small>Keep this product-market result in your dashboard.</small>
        </div>
      </button>

      {monitored ? (
        <div className="monitor-button saved monitor-complete">
          <span>✓</span>
          <div>
            <strong>Monitoring enabled</strong>
            <small>Email attached to this product-market watch.</small>
          </div>
        </div>
      ) : (
        <>
          <button
            className={monitorOpen ? "monitor-button active" : "monitor-button"}
            onClick={() => {
              setMonitorOpen((value) => !value);
              setMonitorError("");
            }}
            type="button"
          >
            <span>◎</span>
            <div>
              <strong>Monitor this product</strong>
              <small>Get ready for compliance-change alerts without creating an account.</small>
            </div>
          </button>

          {monitorOpen && (
            <form className="monitor-email-form" onSubmit={submitMonitor}>
              <div className="monitor-email-head">
                <span>EMAIL ALERTS</span>
                <strong>Where should we send important changes?</strong>
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
                  {busy === "monitor" ? "Enabling…" : "Enable monitoring"}
                </button>
              </div>

              {monitorError ? (
                <p className="monitor-email-error">{monitorError}</p>
              ) : (
                <p className="monitor-consent">
                  By enabling monitoring, you agree to receive product-compliance alerts for this watch.
                  No account required. Unsubscribe will be available from every alert.
                </p>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}

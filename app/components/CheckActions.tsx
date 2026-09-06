"use client";

import { useState } from "react";
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
  savedAt: string;
};

export default function CheckActions(props: Props) {
  const [saved, setSaved] = useState(false);
  const [monitored, setMonitored] = useState(false);
  const [busy, setBusy] = useState<"save" | "monitor" | null>(null);

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
      // Local persistence keeps the action useful when D1 is not yet connected.
    }

    setSaved(true);
    setBusy(null);
  };

  const monitorProduct = async () => {
    if (monitored || busy) return;
    setBusy("monitor");

    const visitorId = getVisitorId();
    const local: LocalMonitor = {
      id: crypto.randomUUID(),
      rawProduct: props.rawProduct,
      productSlug: props.productSlug,
      marketSlug: props.marketSlug,
      marketName: props.marketName,
      marketplaceSlug: props.marketplaceSlug,
      marketplaceName: props.marketplaceName,
      savedAt: new Date().toISOString(),
    };

    const current = readLocalArray<LocalMonitor>(MONITORED_PRODUCTS_KEY);
    const duplicate = current.some(
      (item) =>
        item.rawProduct === local.rawProduct &&
        item.marketSlug === local.marketSlug &&
        (item.marketplaceSlug || "") === (local.marketplaceSlug || "")
    );
    if (!duplicate) writeLocalArray(MONITORED_PRODUCTS_KEY, [local, ...current].slice(0, 100));

    try {
      await fetch("/api/monitors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          visitorId,
          rawProduct: props.rawProduct,
          productSlug: props.productSlug,
          marketSlug: props.marketSlug,
          marketName: props.marketName,
          marketplaceSlug: props.marketplaceSlug || null,
          marketplaceName: props.marketplaceName || null,
        }),
      });
    } catch {
      // Local persistence is the fallback until Cloudflare D1 is bound.
    }

    setMonitored(true);
    setBusy(null);
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

      <button className={monitored ? "monitor-button saved" : "monitor-button"} onClick={monitorProduct}>
        <span>{monitored ? "✓" : "◎"}</span>
        <div>
          <strong>{monitored ? "Monitoring enabled" : busy === "monitor" ? "Saving…" : "Monitor this product"}</strong>
          <small>{monitored ? "Saved for future regulatory-change checks." : "Track this product-market combination for changes."}</small>
        </div>
      </button>
    </div>
  );
}

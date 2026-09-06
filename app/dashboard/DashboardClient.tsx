"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics-client";
import {
  getVisitorId,
  MONITORED_PRODUCTS_KEY,
  readLocalArray,
  SAVED_CHECKS_KEY,
} from "@/lib/visitor";

type SavedCheck = {
  id: string;
  rawProduct: string;
  productSlug?: string;
  category?: string;
  marketSlug?: string;
  marketName: string;
  marketplaceSlug?: string;
  marketplaceName?: string;
  status?: string;
  certainty?: string;
  reviewCount?: number;
  createdAt?: string;
  created_at?: string;
};

type ChangeItem = {
  id: string;
  market_slug?: string;
  change_type?: string;
  title: string;
  summary?: string;
  detected_at?: string;
  source_url?: string;
  review_status?: string;
};

type Monitor = {
  id: string;
  rawProduct: string;
  productSlug?: string;
  product_slug?: string;
  marketSlug?: string;
  market_slug?: string;
  marketName?: string;
  market_name?: string;
  marketplaceSlug?: string;
  marketplace_slug?: string;
  marketplaceName?: string;
  marketplace_name?: string;
  savedAt?: string;
  created_at?: string;
  next_check_at?: string;
};

function normalizeCheck(item: any): SavedCheck {
  return {
    id: item.id,
    rawProduct: item.rawProduct ?? item.raw_product,
    productSlug: item.productSlug ?? item.product_slug,
    category: item.category,
    marketSlug: item.marketSlug ?? item.market_slug,
    marketName: item.marketName ?? item.market_name,
    marketplaceSlug: item.marketplaceSlug ?? item.marketplace_slug,
    marketplaceName: item.marketplaceName ?? item.marketplace_name,
    status: item.status,
    certainty: item.certainty,
    reviewCount: item.reviewCount ?? item.review_count,
    createdAt: item.createdAt ?? item.created_at,
  };
}

function normalizeMonitor(item: any): Monitor {
  return {
    id: item.id,
    rawProduct: item.rawProduct ?? item.raw_product,
    productSlug: item.productSlug ?? item.product_slug,
    marketSlug: item.marketSlug ?? item.market_slug,
    marketName: item.marketName ?? item.market_name,
    marketplaceSlug: item.marketplaceSlug ?? item.marketplace_slug,
    marketplaceName: item.marketplaceName ?? item.marketplace_name,
    savedAt: item.savedAt ?? item.created_at,
    next_check_at: item.next_check_at,
  };
}

function uniqueByKey<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) if (!map.has(getKey(item))) map.set(getKey(item), item);
  return [...map.values()];
}

export default function DashboardClient() {
  const [checks, setChecks] = useState<SavedCheck[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [syncState, setSyncState] = useState<"local" | "cloud">("local");
  const [changes, setChanges] = useState<ChangeItem[]>([]);

  useEffect(() => {
    trackEvent("dashboard_open");
    const localChecks = readLocalArray<SavedCheck>(SAVED_CHECKS_KEY).map(normalizeCheck);
    const localMonitors = readLocalArray<Monitor>(MONITORED_PRODUCTS_KEY).map(normalizeMonitor);
    setChecks(localChecks);
    setMonitors(localMonitors);

    const visitorId = getVisitorId();

    Promise.all([
      fetch(`/api/checks?visitor_id=${encodeURIComponent(visitorId)}`).then((res) => res.json()),
      fetch(`/api/monitors?visitor_id=${encodeURIComponent(visitorId)}`).then((res) => res.json()),
      fetch(`/api/changes?visitor_id=${encodeURIComponent(visitorId)}`).then((res) => res.json()),
    ])
      .then(([checkResult, monitorResult, changeResult]) => {
        const cloudChecks = Array.isArray(checkResult.items) ? checkResult.items.map(normalizeCheck) : [];
        const cloudMonitors = Array.isArray(monitorResult.items) ? monitorResult.items.map(normalizeMonitor) : [];

        if (checkResult.persisted || monitorResult.persisted || changeResult.persisted) setSyncState("cloud");
        if (Array.isArray(changeResult.items)) setChanges(changeResult.items);

        setChecks(
          uniqueByKey([...cloudChecks, ...localChecks], (item) =>
            `${item.rawProduct}::${item.marketSlug || item.marketName}::${item.marketplaceSlug || item.marketplaceName || ""}`
          )
        );
        setMonitors(
          uniqueByKey([...cloudMonitors, ...localMonitors], (item) =>
            `${item.rawProduct}::${item.marketSlug || item.marketName}::${item.marketplaceSlug || item.marketplaceName || ""}`
          )
        );
      })
      .catch(() => {
        setSyncState("local");
      });
  }, []);

  const markets = useMemo(
    () => new Set(checks.map((item) => item.marketName).filter(Boolean)).size,
    [checks]
  );

  const monitoredKeys = useMemo(
    () =>
      new Set(
        monitors.map(
          (item) =>
            `${item.rawProduct}::${item.marketSlug || item.marketName}::${item.marketplaceSlug || item.marketplaceName || ""}`
        )
      ),
    [monitors]
  );

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <span className="seo-kicker"><i /> COMPLIANCE WORKSPACE</span>
          <h1>Your products.<br /><em>Your markets.</em></h1>
          <p>Save checks, monitor product-market combinations and build a single place to manage compliance work.</p>
        </div>
        <div className="dashboard-sync">
          <span className={syncState === "cloud" ? "sync-dot cloud" : "sync-dot"} />
          <div>
            <strong>{syncState === "cloud" ? "Cloud persistence connected" : "Local workspace active"}</strong>
            <small>{syncState === "cloud" ? "Checks are syncing through SellComply." : "D1 can be connected later without changing your workflow."}</small>
          </div>
        </div>
      </section>

      <section className="dashboard-stats">
        <article><span>Saved checks</span><strong>{checks.length}</strong></article>
        <article><span>Monitored</span><strong>{monitors.length}</strong></article>
        <article><span>Markets</span><strong>{markets}</strong></article>
        <article><span>Needs review</span><strong>{checks.filter((item) => item.status !== "compliant").length}</strong></article>
        <article className="change-stat"><span>Source changes</span><strong>{changes.length}</strong></article>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <div><span>01</span><h2>Monitored products</h2></div>
          <Link href="/#checker">Add product +</Link>
        </div>

        {monitors.length ? (
          <div className="dashboard-product-grid">
            {monitors.map((item) => {
              const key = `${item.rawProduct}::${item.marketSlug || item.marketName}::${item.marketplaceSlug || item.marketplaceName || ""}`;
              return (
                <article className="dashboard-product-card" key={key}>
                  <div className="dashboard-product-top">
                    <span className="monitor-live">MONITORING</span>
                    <span className="dashboard-more">•••</span>
                  </div>
                  <h3>{item.rawProduct}</h3>
                  <p>{item.marketName || "Market"}{item.marketplaceName ? ` · ${item.marketplaceName}` : ""}</p>
                  <div className="dashboard-product-status">
                    <span>No new change detected</span>
                    <strong>{item.next_check_at ? "Scheduled" : "Monitoring queue"}</strong>
                  </div>
                  <Link href={`/check?product=${encodeURIComponent(item.rawProduct)}&country=${encodeURIComponent(item.marketName || "Germany")}&marketplace=${encodeURIComponent(item.marketplaceName || "Amazon")}`}>
                    Open review →
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="dashboard-empty">
            <span>◎</span>
            <h3>No monitored products yet</h3>
            <p>Run a compliance check and choose “Monitor this product” to create your first monitoring item.</p>
            <Link className="button button-accent" href="/#checker">Check a product</Link>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <div><span>02</span><h2>Saved checks</h2></div>
          <span>{checks.length} total</span>
        </div>

        {checks.length ? (
          <div className="dashboard-check-list">
            {checks.map((item) => {
              const key = `${item.rawProduct}::${item.marketSlug || item.marketName}::${item.marketplaceSlug || item.marketplaceName || ""}`;
              const monitored = monitoredKeys.has(key);
              return (
                <article className="dashboard-check-row" key={key}>
                  <div>
                    <span className="dashboard-check-category">{item.category || "Product check"}</span>
                    <h3>{item.rawProduct}</h3>
                    <p>{item.marketName}{item.marketplaceName ? ` · ${item.marketplaceName}` : ""}</p>
                  </div>
                  <div className="dashboard-check-meta">
                    <span>{item.reviewCount ?? "—"} review areas</span>
                    <span>{monitored ? "● Monitored" : "Needs review"}</span>
                  </div>
                  <Link href={`/check?product=${encodeURIComponent(item.rawProduct)}&country=${encodeURIComponent(item.marketName)}&marketplace=${encodeURIComponent(item.marketplaceName || "Amazon")}`}>Open →</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="dashboard-empty compact">
            <h3>Your saved checks will appear here.</h3>
            <p>Save useful product-market reviews so you can return to them without starting over.</p>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <div><span>03</span><h2>Regulatory change feed</h2></div>
          <span>{changes.length ? `${changes.length} detected` : "No changes yet"}</span>
        </div>

        {changes.length ? (
          <div className="dashboard-change-list">
            {changes.map((item) => (
              <article className="dashboard-change-row" key={item.id}>
                <div>
                  <span className="change-type">{item.change_type || "source_updated"}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary || "Official source content changed and requires review."}</p>
                </div>
                <div className="change-meta">
                  <span>{item.market_slug || "global"}</span>
                  <span>{item.review_status || "needs_review"}</span>
                  {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">Source ↗</a>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty compact">
            <h3>No official-source changes detected yet.</h3>
            <p>Once D1 and the scheduled monitor are connected, SellComply will surface source changes here for review.</p>
          </div>
        )}
      </section>

      <section className="dashboard-upgrade">
        <div>
          <span className="seo-kicker"><i /> COMING NEXT</span>
          <h2>Turn monitoring into alerts.</h2>
          <p>Once account-based persistence and rule-change ingestion are connected, monitored products can surface meaningful compliance changes automatically.</p>
        </div>
        <div className="dashboard-upgrade-list">
          <span>✓ Change history</span>
          <span>✓ Email alerts</span>
          <span>✓ Team workspace</span>
          <span>✓ Partner actions</span>
        </div>
      </section>
    </>
  );
}

"use client";

import { useState } from "react";

export default function MonitorButton({
  product,
  market,
  marketplace,
}: {
  product: string;
  market: string;
  marketplace?: string;
}) {
  const [saved, setSaved] = useState(false);

  const save = () => {
    const key = "sellcomply-monitored-products";
    const current = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
    const item = {
      product,
      market,
      marketplace: marketplace || null,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify([item, ...current].slice(0, 25)));
    setSaved(true);
  };

  return (
    <button className={saved ? "monitor-button saved" : "monitor-button"} onClick={save}>
      <span>{saved ? "✓" : "◎"}</span>
      <div>
        <strong>{saved ? "Saved to this browser" : "Monitor this product"}</strong>
        <small>{saved ? "Account-based monitoring comes next." : "Save this product-market check for follow-up."}</small>
      </div>
    </button>
  );
}

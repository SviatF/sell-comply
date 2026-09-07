"use client";

import Link from "next/link";
import { useState } from "react";

export default function ReportToolbar({ checkHref }: { checkHref: string }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const share = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: "SellComply Compliance Report",
        text: "Product compliance screening report",
        url: window.location.href,
      });
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // User cancellation is not an error state for the report.
    }
  };

  return (
    <div className="report-toolbar no-print">
      <Link href={checkHref}>← Back to checker</Link>
      <div>
        <button type="button" onClick={copyLink}>
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <button type="button" onClick={share}>
          {shared ? "Shared ✓" : "Share"}
        </button>
        <button className="report-print-button" type="button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}

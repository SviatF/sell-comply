"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics-client";
import { ACCESS_COPY } from "@/lib/access-policy";

export default function ReportToolbar({ checkHref }: { checkHref: string }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      trackEvent("report_share", { metadata: { method: "copy_link" } });
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
      trackEvent("report_share", { metadata: { method: "native_share" } });
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // User cancellation is not an error state for the report.
    }
  };

  return (
    <div className="report-toolbar no-print">
      <div className="report-toolbar-access">
        <Link href={checkHref}>← Back to checker</Link>
        <span>{ACCESS_COPY.report}</span>
      </div>
      <div>
        <button type="button" onClick={copyLink}>
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <button type="button" onClick={share}>
          {shared ? "Shared ✓" : "Share"}
        </button>
        <button
          className="report-print-button"
          type="button"
          onClick={() => {
            trackEvent("report_print");
            window.print();
          }}
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}

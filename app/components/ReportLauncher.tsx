"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics-client";

export default function ReportLauncher({
  href,
  productSlug,
  marketSlug,
  marketplaceSlug,
}: {
  href: string;
  productSlug?: string;
  marketSlug?: string;
  marketplaceSlug?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      const url = new URL(href, window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      trackEvent("report_share", {
        productSlug,
        marketSlug,
        marketplaceSlug,
        metadata: { method: "copy_link" },
      });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="report-launcher">
      <div>
        <span className="seo-kicker"><i /> SHAREABLE REPORT</span>
        <strong>Turn this screening into a clean compliance brief.</strong>
        <p>Open a focused report you can share, print, or save as PDF.</p>
      </div>
      <div className="report-launcher-actions">
        <button type="button" onClick={copy}>
          {copied ? "Link copied ✓" : "Copy report link"}
        </button>
        <Link
          href={href}
          onClick={() =>
            trackEvent("report_open", {
              productSlug,
              marketSlug,
              marketplaceSlug,
            })
          }
        >
          Open report →
        </Link>
      </div>
    </div>
  );
}

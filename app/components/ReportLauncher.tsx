"use client";

import Link from "next/link";
import { useState } from "react";

export default function ReportLauncher({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      const url = new URL(href, window.location.origin).toString();
      await navigator.clipboard.writeText(url);
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
        <Link href={href}>Open report →</Link>
      </div>
    </div>
  );
}

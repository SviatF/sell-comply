"use client";

import { useState } from "react";
import Link from "next/link";

export default function UnsubscribeClient({ token }: { token: string }) {
  const [state, setState] = useState<"ready" | "working" | "done" | "error">("ready");

  const unsubscribe = async () => {
    if (state === "working" || state === "done") return;
    setState("working");

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();

      if (!response.ok || !result?.ok) throw new Error("unsubscribe failed");
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="unsubscribe-card">
      <span className="seo-kicker"><i /> EMAIL PREFERENCES</span>
      <h1>{state === "done" ? "Alerts stopped." : "Stop compliance alerts?"}</h1>
      <p>
        {state === "done"
          ? "This email address will no longer receive SellComply monitoring alerts."
          : "This will unsubscribe the email address attached to your SellComply product monitors. Your saved checks are not affected."}
      </p>

      {state === "done" ? (
        <Link className="button button-light" href="/">Back to SellComply</Link>
      ) : (
        <button className="button button-accent" onClick={unsubscribe} disabled={state === "working"}>
          {state === "working" ? "Unsubscribing…" : "Unsubscribe from alerts"}
        </button>
      )}

      {state === "error" && (
        <p className="unsubscribe-error">We couldn't update your preferences. Please try again.</p>
      )}
    </div>
  );
}

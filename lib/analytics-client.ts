import { getVisitorId } from "@/lib/visitor";

export function trackEvent(
  eventName: string,
  data: {
    productSlug?: string;
    marketSlug?: string;
    marketplaceSlug?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    visitorId: getVisitorId(),
    eventName,
    path: window.location.pathname,
    ...data,
  });

  try {
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never block product actions.
  }
}

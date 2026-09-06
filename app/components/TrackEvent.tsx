"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics-client";

export default function TrackEvent({
  eventName,
  productSlug,
  marketSlug,
  marketplaceSlug,
  metadata,
}: {
  eventName: string;
  productSlug?: string;
  marketSlug?: string;
  marketplaceSlug?: string;
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    trackEvent(eventName, { productSlug, marketSlug, marketplaceSlug, metadata });
  }, [eventName, productSlug, marketSlug, marketplaceSlug]);

  return null;
}

import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PREFIXES, SITE_ORIGIN } from "@/lib/seo-indexation-policy";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PREFIXES],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}

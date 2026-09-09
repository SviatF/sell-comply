import type { MetadataRoute } from "next";
import { indexableRoutes } from "@/lib/indexable-routes";

const baseUrl = "https://sellcomply.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return indexableRoutes.map((route) => ({
    url: route.path === "/" ? baseUrl : `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

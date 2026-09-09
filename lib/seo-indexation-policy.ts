import { indexableRoutes } from "./indexable-routes";

export const SITE_ORIGIN = "https://sellcomply.com";

export const ROBOTS_DISALLOW_PREFIXES = ["/api/"] as const;

export const NOINDEX_PAGE_POLICIES = [
  { path: "/check", follow: true },
  { path: "/dashboard", follow: true },
  { path: "/report", follow: false },
  { path: "/ops/review", follow: false },
  { path: "/unsubscribe/", follow: false, prefix: true },
] as const;

export const X_ROBOTS_HEADER_ROUTES = [
  { source: "/check", value: "noindex, follow, noarchive" },
  { source: "/dashboard", value: "noindex, follow, noarchive" },
  { source: "/report", value: "noindex, nofollow, noarchive" },
  { source: "/ops/:path*", value: "noindex, nofollow, noarchive" },
  { source: "/unsubscribe/:path*", value: "noindex, nofollow, noarchive" },
  { source: "/api/:path*", value: "noindex, nofollow, noarchive" },
] as const;

const indexablePathSet = new Set(indexableRoutes.map((route) => route.path));

export function isIndexableSeoPath(path: string) {
  return indexablePathSet.has(path);
}

export function getNoindexPolicy(path: string) {
  return NOINDEX_PAGE_POLICIES.find((policy) =>
    "prefix" in policy && policy.prefix
      ? path.startsWith(policy.path)
      : path === policy.path
  );
}

export function isRobotsDisallowed(path: string) {
  return ROBOTS_DISALLOW_PREFIXES.some((prefix) => path.startsWith(prefix));
}

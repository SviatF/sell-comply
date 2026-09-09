import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { indexableRoutes } from "../lib/indexable-routes";
import {
  NOINDEX_PAGE_POLICIES,
  ROBOTS_DISALLOW_PREFIXES,
  SITE_ORIGIN,
  X_ROBOTS_HEADER_ROUTES,
  getNoindexPolicy,
  isIndexableSeoPath,
  isRobotsDisallowed,
} from "../lib/seo-indexation-policy";

const indexablePaths = indexableRoutes.map((route) => route.path);
const indexableSet = new Set(indexablePaths);

const noindexPageFiles = [
  { path: "/check", file: "app/check/page.tsx", follow: true },
  { path: "/dashboard", file: "app/dashboard/page.tsx", follow: true },
  { path: "/report", file: "app/report/page.tsx", follow: false },
  { path: "/ops/review", file: "app/ops/review/page.tsx", follow: false },
  {
    path: "/unsubscribe/example-token",
    file: "app/unsubscribe/[token]/page.tsx",
    follow: false,
  },
] as const;

describe("SEO Batch 1 — crawl and indexation quality gate", () => {
  it("keeps the exact 101 public SEO URLs indexable and policy-separated", () => {
    expect(indexablePaths).toHaveLength(101);
    expect(new Set(indexablePaths).size).toBe(101);

    for (const path of indexablePaths) {
      expect(isIndexableSeoPath(path), path).toBe(true);
      expect(getNoindexPolicy(path), path).toBeUndefined();
      expect(isRobotsDisallowed(path), path).toBe(false);
    }
  });

  it("keeps workflow/private pages out of the indexable manifest", () => {
    for (const item of noindexPageFiles) {
      expect(indexableSet.has(item.path), item.path).toBe(false);
      expect(isIndexableSeoPath(item.path), item.path).toBe(false);
      expect(getNoindexPolicy(item.path), item.path).toBeTruthy();
    }
  });

  it("lets crawlers reach noindex HTML pages so they can read the directive", () => {
    for (const item of noindexPageFiles) {
      expect(isRobotsDisallowed(item.path), item.path).toBe(false);
    }

    expect(ROBOTS_DISALLOW_PREFIXES).toEqual(["/api/"]);
  });

  it("requires explicit noindex metadata and clears inherited homepage canonicals", () => {
    for (const item of noindexPageFiles) {
      const source = readFileSync(item.file, "utf8");

      expect(source, item.file).toContain("robots: { index: false");
      expect(source, item.file).toContain(`follow: ${item.follow}`);
      expect(source, item.file).toContain(
        "alternates: { canonical: null }"
      );
    }
  });

  it("adds an X-Robots-Tag defense layer for every non-indexable route family", () => {
    const expected = new Map([
      ["/check", "noindex, follow, noarchive"],
      ["/dashboard", "noindex, follow, noarchive"],
      ["/report", "noindex, nofollow, noarchive"],
      ["/ops/:path*", "noindex, nofollow, noarchive"],
      ["/unsubscribe/:path*", "noindex, nofollow, noarchive"],
      ["/api/:path*", "noindex, nofollow, noarchive"],
    ]);

    expect(X_ROBOTS_HEADER_ROUTES).toHaveLength(expected.size);

    for (const route of X_ROBOTS_HEADER_ROUTES) {
      expect(route.value, route.source).toBe(expected.get(route.source));
    }
  });

  it("wires X-Robots-Tag headers into Next.js response configuration", () => {
    const source = readFileSync("next.config.ts", "utf8");

    expect(source).toContain("X_ROBOTS_HEADER_ROUTES");
    expect(source).toContain('key: "X-Robots-Tag"');
    expect(source).toContain("value: route.value");
  });

  it("keeps robots.txt focused on crawl-budget protection, not noindex pages", () => {
    const source = readFileSync("app/robots.ts", "utf8");

    expect(source).toContain("ROBOTS_DISALLOW_PREFIXES");
    expect(source).toContain('userAgent: "*"');
    expect(source).toContain('allow: "/"');
    expect(source).toContain("disallow: [...ROBOTS_DISALLOW_PREFIXES]");
    expect(source).toContain(`sitemap: \`${SITE_ORIGIN}/sitemap.xml\``);
    expect(source).toContain("host: SITE_ORIGIN");

    for (const item of noindexPageFiles) {
      expect(ROBOTS_DISALLOW_PREFIXES.some((prefix) => item.path.startsWith(prefix))).toBe(
        false
      );
    }
  });

  it("blocks API crawl/indexation without blocking render assets", () => {
    expect(isRobotsDisallowed("/api/health")).toBe(true);
    expect(isRobotsDisallowed("/api/admin/kb/rules")).toBe(true);
    expect(isRobotsDisallowed("/api/checks")).toBe(true);

    expect(isRobotsDisallowed("/_next/static/chunk.js")).toBe(false);
    expect(isRobotsDisallowed("/products")).toBe(false);
  });

  it("forces unknown programmatic SEO combinations to resolve as 404s", () => {
    for (const file of [
      "app/sell/[product]/[country]/page.tsx",
      "app/marketplaces/[marketplace]/[product]/page.tsx",
    ]) {
      const source = readFileSync(file, "utf8");

      expect(source, file).toContain("export const dynamicParams = false");
      expect(source, file).toContain("generateStaticParams");
      expect(source, file).toContain("notFound()");
    }
  });

  it("keeps sitemap generation bound only to the indexable manifest", () => {
    const sitemap = readFileSync("app/sitemap.ts", "utf8");

    expect(sitemap).toContain("indexableRoutes.map");
    expect(sitemap).toContain('const baseUrl = "https://sellcomply.com"');

    for (const policy of NOINDEX_PAGE_POLICIES) {
      expect(indexablePaths.some((path) => path === policy.path)).toBe(false);
    }

    expect(SITE_ORIGIN).toBe("https://sellcomply.com");
  });
});

import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { X_ROBOTS_HEADER_ROUTES } from "./lib/seo-indexation-policy";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return X_ROBOTS_HEADER_ROUTES.map((route) => ({
      source: route.source,
      headers: [{ key: "X-Robots-Tag", value: route.value }],
    }));
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();

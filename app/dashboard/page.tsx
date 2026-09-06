import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";

export const metadata: Metadata = {
  title: "Compliance Dashboard",
  description: "Manage saved product compliance checks and monitored markets in SellComply.",
  robots: { index: false, follow: true },
};

export default function DashboardPage() {
  return (
    <div className="seo-page dashboard-page">
      <SeoHeader />
      <main className="dashboard-main">
        <DashboardClient />
      </main>
      <SeoFooter />
    </div>
  );
}

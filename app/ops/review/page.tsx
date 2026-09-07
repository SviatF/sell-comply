import type { Metadata } from "next";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";
import ReviewClient from "./ReviewClient";

export const metadata: Metadata = {
  title: "SellComply Regulatory Review",
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <div className="seo-page ops-page">
      <SeoHeader />
      <main className="ops-main">
        <ReviewClient />
      </main>
      <SeoFooter />
    </div>
  );
}

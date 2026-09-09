import type { Metadata } from "next";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";
import UnsubscribeClient from "./UnsubscribeClient";

export const metadata: Metadata = {
  title: "Unsubscribe from SellComply Alerts",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="seo-page unsubscribe-page">
      <SeoHeader />
      <main className="unsubscribe-main">
        <UnsubscribeClient token={token} />
      </main>
      <SeoFooter />
    </div>
  );
}

import type { Metadata } from "next";
import TrustPolicyPage from "@/app/components/TrustPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SellComply handles browser identifiers, saved checks, monitoring emails, product inputs, analytics events and contact messages.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <TrustPolicyPage
      eyebrow="PRIVACY POLICY"
      title="Privacy for a"
      accent="guest-first product."
      lead="SellComply is designed so the core checker, result, save flow, dashboard and report can work without creating an account. This policy explains the data the current product uses to provide those features."
      lastUpdated="9 September 2026"
      summary="No forced account. Email is requested only for monitoring alerts or when you choose to contact us."
      sections={[
        {
          title: "Information you provide",
          bullets: [
            "Product descriptions and public product URLs submitted to the checker",
            "Product facts you confirm in the refinement flow",
            "Target market and optional marketplace selections",
            "Email address when you explicitly enable compliance monitoring",
            "Name, email, topic and message when you submit the contact form",
          ],
        },
        {
          title: "Browser workspace data",
          paragraphs: [
            "SellComply creates an anonymous browser identifier and uses browser storage for saved checks, monitored-product state and remembered monitoring email. This lets the guest dashboard work without a login.",
          ],
        },
        {
          title: "Product analytics",
          paragraphs: [
            "The current product records limited first-party product events such as checker starts/completions, refinement, save, monitoring, dashboard opens, market comparisons and report actions. Event records can include the anonymous browser identifier, page path and product/market slugs.",
          ],
        },
        {
          title: "How information is used",
          bullets: [
            "Provide the requested compliance screening",
            "Persist saved checks and monitoring state",
            "Deliver monitoring alerts when enabled",
            "Understand product usage and improve the workflow",
            "Respond to contact and correction requests",
            "Protect and operate the service",
          ],
        },
        {
          title: "Storage and service infrastructure",
          paragraphs: [
            "Where configured, SellComply uses Cloudflare infrastructure and D1 storage for server-side records such as checks, monitoring subscriptions, events, regulatory data and contact submissions. Browser-local data remains on the user’s device unless a server sync path is used.",
          ],
        },
        {
          title: "Retention and deletion",
          paragraphs: [
            "Data is retained only while operationally useful for the feature or legal/administrative need that created it. Monitoring emails can be unsubscribed from alert communications. Requests about access or deletion can be submitted through the contact page.",
          ],
        },
        {
          title: "Third-party and public URLs",
          paragraphs: [
            "If you submit a public product URL, SellComply may retrieve the public page to resolve product information. Do not submit private URLs, credentials or information you are not authorized to provide.",
          ],
        },
        {
          title: "Children",
          paragraphs: [
            "SellComply is a business/product-compliance tool and is not designed for children. Do not knowingly submit personal information about children through the service.",
          ],
        },
      ]}
    />
  );
}

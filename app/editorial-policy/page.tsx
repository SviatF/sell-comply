import type { Metadata } from "next";
import TrustPolicyPage from "@/app/components/TrustPolicyPage";

export const metadata: Metadata = {
  title: "Editorial and Compliance Content Policy",
  description: "SellComply standards for regulatory claims, uncertainty, marketplace content, automated processing and compliance guidance.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <TrustPolicyPage
      eyebrow="EDITORIAL POLICY"
      title="Accuracy over"
      accent="certainty theater."
      lead="SellComply content is written to help sellers make better first-pass decisions without pretending that a generic page, automated classifier or single source can replace exact product analysis."
      lastUpdated="9 September 2026"
      summary="No fabricated certainty, no invented certifications, and no marketplace policy presented as law."
      sections={[
        {
          title: "Core editorial standard",
          bullets: [
            "State what the available evidence supports",
            "Separate legal requirements from marketplace requirements",
            "Distinguish required, likely and verify states",
            "Preserve uncertainty where exact facts are missing",
            "Link material regulatory claims to official sources where structured coverage exists",
          ],
        },
        {
          title: "Automated and structured content",
          paragraphs: [
            "SellComply uses automated classification, structured rule matching and templated content to scale product-market screening. Automation may organize or transform regulatory information, but it must not invent a requirement, certification, regulator position or effective date.",
          ],
        },
        {
          title: "Programmatic SEO pages",
          paragraphs: [
            "Indexable product-market and marketplace pages must provide distinct useful information for the specific search intent. Thin pages, duplicate boilerplate and unsupported long-tail claims should not be published merely to increase URL count.",
          ],
        },
        {
          title: "Marketplace content",
          paragraphs: [
            "Marketplace eligibility is a separate layer from legal product compliance. Platform approval, listing acceptance or a document request must never be presented as proof that a product is lawful to sell in the destination market.",
          ],
        },
        {
          title: "High-risk categories and edge cases",
          paragraphs: [
            "Products with medical, chemical, child-safety, electrical, radio, battery or other specialized regulatory exposure may require deeper analysis than the current checker can provide. The content should explicitly direct users to verify unresolved high-impact issues.",
          ],
        },
        {
          title: "Commercial influence",
          paragraphs: [
            "Current trust and regulatory content is not ranked by sponsor payment. If paid placements, partner referrals or commercial relationships are introduced later, they should be labeled and kept separate from the regulatory basis of a screening result.",
          ],
        },
      ]}
    />
  );
}

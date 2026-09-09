import type { Metadata } from "next";
import TrustPolicyPage from "@/app/components/TrustPolicyPage";

export const metadata: Metadata = {
  title: "Compliance Disclaimer",
  description: "Important limitations of SellComply product-compliance screening, risk scores, reports, marketplace checks and regulatory guidance.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <TrustPolicyPage
      eyebrow="COMPLIANCE DISCLAIMER"
      title="Screening is not"
      accent="approval."
      lead="SellComply helps identify regulatory review areas and evidence gaps. It cannot determine every legal obligation without the exact product, claims, supply chain, jurisdiction, test evidence and current regulator interpretation."
      lastUpdated="9 September 2026"
      summary="Use SellComply to identify what to verify — not as a substitute for the verification itself."
      sections={[
        {
          title: "Not legal advice",
          paragraphs: [
            "SellComply provides product-compliance intelligence and workflow guidance. Nothing in the checker, SEO pages, reports, monitoring alerts or other content is legal advice or legal representation.",
          ],
        },
        {
          title: "Not certification or approval",
          paragraphs: [
            "A SellComply result does not certify a product, approve a listing, issue a declaration of conformity, perform laboratory testing or represent a decision by a regulator, notified body, certification body or marketplace.",
          ],
        },
        {
          title: "Risk score meaning",
          paragraphs: [
            "The 0–100 risk score is a screening-complexity signal based on rule density, product characteristics and uncertainty. It is not a probability that a product is illegal, unsafe or non-compliant.",
          ],
        },
        {
          title: "Product facts matter",
          paragraphs: [
            "Small changes in intended use, age grading, electrical design, radio module, battery chemistry, formulation, claims, packaging, importer role or destination market can materially change the applicable rules.",
          ],
        },
        {
          title: "Rules change",
          paragraphs: [
            "Regulations, guidance, standards and marketplace policies can change. Always verify high-impact decisions against the current official source and obtain specialist support where the consequence of error is significant.",
          ],
        },
        {
          title: "Reports are screening snapshots",
          paragraphs: [
            "Shareable report URLs recreate a screening from the supplied product, market, marketplace and confirmed facts using the current SellComply rule set. They are not immutable legal opinions or frozen regulatory records.",
          ],
        },
      ]}
    />
  );
}

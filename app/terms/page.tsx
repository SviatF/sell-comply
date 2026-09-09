import type { Metadata } from "next";
import TrustPolicyPage from "@/app/components/TrustPolicyPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the SellComply product-compliance checker, reports, monitoring and related content.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <TrustPolicyPage
      eyebrow="TERMS OF USE"
      title="Use SellComply as"
      accent="a screening tool."
      lead="These Terms govern use of the current SellComply website, checker, saved workspace, monitoring features, reports and informational compliance content."
      lastUpdated="9 September 2026"
      summary="The current service provides informational compliance intelligence, not legal advice, certification or approval."
      sections={[
        {
          title: "Acceptance and scope",
          paragraphs: [
            "By using SellComply, you agree to use the service in accordance with these Terms and applicable law. The current public checker is offered as an informational product-compliance screening tool.",
          ],
        },
        {
          title: "No legal or certification service",
          paragraphs: [
            "SellComply does not provide legal advice, legal representation, certification, conformity assessment, laboratory testing, regulator approval or a guarantee that a product may lawfully be sold.",
          ],
        },
        {
          title: "Your responsibility",
          bullets: [
            "Provide accurate product information",
            "Verify high-impact decisions against current official sources",
            "Obtain professional, testing or certification support when required",
            "Confirm that you have permission to submit any product URL or information",
            "Comply with the laws and marketplace rules applicable to your business",
          ],
        },
        {
          title: "Prohibited use",
          bullets: [
            "Attempting to disrupt, abuse or bypass service controls",
            "Submitting malicious code, credentials or private third-party data",
            "Using SellComply output to falsely claim certification, regulator approval or guaranteed legal compliance",
            "Copying or reselling the service in a way that infringes SellComply or third-party rights",
          ],
        },
        {
          title: "Third-party sources and marketplaces",
          paragraphs: [
            "SellComply links to official and third-party pages for verification. Those sites and marketplaces control their own content, availability and policies. A link does not mean SellComply controls or guarantees the linked material.",
          ],
        },
        {
          title: "Service availability and changes",
          paragraphs: [
            "Features, supported markets, rule coverage and monitoring behavior can change as the product evolves. SellComply may correct, suspend or modify features where needed for quality, security or maintenance.",
          ],
        },
        {
          title: "Limitation of reliance",
          paragraphs: [
            "You remain responsible for commercial and compliance decisions made using SellComply. To the extent permitted by applicable law, the service is provided without a guarantee that every rule, exemption, effective date or product classification is complete for every circumstance.",
          ],
        },
      ]}
    />
  );
}

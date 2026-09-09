import type { Metadata } from "next";
import Link from "next/link";
import TrustPolicyPage from "@/app/components/TrustPolicyPage";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description: "How to report a possible regulatory error and how SellComply reviews and corrects compliance content.",
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  return (
    <TrustPolicyPage
      eyebrow="CORRECTIONS POLICY"
      title="Errors should be"
      accent="correctable."
      lead="Regulations change, source pages move and product scope can be misclassified. SellComply treats correction handling as part of the compliance workflow, not as an afterthought."
      lastUpdated="9 September 2026"
      summary="Report → triage → source verification → correction → review metadata."
      sections={[
        {
          title: "What to report",
          bullets: [
            "A requirement that appears legally incorrect or outdated",
            "A wrong effective or transition date",
            "A source link that no longer supports the claim",
            "A product or market rule applied to the wrong scope",
            "A marketplace policy presented inaccurately",
            "A misleading statement of certainty or risk",
          ],
        },
        {
          title: "How corrections are reviewed",
          paragraphs: [
            "A correction should be checked against the current primary source and the exact rule-pack scope. If the underlying regulatory rule changes, the structured rule record should be versioned rather than silently replacing historical state.",
          ],
        },
        {
          title: "Material corrections",
          paragraphs: [
            "A material correction is one that could change a seller’s interpretation of applicability, evidence, labeling, effective timing or launch decision. Those corrections should update the relevant content and regulatory review state as appropriate.",
          ],
        },
        {
          title: "Source changes are not automatically corrections",
          paragraphs: [
            "A changed official webpage can reflect formatting, navigation or editorial edits rather than a legal change. Detected changes therefore enter a review workflow before seller-facing rules are updated.",
          ],
        },
      ]}
    >
      <section className="trust-policy-action">
        <h2>Report a possible correction</h2>
        <p>Use the contact form and choose <b>Correction / regulatory issue</b>. Include the affected page, product, market and official source when possible.</p>
        <Link className="button button-accent" href="/contact">Open contact form →</Link>
      </section>
    </TrustPolicyPage>
  );
}

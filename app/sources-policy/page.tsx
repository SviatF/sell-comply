import type { Metadata } from "next";
import TrustPolicyPage from "@/app/components/TrustPolicyPage";

export const metadata: Metadata = {
  title: "Sources Policy",
  description: "How SellComply selects, links, monitors and verifies regulatory sources used in product-compliance screening.",
  alternates: { canonical: "/sources-policy" },
};

export default function SourcesPolicyPage() {
  return (
    <TrustPolicyPage
      eyebrow="SOURCES POLICY"
      title="Sources before"
      accent="assertions."
      lead="SellComply is designed to make high-impact compliance claims traceable. Where structured coverage exists, rule packs link back to regulator, legislation or other primary official material rather than relying on unsupported summaries."
      lastUpdated="9 September 2026"
      summary="Primary and official sources are preferred; secondary material is contextual, not a substitute for authority."
      sections={[
        {
          title: "Source hierarchy",
          bullets: [
            "Legislation and official legal texts",
            "Regulator and government guidance",
            "Official standards or conformity guidance where publicly available",
            "Official marketplace policy pages for platform-specific requirements",
            "Secondary sources only for context or discovery, never as the sole basis for a high-impact rule when an authoritative source is available",
          ],
        },
        {
          title: "What counts as an official source",
          paragraphs: [
            "SellComply treats a source as official when it is published by the competent legislature, government body, regulator, standards/conformity authority or marketplace responsible for the requirement being described.",
          ],
        },
        {
          title: "Rule-to-source linkage",
          paragraphs: [
            "Structured regulatory rules store source labels and canonical URLs. The knowledge base also maintains source registry records and rule-to-source relationships so a rule can be traced to the material that supports it.",
          ],
        },
        {
          title: "Freshness and monitoring",
          paragraphs: [
            "Official pages can change without warning. SellComply tracks source checks and content fingerprints where monitoring is available. A changed source can create a review event rather than automatically changing a seller-facing rule.",
          ],
        },
        {
          title: "Conflicts and ambiguous guidance",
          paragraphs: [
            "If official sources conflict, are unclear, or leave product scope unresolved, SellComply should surface the uncertainty instead of choosing the most convenient interpretation. High-impact ambiguity should be escalated to current regulator guidance or a qualified professional.",
          ],
        },
        {
          title: "Broken, moved or inaccessible sources",
          paragraphs: [
            "A broken source link does not automatically invalidate the underlying rule, but it reduces verification quality. The source should be replaced with the current canonical official page or the rule should be marked for review.",
          ],
        },
      ]}
    />
  );
}

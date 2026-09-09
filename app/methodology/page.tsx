import type { Metadata } from "next";
import TrustPolicyPage from "@/app/components/TrustPolicyPage";

export const metadata: Metadata = {
  title: "How SellComply Works — Methodology",
  description: "See how SellComply turns product facts, market context, rule packs and official sources into a structured compliance screening.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <TrustPolicyPage
      eyebrow="METHODOLOGY"
      title="How SellComply"
      accent="works."
      lead="SellComply is a structured screening system. It does not start from a generic legal answer; it starts from the exact product facts, target market and optional marketplace, then maps those inputs against curated rule packs and source-backed review areas."
      lastUpdated="9 September 2026"
      summary="Product facts → classification → rule matching → risk signal → evidence gaps → source verification."
      sections={[
        {
          title: "1. Product input and resolution",
          paragraphs: [
            "A screening starts with either a product description or a public product URL. When a URL can be resolved safely, SellComply extracts available product identity and structured product data. When it cannot, the supplied text remains the fallback input.",
          ],
          bullets: [
            "Product title and category signals",
            "Brand, SKU and GTIN when exposed by the source page",
            "Technical feature signals such as radio, battery, mains power, children’s use and cosmetics",
            "Target market and optional marketplace",
          ],
        },
        {
          title: "2. Classification and user-confirmed facts",
          paragraphs: [
            "The classification layer maps the input to a supported product category and records confidence. Users can then confirm or override high-impact facts such as Bluetooth/radio, battery, children’s use, mains power and supply-chain role.",
            "Unknown facts remain visible. SellComply does not silently convert uncertainty into a definitive compliance conclusion.",
          ],
        },
        {
          title: "3. Structured rule matching",
          paragraphs: [
            "The engine matches the product and market against versioned regulatory rule packs. Rule packs can be scoped by market, product category, required features, exclusions and effective or transition dates.",
          ],
          bullets: [
            "Required — a strong applicability trigger is present",
            "Likely — the rule is commonly relevant but exact scope still needs confirmation",
            "Verify — applicability, exemptions, transition timing or product facts remain open",
            "Platform — marketplace-specific review layer, separate from legal market access",
          ],
        },
        {
          title: "4. Screening risk signal",
          paragraphs: [
            "The risk score is a transparent screening-complexity signal, not a probability of illegality or non-compliance. It combines weighted product category complexity, matched rule packs, technical features, unresolved facts, classification confidence, fallback coverage and marketplace layers.",
          ],
          bullets: [
            "Higher-scrutiny product categories contribute more points",
            "Required and likely rule packs add regulatory complexity",
            "Radio, batteries, children’s use and mains power add feature-specific weight",
            "Unknown facts and low classification confidence add uncertainty",
            "The score is capped at 100 and mapped to low, moderate, high or critical screening complexity",
          ],
          note: "A lower score does not mean a product is compliant. A higher score does not mean a product is prohibited.",
        },
        {
          title: "5. Evidence and action plan",
          paragraphs: [
            "Matched rule packs feed the documents, labels, product-information items, open questions and action plan shown in the result. Evidence is tied to the exact product-market combination so sellers can see what to collect before listing, importing or scaling.",
          ],
        },
        {
          title: "6. Official sources and freshness",
          paragraphs: [
            "Supported rules are linked to primary regulator or official legal sources. The knowledge base stores rule versions, source relationships, review state, effective dates and source-change information so changes can be reviewed instead of silently overwriting previous requirements.",
          ],
        },
        {
          title: "7. Human review and limitations",
          paragraphs: [
            "SellComply has a regulatory review workflow for curated rule packs and detected source changes, but the checker is still an informational screening product. It does not replace legal counsel, accredited testing, conformity assessment, notified bodies, certification bodies or regulators.",
          ],
        },
      ]}
    />
  );
}

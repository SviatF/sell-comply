import type { Metadata } from "next";
import TrustPolicyPage from "@/app/components/TrustPolicyPage";
import ContactForm from "@/app/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact SellComply",
  description: "Contact SellComply about product coverage, regulatory corrections, privacy requests or business questions.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <TrustPolicyPage
      eyebrow="CONTACT"
      title="Send the issue with"
      accent="context."
      lead="For compliance corrections and product questions, the most useful message includes the exact product, target market, affected page and official source you believe should be reviewed."
      lastUpdated="9 September 2026"
      summary="Contact submissions are stored for follow-up; they do not create a SellComply account."
      sections={[
        {
          title: "Best use of this form",
          bullets: [
            "Report a possible regulatory or source error",
            "Request product or market coverage",
            "Ask about saved checks or monitoring behavior",
            "Submit a privacy or data request",
            "Discuss a business or partnership question",
          ],
        },
        {
          title: "For product-specific legal decisions",
          paragraphs: [
            "The contact form is not a legal-advice channel. If the issue requires a binding legal interpretation, certification, laboratory testing or regulator approval, use an appropriately qualified professional or authority.",
          ],
        },
      ]}
    >
      <section className="trust-policy-action contact-action">
        <h2>Contact SellComply</h2>
        <ContactForm />
      </section>
    </TrustPolicyPage>
  );
}

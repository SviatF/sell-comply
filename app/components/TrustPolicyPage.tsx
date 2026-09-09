import Link from "next/link";
import type { ReactNode } from "react";
import { SeoFooter, SeoHeader } from "@/app/components/SeoChrome";

export type TrustSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
};

type Props = {
  eyebrow: string;
  title: string;
  accent?: string;
  lead: string;
  lastUpdated: string;
  summary: string;
  sections: TrustSection[];
  children?: ReactNode;
};

const trustLinks = [
  ["/about", "About"],
  ["/methodology", "Methodology"],
  ["/sources-policy", "Sources policy"],
  ["/editorial-policy", "Editorial policy"],
  ["/corrections", "Corrections"],
  ["/contact", "Contact"],
  ["/privacy", "Privacy"],
  ["/terms", "Terms"],
  ["/disclaimer", "Disclaimer"],
] as const;

export default function TrustPolicyPage({
  eyebrow,
  title,
  accent,
  lead,
  lastUpdated,
  summary,
  sections,
  children,
}: Props) {
  return (
    <div className="seo-page trust-page">
      <SeoHeader />
      <main className="seo-main trust-policy-main">
        <div className="breadcrumbs">
          <Link href="/">Home</Link><span>/</span><Link href="/about">Trust</Link><span>/</span><span>{title}</span>
        </div>

        <section className="trust-policy-hero">
          <div>
            <span className="seo-kicker"><i /> {eyebrow}</span>
            <h1>{title}{accent ? <> <em>{accent}</em></> : null}</h1>
            <p className="seo-lead">{lead}</p>
          </div>
          <aside className="trust-review-card">
            <span>PUBLIC TRUST DOCUMENT</span>
            <strong>{summary}</strong>
            <div>
              <small>Review owner</small>
              <b>SellComply product & regulatory workflow</b>
            </div>
            <div>
              <small>Last reviewed</small>
              <b>{lastUpdated}</b>
            </div>
          </aside>
        </section>

        <div className="trust-policy-layout">
          <article className="trust-policy-article">
            {sections.map((section, index) => (
              <section className="trust-policy-section" key={section.title}>
                <div className="trust-policy-section-head">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{section.title}</h2>
                </div>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets?.length ? (
                  <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : null}
                {section.note ? <div className="trust-policy-note">{section.note}</div> : null}
              </section>
            ))}
            {children}
          </article>

          <aside className="trust-policy-nav">
            <span>TRUST CENTER</span>
            {trustLinks.map(([href, label]) => <Link href={href} key={href}>{label}<b>→</b></Link>)}
            <Link className="trust-policy-checker" href="/#checker">Check a product <b>→</b></Link>
          </aside>
        </div>
      </main>
      <SeoFooter />
    </div>
  );
}

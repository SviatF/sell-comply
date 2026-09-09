import Link from "next/link";
import { SEO_FOOTER_LEGAL_LINKS, SEO_FOOTER_PRIMARY_LINKS, SEO_HEADER_LINKS } from "@/lib/seo-internal-links";

export function SeoHeader() {
  return (
    <header className="seo-header">
      <Link className="brand" href="/" aria-label="SellComply home">
        <span className="brand-mark" aria-hidden="true"><span /><span /></span>
        <span>Sell<span>Comply</span></span>
      </Link>
      <nav className="seo-nav">
        {SEO_HEADER_LINKS.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/#checker">Checker</Link>
      </nav>
      <Link className="button button-light seo-header-cta" href="/#checker">Check a product</Link>
    </header>
  );
}

export function SeoFooter() {
  return (
    <footer className="seo-footer">
      <div className="seo-footer-brand">
        <strong>© 2026 SellComply</strong>
        <span>Product compliance intelligence</span>
      </div>
      <div className="seo-footer-groups">
        <div className="seo-footer-links">
          {SEO_FOOTER_PRIMARY_LINKS.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        </div>
        <div className="seo-footer-links legal">
          {SEO_FOOTER_LEGAL_LINKS.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
        </div>
      </div>
    </footer>
  );
}

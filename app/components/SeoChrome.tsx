import Link from "next/link";

export function SeoHeader() {
  return (
    <header className="seo-header">
      <Link className="brand" href="/" aria-label="SellComply home">
        <span className="brand-mark" aria-hidden="true"><span /><span /></span>
        <span>Sell<span>Comply</span></span>
      </Link>
      <nav className="seo-nav">
        <Link href="/products">Products</Link>
        <Link href="/markets">Markets</Link>
        <Link href="/marketplaces">Marketplaces</Link>
        <Link href="/about">About</Link>
        <Link href="/methodology">Methodology</Link>
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
          <Link href="/products">Products</Link>
          <Link href="/markets">Markets</Link>
          <Link href="/marketplaces">Marketplaces</Link>
          <Link href="/about">About</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/sources-policy">Sources</Link>
          <Link href="/editorial-policy">Editorial</Link>
          <Link href="/corrections">Corrections</Link>
        </div>
        <div className="seo-footer-links legal">
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </div>
      </div>
    </footer>
  );
}

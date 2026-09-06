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
      <span>© 2026 SellComply · Product compliance intelligence</span>
      <div className="seo-footer-links">
        <Link href="/products">Products</Link>
        <Link href="/markets">Markets</Link>
        <Link href="/marketplaces">Marketplaces</Link>
      </div>
    </footer>
  );
}

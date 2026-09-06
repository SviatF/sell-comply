"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  Globe2,
  Languages,
  Link2,
  LockKeyhole,
  Menu,
  Search,
  ShieldCheck,
  Store,
  Upload,
  X,
} from "lucide-react";

type Mode = "link" | "describe" | "upload";

const countries = [
  { value: "Germany", flag: "🇩🇪", market: "EU" },
  { value: "United States", flag: "🇺🇸", market: "US" },
  { value: "United Kingdom", flag: "🇬🇧", market: "UK" },
  { value: "Canada", flag: "🇨🇦", market: "CA" },
  { value: "Australia", flag: "🇦🇺", market: "AU" },
];

const marketplaces = ["Amazon", "Shopify", "Etsy", "eBay", "TikTok Shop"];

const requirementSets: Record<string, string[]> = {
  Germany: [
    "GPSR applicability",
    "CE marking check",
    "EU Responsible Person",
    "Labeling & warnings",
  ],
  "United States": [
    "Federal product rules",
    "FCC / safety check",
    "State-level requirements",
    "Labeling & warnings",
  ],
  "United Kingdom": [
    "UK product safety",
    "UKCA / CE applicability",
    "Responsible business details",
    "Labeling & warnings",
  ],
  Canada: [
    "Federal product rules",
    "Electrical / radio check",
    "Bilingual labeling",
    "Import documentation",
  ],
  Australia: [
    "Australian safety rules",
    "RCM applicability",
    "Supplier obligations",
    "Labeling & documentation",
  ],
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("link");
  const [product, setProduct] = useState("");
  const [country, setCountry] = useState("Germany");
  const [marketplace, setMarketplace] = useState("Amazon");
  const [checked, setChecked] = useState(false);

  const selectedCountry = useMemo(
    () => countries.find((item) => item.value === country) ?? countries[0],
    [country]
  );

  const requirements = requirementSets[country] ?? requirementSets.Germany;

  const runCheck = () => {
    setChecked(true);
    window.setTimeout(() => {
      document.getElementById("compliance-preview")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 60);
  };

  return (
    <main>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="site-header">
        <a className="brand" href="#" aria-label="SellComply home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>Sell<span>Comply</span></span>
        </a>

        <nav className={menuOpen ? "nav open" : "nav"}>
          <a href="#product">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="/products">Resources</a>
          <a href="#about">About</a>
        </nav>

        <div className="header-actions">
          <button className="language-button" aria-label="Change language">
            <Globe2 size={16} /> EN <ChevronDown size={14} />
          </button>
          <a className="login-link" href="#login">Log in</a>
          <a className="button button-light header-cta" href="#checker">
            Get started free <ArrowRight size={16} />
          </a>
          <button
            className="menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <section className="hero" id="product">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            SELL GLOBALLY. STAY COMPLIANT.
          </div>

          <h1>
            Can I sell
            <span>this product?</span>
          </h1>

          <p className="hero-description">
            Check product regulations, marketplace requirements and compliance
            risks in seconds. Sell anywhere, with more confidence.
          </p>

          <div className="checker-card" id="checker">
            <div className="checker-tabs" role="tablist" aria-label="Product input method">
              <button
                className={mode === "link" ? "active" : ""}
                onClick={() => setMode("link")}
              >
                <Link2 size={16} /> Product link
              </button>
              <button
                className={mode === "describe" ? "active" : ""}
                onClick={() => setMode("describe")}
              >
                <FileText size={16} /> Describe product
              </button>
              <button
                className={mode === "upload" ? "active" : ""}
                onClick={() => setMode("upload")}
              >
                <Upload size={16} /> Upload image
              </button>
            </div>

            <div className="product-input-row">
              {mode === "upload" ? (
                <label className="upload-zone">
                  <Upload size={18} />
                  <span>Choose a product image</span>
                  <input type="file" accept="image/*" />
                </label>
              ) : (
                <div className="input-shell">
                  {mode === "link" ? <Link2 size={18} /> : <Search size={18} />}
                  <input
                    value={product}
                    onChange={(event) => setProduct(event.target.value)}
                    placeholder={
                      mode === "link"
                        ? "Paste product URL (Amazon, Shopify, etc.)"
                        : "e.g. wireless headphones with Bluetooth"
                    }
                    aria-label="Product"
                  />
                </div>
              )}
              <button className="button button-accent check-button" onClick={runCheck}>
                Check for free <ArrowRight size={16} />
              </button>
            </div>

            <div className="select-row">
              <label>
                <span>Sell in</span>
                <div className="select-shell">
                  <span>{selectedCountry.flag}</span>
                  <select value={country} onChange={(event) => setCountry(event.target.value)}>
                    {countries.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.value}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </label>

              <label>
                <span>Marketplace (optional)</span>
                <div className="select-shell">
                  <Store size={16} />
                  <select
                    value={marketplace}
                    onChange={(event) => setMarketplace(event.target.value)}
                  >
                    {marketplaces.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </label>
            </div>

            <div className="checker-note">
              <LockKeyhole size={13} />
              Free check. No credit card required.
            </div>
          </div>

          <div className="trust-row">
            <span>Built for sellers, brands and agencies using</span>
            <div className="marketplace-list" aria-label="Supported marketplaces">
              {["amazon", "shopify", "Etsy", "ebay", "TikTok Shop", "Walmart"].map((name) => (
                <strong key={name}>{name}</strong>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="SellComply product compliance preview">
          <div className="hero-vignette" aria-hidden="true" />

          <img
            className="earth-visual"
            src="/earth.webp"
            alt=""
            aria-hidden="true"
          />

          <img
            className="platform-visual"
            src="/platform.webp"
            alt=""
            aria-hidden="true"
          />

          <img
            className="headphones"
            src="/headphone.webp"
            alt="Premium wireless headphones"
          />

          <div className="product-floating-card glass-card">
            <img src="/headphone.webp" alt="" />
            <div>
              <strong>Wireless Headphones</strong>
              <span>Brand: SoundMax</span>
              <span>Category: Electronics</span>
            </div>
          </div>

          <div className="compliance-stack" aria-label="Example compliance requirements">
            <div className="glass-card compliance-item">
              <span className="icon-box icon-symbol">CE</span>
              <div><strong>CE Marking</strong><span>Required in EU</span></div>
              <span className="status-dot status-ok"><Check size={14} /></span>
            </div>

            <div className="glass-card compliance-item">
              <span className="icon-box icon-symbol">FCC</span>
              <div><strong>FCC Certification</strong><span>Required in US</span></div>
              <span className="status-dot status-ok"><Check size={14} /></span>
            </div>

            <div className="glass-card compliance-item compliance-warning">
              <span className="icon-box icon-symbol">Ro</span>
              <div><strong>RoHS</strong><span>Restricted materials</span></div>
              <span className="status-dot status-review">!</span>
            </div>

            <div className="glass-card compliance-item">
              <FileCheck2 size={20} />
              <div><strong>Product Documentation</strong><span>Required</span></div>
              <ArrowRight size={16} />
            </div>
          </div>

          <div className="geo-node geo-us glass-card">
            <span className="geo-flag">🇺🇸</span>
            <div><strong>US</strong><span>FCC</span></div>
          </div>

          <div className="geo-node geo-eu glass-card">
            <span className="geo-flag">🇪🇺</span>
            <div><strong>EU</strong><span>GPSR</span></div>
          </div>

          <div className="geo-node geo-uk glass-card">
            <span className="geo-flag">🇬🇧</span>
            <div><strong>UK</strong><span>UKCA</span></div>
          </div>

          <div className="geo-node geo-ca glass-card">
            <span className="geo-flag">🇨🇦</span>
            <div><strong>CA</strong><span>CCPSA</span></div>
          </div>

          <div className="country-card glass-card">
            <strong>Compliant in 32+ countries</strong>
            <div className="flag-row">
              {[
                { flag: "🇪🇺", label: "European Union" },
                { flag: "🇺🇸", label: "United States" },
                { flag: "🇬🇧", label: "United Kingdom" },
                { flag: "🇨🇦", label: "Canada" },
                { flag: "🇦🇺", label: "Australia" },
                { flag: "🇯🇵", label: "Japan" },
              ].map((item) => (
                <span key={item.label} title={item.label}>{item.flag}</span>
              ))}
              <span className="more-flag">+25</span>
            </div>
          </div>

          <div className="market-note note-one">Global markets.<br />Real opportunities.</div>
          <div className="market-note note-two">One product.<br />A bigger world.</div>
        </div>
      </section>

      <section className="feature-strip" id="solutions">
        {[
          { icon: Globe2, title: "Global regulations", text: "Country-specific regulatory checks for global sellers." },
          { icon: Store, title: "Marketplace rules", text: "Requirements across Amazon, eBay, Shopify, TikTok Shop and more." },
          { icon: Bell, title: "Real-time updates", text: "Stay aware when monitored requirements change." },
          { icon: FileCheck2, title: "Compliance documents", text: "Organize checklists, evidence and product documentation." },
          { icon: ShieldCheck, title: "Trusted partners", text: "Connect with qualified testing and compliance specialists." },
        ].map(({ icon: Icon, title, text }) => (
          <article className="feature-item" key={title}>
            <Icon size={24} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="preview-section" id="compliance-preview">
        <div className="section-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> COMPLIANCE PREVIEW</div>
          <h2>Your route from product<br />to market.</h2>
          <p>
            See the regulatory areas that may apply, understand what needs review
            and keep a record of every product-market combination.
          </p>
        </div>

        <div className={checked ? "result-panel checked" : "result-panel"}>
          <div className="result-top">
            <div>
              <span className="result-kicker">Example result</span>
              <h3>{product || "Wireless headphones"}</h3>
              <p>{selectedCountry.flag} {country} · {marketplace}</p>
            </div>
            <div className="result-score">
              <span>REVIEW</span>
              <strong>{checked ? "4 areas found" : "Ready to scan"}</strong>
            </div>
          </div>

          <div className="requirements-grid">
            {requirements.map((item, index) => (
              <div className="requirement-row" key={item}>
                <span className="requirement-index">0{index + 1}</span>
                <span>{item}</span>
                <span className="requirement-status">{checked ? "REVIEW" : "CHECK"}</span>
                <ArrowRight size={15} />
              </div>
            ))}
          </div>

          <div className="result-aside">
            <div>
              <CircleDollarSign size={18} />
              <span>Estimated setup cost</span>
              <strong>Depends on product class</strong>
            </div>
            <div>
              <Clock3 size={18} />
              <span>Estimated setup time</span>
              <strong>Varies by requirement</strong>
            </div>
            <div>
              <Languages size={18} />
              <span>Market language</span>
              <strong>{country === "Germany" ? "German" : "Market-specific"}</strong>
            </div>
          </div>

          <p className="legal-note">
            Preview only. Final obligations depend on product classification, technical
            characteristics, seller role and current official rules.
          </p>
        </div>
      </section>

      <section className="how-section">
        <div className="section-heading compact">
          <div className="eyebrow"><span className="eyebrow-dot" /> HOW IT WORKS</div>
          <h2>From product to market<br />— in seconds.</h2>
        </div>
        <div className="steps-grid">
          {[
            { number: "01", icon: Link2, title: "Add your product", text: "Paste a product link, describe it, or upload an image." },
            { number: "02", icon: Search, title: "Get compliance results", text: "See relevant rule areas, restrictions and documents for your target market." },
            { number: "03", icon: Bell, title: "Monitor what changes", text: "Save products and stay aware of important requirement updates." },
          ].map(({ number, icon: Icon, title, text }) => (
            <article className="step-card" key={number}>
              <span className="step-number">{number}</span>
              <Icon size={26} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="seo-discovery-section" data-section="seo-discovery" aria-labelledby="popular-checks-title">
        <div className="section-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> POPULAR COMPLIANCE CHECKS</div>
          <h2 id="popular-checks-title">Start with a product,<br />market or marketplace.</h2>
          <p>
            Explore useful compliance entry points, then move into the checker for an exact product review.
          </p>
        </div>

        <div className="seo-discovery-grid">
          <a className="seo-discovery-card" href="/sell/wireless-headphones/germany">
            <span>Electronics · Germany</span>
            <strong>Can I sell wireless headphones in Germany?</strong>
            <ArrowRight size={17} />
          </a>
          <a className="seo-discovery-card" href="/sell/toys/united-states">
            <span>Children&apos;s products · USA</span>
            <strong>Toy compliance for the United States</strong>
            <ArrowRight size={17} />
          </a>
          <a className="seo-discovery-card" href="/sell/cosmetics/france">
            <span>Beauty · France</span>
            <strong>Cosmetics compliance for France</strong>
            <ArrowRight size={17} />
          </a>
          <a className="seo-discovery-card" href="/marketplaces/amazon/power-banks">
            <span>Amazon · Electronics</span>
            <strong>Power bank compliance for Amazon sellers</strong>
            <ArrowRight size={17} />
          </a>
          <a className="seo-discovery-card" href="/markets">
            <span>Browse by country</span>
            <strong>Explore global markets</strong>
            <ArrowRight size={17} />
          </a>
          <a className="seo-discovery-card" href="/products">
            <span>Browse by category</span>
            <strong>Explore product compliance checks</strong>
            <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <section className="cta-section" id="pricing">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> SELL WITH CLARITY</div>
          <h2>Know before you list.</h2>
          <p>Turn compliance uncertainty into a clear product-market checklist.</p>
        </div>
        <a className="button button-accent" href="#checker">
          Check a product for free <ArrowRight size={17} />
        </a>
      </section>

      <footer id="about">
        <a className="brand" href="#">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span>Sell<span>Comply</span></span>
        </a>
        <p>Global product compliance intelligence for modern commerce.</p>
        <div className="footer-links" id="resources">
          <a href="/products">Products</a><a href="/markets">Markets</a><a href="/marketplaces">Marketplaces</a><a href="#">Privacy</a><a href="#">Terms</a>
        </div>
        <span>© 2026 SellComply</span>
      </footer>
    </main>
  );
}

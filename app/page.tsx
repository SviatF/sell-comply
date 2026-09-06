import { ComplianceChecker } from "@/components/compliance-checker";
import {
  ArrowRight,
  BellRing,
  FileCheck2,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const marketCards = [
  {
    code: "EU",
    title: "European Union",
    copy: "GPSR, CE, REACH, product labels and responsible-person requirements."
  },
  {
    code: "US",
    title: "United States",
    copy: "FCC, FDA, CPSC and marketplace-specific product obligations."
  },
  {
    code: "UK",
    title: "United Kingdom",
    copy: "UK product safety, labeling and category-specific requirements."
  },
  {
    code: "CA",
    title: "Canada",
    copy: "Consumer product, bilingual labeling and category compliance rules."
  }
];

const steps = [
  {
    number: "01",
    title: "Add your product",
    copy: "Paste a product link, describe the item, or upload an image."
  },
  {
    number: "02",
    title: "Get a market-ready report",
    copy: "See restrictions, certifications, documents and marketplace requirements."
  },
  {
    number: "03",
    title: "Monitor changes",
    copy: "Save products and receive alerts when regulations or platform rules change."
  }
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="navbar">
        <a className="brand" href="#" aria-label="SellComply home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            Sell<span>Comply</span>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#product">Product</a>
          <a href="#solutions">Solutions</a>
          <a href="#pricing">Pricing</a>
          <a href="#resources">Resources</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <button className="language-button" type="button">
            EN
          </button>
          <button className="login-button" type="button">
            Log in
          </button>
          <a className="primary-button light" href="#product">
            Get started free <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <section className="hero" id="product">
        <div className="hero-copy">
          <div className="eyebrow">
            <span />
            SELL GLOBALLY. STAY COMPLIANT.
          </div>

          <h1>
            Can I sell
            <br />
            <span>this product?</span>
          </h1>

          <p className="hero-intro">
            Check product regulations, marketplace requirements and compliance
            in seconds. Sell anywhere, with confidence.
          </p>

          <ComplianceChecker />

          <div className="trust-row">
            <p>Built for sellers, brands and agencies selling worldwide</p>
            <div className="marketplace-logos" aria-label="Supported marketplaces">
              <span>amazon</span>
              <span>Shopify</span>
              <span>Etsy</span>
              <span>eBay</span>
              <span>TikTok Shop</span>
              <span>Walmart</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-label="Example compliance overview">
          <div className="globe-grid" aria-hidden="true">
            <span className="globe-line line-a" />
            <span className="globe-line line-b" />
            <span className="globe-line line-c" />
            <span className="map-dot dot-a" />
            <span className="map-dot dot-b" />
            <span className="map-dot dot-c" />
            <span className="map-dot dot-d" />
          </div>

          <div className="product-orbit">
            <div className="headphone-illustration" aria-hidden="true">
              <div className="headphone-band" />
              <div className="earcup earcup-left" />
              <div className="earcup earcup-right" />
              <div className="headphone-glow" />
            </div>

            <div className="floating-card product-card">
              <div className="mini-product">
                <div className="mini-headphones" aria-hidden="true" />
              </div>
              <div>
                <strong>Wireless Headphones</strong>
                <span>Electronics · Bluetooth</span>
              </div>
            </div>

            <div className="floating-card compliance-card card-ce">
              <span className="icon-chip">CE</span>
              <div>
                <strong>CE Marking</strong>
                <small>Required in EU</small>
              </div>
            </div>

            <div className="floating-card compliance-card card-fcc">
              <span className="icon-chip">FCC</span>
              <div>
                <strong>FCC Certification</strong>
                <small>Required in US</small>
              </div>
            </div>

            <div className="floating-card compliance-card card-docs">
              <FileCheck2 size={20} />
              <div>
                <strong>Product documentation</strong>
                <small>4 requirements detected</small>
              </div>
            </div>

            <div className="market-pin pin-eu">
              <span>🇪🇺</span>
              <div>EU<small>GPSR</small></div>
            </div>
            <div className="market-pin pin-us">
              <span>🇺🇸</span>
              <div>US<small>FCC</small></div>
            </div>
            <div className="market-pin pin-uk">
              <span>🇬🇧</span>
              <div>UK<small>UK product rules</small></div>
            </div>

            <div className="country-strip">
              <div>
                <strong>Market coverage</strong>
                <span>EU · US · UK · Canada · Australia</span>
              </div>
              <span className="country-count">+25</span>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-bar" id="solutions">
        <article>
          <Globe2 />
          <div>
            <strong>Global regulations</strong>
            <p>Country-specific legal requirements, organized for sellers.</p>
          </div>
        </article>
        <article>
          <Layers3 />
          <div>
            <strong>Marketplace rules</strong>
            <p>Amazon, eBay, Shopify, Etsy, TikTok Shop and more.</p>
          </div>
        </article>
        <article>
          <BellRing />
          <div>
            <strong>Real-time updates</strong>
            <p>Monitor products when laws or platform requirements change.</p>
          </div>
        </article>
        <article>
          <FileCheck2 />
          <div>
            <strong>Compliance documents</strong>
            <p>Clear checklists for labels, testing and required files.</p>
          </div>
        </article>
      </section>

      <section className="section-block how-it-works">
        <div className="section-heading">
          <div className="eyebrow">
            <span />
            HOW IT WORKS
          </div>
          <h2>
            From product to market
            <br />
            <span>— in seconds.</span>
          </h2>
          <p>
            A clean workflow for deciding where a product can be sold and what
            must happen before launch.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <div className="step-icon">
                {step.number === "01" ? (
                  <Sparkles />
                ) : step.number === "02" ? (
                  <ShieldCheck />
                ) : (
                  <BellRing />
                )}
              </div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block markets-section">
        <div className="section-heading compact">
          <div className="eyebrow">
            <span />
            MARKET ACCESS
          </div>
          <h2>
            One product.
            <br />
            <span>Different rules everywhere.</span>
          </h2>
        </div>

        <div className="market-grid">
          {marketCards.map((market) => (
            <article className="market-card" key={market.code}>
              <span className="market-code">{market.code}</span>
              <h3>{market.title}</h3>
              <p>{market.copy}</p>
              <a href="#product">
                Check requirements <ArrowRight size={15} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="monitor-section" id="resources">
        <div className="monitor-panel">
          <div className="monitor-copy">
            <div className="eyebrow">
              <span />
              COMPLIANCE MONITORING
            </div>
            <h2>
              Regulations change.
              <br />
              <span>Your listings should not break.</span>
            </h2>
            <p>
              Save products and markets once. SellComply can become the system
              that tells your team when a rule, document or marketplace
              requirement needs attention.
            </p>
            <a className="primary-button" href="#product">
              Start monitoring free <ArrowRight size={16} />
            </a>
          </div>

          <div className="monitor-dashboard">
            <div className="dashboard-top">
              <span>Product monitor</span>
              <span className="live-pill">LIVE</span>
            </div>

            {[
              ["Wireless Headphones", "Germany + US", "Action needed"],
              ["LED Desk Lamp", "5 markets", "Monitoring"],
              ["Smart Watch", "4 markets", "Review soon"],
              ["Phone Case", "6 markets", "Compliant"]
            ].map(([name, market, status]) => (
              <div className="monitor-row" key={name}>
                <div className="monitor-thumb" />
                <div className="monitor-name">
                  <strong>{name}</strong>
                  <span>{market}</span>
                </div>
                <span
                  className={`status-pill ${status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div>
          <div className="eyebrow">
            <span />
            BUILT TO START FREE
          </div>
          <h2>
            Check one product today.
            <br />
            <span>Build compliance infrastructure tomorrow.</span>
          </h2>
        </div>
        <a className="primary-button light" href="#product">
          Check a product for free <ArrowRight size={16} />
        </a>
      </section>

      <footer id="about">
        <a className="brand" href="#">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            Sell<span>Comply</span>
          </span>
        </a>
        <p>
          Product market-access intelligence for global sellers.
        </p>
        <span>© 2026 SellComply</span>
      </footer>
    </main>
  );
}

"use client";

import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  FileText,
  ImageIcon,
  Link2,
  Search,
  ShieldAlert,
  Sparkles,
  TextCursorInput
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const countries = [
  { value: "germany", label: "Germany", flag: "🇩🇪", region: "European Union" },
  { value: "united-states", label: "United States", flag: "🇺🇸", region: "North America" },
  { value: "united-kingdom", label: "United Kingdom", flag: "🇬🇧", region: "United Kingdom" },
  { value: "canada", label: "Canada", flag: "🇨🇦", region: "North America" },
  { value: "australia", label: "Australia", flag: "🇦🇺", region: "Oceania" }
];

const marketplaces = ["Amazon", "Shopify", "Etsy", "eBay", "TikTok Shop"];

const baseRequirements = [
  {
    title: "Product safety framework",
    label: "Required",
    detail: "Applicable consumer-product safety rules"
  },
  {
    title: "Marketplace documentation",
    label: "Required",
    detail: "Category and marketplace evidence"
  },
  {
    title: "Labeling & warnings",
    label: "Review",
    detail: "Language, identity and safety labeling"
  },
  {
    title: "Technical documentation",
    label: "Review",
    detail: "Keep evidence ready for authorities or platforms"
  }
];

type InputMode = "link" | "describe" | "image";

function cleanProductName(value: string) {
  if (!value.trim()) return "Wireless Headphones";

  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      const path = url.pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/[-_]/g, " ");

      return path && path.length > 3
        ? path.slice(0, 42)
        : "Imported marketplace product";
    } catch {
      return "Imported marketplace product";
    }
  }

  return value.trim().slice(0, 48);
}

export function ComplianceChecker() {
  const [mode, setMode] = useState<InputMode>("link");
  const [product, setProduct] = useState("");
  const [country, setCountry] = useState("germany");
  const [marketplace, setMarketplace] = useState("Amazon");
  const [showResult, setShowResult] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [uploadedFile, setUploadedFile] = useState("");

  const selectedCountry = useMemo(
    () => countries.find((item) => item.value === country) ?? countries[0],
    [country]
  );

  const productName = cleanProductName(product || uploadedFile);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowResult(true);
  };

  return (
    <div className="checker-shell">
      <form className="checker-card" onSubmit={handleSubmit}>
        <div className="input-mode-tabs" role="tablist" aria-label="Product input type">
          <button
            type="button"
            className={mode === "link" ? "active" : ""}
            onClick={() => setMode("link")}
          >
            <Link2 size={15} />
            Product link
          </button>
          <button
            type="button"
            className={mode === "describe" ? "active" : ""}
            onClick={() => setMode("describe")}
          >
            <TextCursorInput size={15} />
            Describe product
          </button>
          <button
            type="button"
            className={mode === "image" ? "active" : ""}
            onClick={() => setMode("image")}
          >
            <ImageIcon size={15} />
            Upload image
          </button>
        </div>

        <div className="product-input-wrap">
          {mode === "image" ? (
            <label className="file-input">
              <ImageIcon size={18} />
              <span>{uploadedFile || "Choose product image"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setUploadedFile(event.target.files?.[0]?.name ?? "")
                }
              />
            </label>
          ) : (
            <label className="text-input-label">
              {mode === "link" ? <Link2 size={18} /> : <Search size={18} />}
              <input
                aria-label={mode === "link" ? "Product URL" : "Product description"}
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                placeholder={
                  mode === "link"
                    ? "Paste product URL (Amazon, Shopify, etc.)"
                    : "e.g. Wireless Bluetooth headphones with lithium battery"
                }
              />
            </label>
          )}

          <button className="check-button" type="submit">
            <Sparkles size={16} />
            Check for free
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="select-row">
          <label>
            <span>Sell in</span>
            <div className="select-wrap">
              <span className="select-flag">{selectedCountry.flag}</span>
              <select
                aria-label="Target country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              >
                {countries.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>

          <label>
            <span>Marketplace <em>(optional)</em></span>
            <div className="select-wrap">
              <span className="marketplace-a">
                {marketplace === "Amazon" ? "a" : marketplace.slice(0, 1)}
              </span>
              <select
                aria-label="Marketplace"
                value={marketplace}
                onChange={(event) => setMarketplace(event.target.value)}
              >
                {marketplaces.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
        </div>

        <div className="checker-meta">
          <span>
            <Check size={13} /> No credit card
          </span>
          <span>
            <Check size={13} /> Country-specific rules
          </span>
          <span>
            <Check size={13} /> Marketplace requirements
          </span>
        </div>
      </form>

      {showResult && (
        <aside className="inline-result" aria-live="polite">
          <div className="result-header">
            <div>
              <span className="result-kicker">PRELIMINARY CHECK</span>
              <h3>{productName}</h3>
              <p>
                {selectedCountry.flag} {selectedCountry.label} · {marketplace}
              </p>
            </div>
            <span className="result-state">
              <ShieldAlert size={17} />
              SELLABLE WITH REQUIREMENTS
            </span>
          </div>

          <div className="requirement-list">
            {baseRequirements.map((requirement) => (
              <div className="requirement-item" key={requirement.title}>
                <span className="requirement-icon">
                  <FileText size={16} />
                </span>
                <div>
                  <strong>{requirement.title}</strong>
                  <small>{requirement.detail}</small>
                </div>
                <span
                  className={
                    requirement.label === "Required"
                      ? "requirement-tag required"
                      : "requirement-tag"
                  }
                >
                  {requirement.label}
                </span>
              </div>
            ))}
          </div>

          <div className="result-summary">
            <div>
              <span>Estimated review</span>
              <strong>5–10 min</strong>
            </div>
            <div>
              <span>Detected areas</span>
              <strong>4</strong>
            </div>
            <div>
              <span>Market</span>
              <strong>{selectedCountry.label}</strong>
            </div>
          </div>

          <div className="result-actions">
            <button
              type="button"
              className={monitoring ? "monitor-button active" : "monitor-button"}
              onClick={() => setMonitoring((value) => !value)}
            >
              <Bell size={16} />
              {monitoring ? "Monitoring enabled" : "Monitor this product"}
            </button>
            <button type="button" className="report-button">
              View full report <ArrowRight size={15} />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

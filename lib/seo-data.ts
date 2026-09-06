export type ProductSeo = {
  slug: string;
  name: string;
  category: string;
  intro: string;
  reviewAreas: string[];
  questions: string[];
};

export type MarketSeo = {
  slug: string;
  name: string;
  flag: string;
  region: string;
  language: string;
  overview: string;
  reviewAreas: string[];
  marketNotes: string[];
  officialSources: { label: string; url: string }[];
};

export type MarketplaceSeo = {
  slug: string;
  name: string;
  overview: string;
  reviewAreas: string[];
};

export const products: ProductSeo[] = [
  {
    slug: "wireless-headphones",
    name: "wireless headphones",
    category: "Electronics",
    intro: "Wireless headphones can trigger product-safety, radio-equipment, electrical, battery, labelling and documentation checks depending on their design and target market.",
    reviewAreas: ["Radio and wireless requirements", "Electrical and charging safety", "Battery and transport information", "Labels, warnings and technical documentation"],
    questions: ["Does the product contain Bluetooth or another radio transmitter?", "Is a rechargeable lithium battery included?", "Who is the manufacturer or importer of record?", "Which languages must appear on labels and instructions?"],
  },
  {
    slug: "bluetooth-speakers",
    name: "Bluetooth speakers",
    category: "Electronics",
    intro: "Bluetooth speakers combine consumer-product, radio, electrical and battery considerations, so requirements can vary substantially by configuration and market.",
    reviewAreas: ["Radio-equipment requirements", "Power supply and electrical safety", "Battery documentation", "Product identification and user instructions"],
    questions: ["Which radio technologies are built in?", "Is the power adapter included?", "Does the product use a lithium battery?", "Are model and manufacturer details traceable?"],
  },
  {
    slug: "power-banks",
    name: "power banks",
    category: "Electronics",
    intro: "Power banks are battery-powered electronics and commonly require careful review of battery safety, transport information, labelling and market-specific electrical rules.",
    reviewAreas: ["Lithium battery safety", "Transport and shipping documentation", "Electrical requirements", "Warnings, ratings and traceability"],
    questions: ["What is the battery chemistry and capacity?", "Are transport test records available?", "What input and output ratings apply?", "Are warnings and model identifiers complete?"],
  },
  {
    slug: "led-lights",
    name: "LED lights",
    category: "Lighting",
    intro: "LED lighting products can fall under electrical, electromagnetic-compatibility, energy, environmental and labelling rules depending on the product and where it is sold.",
    reviewAreas: ["Electrical safety", "Electromagnetic compatibility", "Energy or environmental rules", "Marking and installation instructions"],
    questions: ["Is the product mains-powered or low voltage?", "Does it include a power supply or controller?", "Is it intended for indoor or outdoor use?", "What technical file and test evidence exists?"],
  },
  {
    slug: "toys",
    name: "toys",
    category: "Children's products",
    intro: "Toys are a high-scrutiny category. Age grading, mechanical and chemical safety, warnings, testing and traceability can all affect market access.",
    reviewAreas: ["Age grading and intended use", "Mechanical and chemical safety", "Testing and conformity evidence", "Warnings, traceability and packaging"],
    questions: ["What age group is the toy intended for?", "Are small parts, magnets or batteries present?", "What testing has already been completed?", "Are warnings appropriate for the target market?"],
  },
  {
    slug: "cosmetics",
    name: "cosmetics",
    category: "Beauty",
    intro: "Cosmetics are regulated differently from general consumer products and can require ingredient, safety, responsible-party, notification and labelling review.",
    reviewAreas: ["Ingredient and formulation review", "Safety assessment or substantiation", "Responsible-party obligations", "Claims, labels and notifications"],
    questions: ["What is the full ingredient list?", "Who manufactures the product?", "What cosmetic claims are being made?", "Which market-specific notification steps apply?"],
  },
  {
    slug: "candles",
    name: "candles",
    category: "Home & living",
    intro: "Candles look simple but still raise fire-safety, chemical, labelling, warning and product-traceability questions depending on composition and market.",
    reviewAreas: ["Fire-safety considerations", "Fragrance and chemical information", "Warnings and safe-use instructions", "Product traceability"],
    questions: ["Is the candle scented or unscented?", "What wax, wick and fragrance materials are used?", "Are safe-use warnings present?", "Can batches and suppliers be traced?"],
  },
  {
    slug: "jewelry",
    name: "jewelry",
    category: "Fashion",
    intro: "Jewelry compliance often depends on material composition, coatings, children's use, chemical restrictions, product claims and traceability.",
    reviewAreas: ["Restricted substances and material composition", "Children's-product considerations", "Claims and material descriptions", "Traceability and packaging information"],
    questions: ["Which metals and coatings are used?", "Is the item intended for children?", "Are material claims documented?", "Are supplier and batch records available?"],
  },
];

export const markets: MarketSeo[] = [
  {
    slug: "germany",
    name: "Germany",
    flag: "🇩🇪",
    region: "European Union",
    language: "German",
    overview: "Products sold in Germany can be subject to EU-wide product rules plus German market, language and enforcement considerations. The exact obligations depend on the product category and your role in the supply chain.",
    reviewAreas: ["Applicable EU product legislation", "CE marking where a sector rule requires it", "Economic-operator and traceability information", "German-language safety information where required"],
    marketNotes: ["Identify whether EU harmonised product legislation applies.", "Check who acts as manufacturer, importer, distributor or other responsible economic operator.", "Review labels, warnings, instructions and online product information for the German market."],
    officialSources: [
      { label: "European Commission — EU product requirements", url: "https://commission.europa.eu/business-economy-euro/doing-business-eu/eu-product-safety-and-labelling/eu-product-requirements_en" },
      { label: "Your Europe — general product compliance", url: "https://europa.eu/youreurope/business/product-rules-compliance/general-product-compliance/index_en.htm" },
    ],
  },
  {
    slug: "france",
    name: "France",
    flag: "🇫🇷",
    region: "European Union",
    language: "French",
    overview: "Selling in France requires identifying the EU rules that apply to the product and checking France-specific language, consumer-information and market-access considerations.",
    reviewAreas: ["Applicable EU product legislation", "Conformity and technical evidence", "Traceability and economic-operator information", "French-language labels and instructions where required"],
    marketNotes: ["Start with the EU rule set for the product category.", "Confirm that technical documentation and conformity evidence match the exact product model.", "Review consumer-facing information for the French market."],
    officialSources: [
      { label: "European Commission — EU product requirements", url: "https://commission.europa.eu/business-economy-euro/doing-business-eu/eu-product-safety-and-labelling/eu-product-requirements_en" },
      { label: "Your Europe — general product compliance", url: "https://europa.eu/youreurope/business/product-rules-compliance/general-product-compliance/index_en.htm" },
    ],
  },
  {
    slug: "united-states",
    name: "United States",
    flag: "🇺🇸",
    region: "United States",
    language: "English",
    overview: "US product compliance can involve federal product-safety rules, testing or certification for regulated categories, radio-equipment rules, labelling and state-level requirements.",
    reviewAreas: ["CPSC rules relevant to the product category", "Testing or certification where required", "Radio-frequency requirements for connected products", "Warnings, labels and supporting records"],
    marketNotes: ["Map the product to the relevant federal regulator and rule set.", "For regulated products, determine whether testing or a certificate is required.", "Check whether state-specific requirements add another layer."],
    officialSources: [
      { label: "CPSC — Business Education", url: "https://www.cpsc.gov/Business--Manufacturing/Business-Education" },
      { label: "CPSC — Business & Manufacturing", url: "https://www.cpsc.gov/Business--Manufacturing" },
    ],
  },
  {
    slug: "united-kingdom",
    name: "United Kingdom",
    flag: "🇬🇧",
    region: "United Kingdom",
    language: "English",
    overview: "UK product rules vary by product type and can differ between Great Britain and Northern Ireland. Businesses should identify the applicable product legislation, conformity route, labelling and documentation obligations.",
    reviewAreas: ["Product-specific UK legislation", "Conformity assessment and marking where applicable", "Technical documentation and traceability", "Safety information and labels"],
    marketNotes: ["Determine whether the product is being placed on the Great Britain or Northern Ireland market.", "Identify any product-specific rules before relying on general product-safety requirements.", "Keep appropriate records and consumer safety information."],
    officialSources: [
      { label: "GOV.UK — product safety advice for businesses", url: "https://www.gov.uk/guidance/product-safety-advice-for-businesses" },
      { label: "GOV.UK — A to Z of product safety guidance", url: "https://www.gov.uk/guidance/product-safety-for-businesses-a-to-z-of-industry-guidance" },
    ],
  },
  {
    slug: "canada",
    name: "Canada",
    flag: "🇨🇦",
    region: "Canada",
    language: "English / French",
    overview: "Canadian consumer-product rules can involve product-safety prohibitions, category-specific requirements, incident-reporting duties and bilingual information depending on the product and province.",
    reviewAreas: ["Canada Consumer Product Safety Act applicability", "Category-specific regulations", "Product records and incident duties", "Labelling and bilingual information where applicable"],
    marketNotes: ["Confirm whether the product falls under the CCPSA or another regulatory regime.", "Review any category-specific standards or prohibitions.", "Check recordkeeping, incident reporting and product-information obligations."],
    officialSources: [
      { label: "Health Canada — consumer products and cosmetics", url: "https://www.canada.ca/en/health-canada/services/consumer-product-safety.html" },
      { label: "Canada Consumer Product Safety Act quick reference", url: "https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/canada-consumer-product-safety-act-guide.html" },
    ],
  },
  {
    slug: "australia",
    name: "Australia",
    flag: "🇦🇺",
    region: "Australia",
    language: "English",
    overview: "Australian market access can involve mandatory product-safety standards, bans, electrical or communications rules, supplier responsibilities and recall obligations.",
    reviewAreas: ["Mandatory standards and product bans", "Category-specific safety obligations", "Supplier documentation and product information", "Recall and incident responsibilities"],
    marketNotes: ["Search for mandatory standards or bans that match the product category.", "Identify any additional electrical, radio or sector regulator.", "Keep supplier and compliance evidence aligned with the exact product sold."],
    officialSources: [
      { label: "ACCC Product Safety — business resources", url: "https://www.productsafety.gov.au/" },
    ],
  },
];

export const marketplaces: MarketplaceSeo[] = [
  {
    slug: "amazon",
    name: "Amazon",
    overview: "Amazon sellers may be asked to provide product-safety, compliance or authenticity information depending on category, marketplace and product risk.",
    reviewAreas: ["Product detail and category accuracy", "Requested compliance documents", "Restricted-product and safety policies", "Market-specific listing information"],
  },
  {
    slug: "etsy",
    name: "Etsy",
    overview: "Etsy sellers remain responsible for the products they place on the market, including applicable product-safety, labelling and market-access requirements.",
    reviewAreas: ["Product category and claims", "Safety and labelling obligations", "Restricted or prohibited products", "Seller and manufacturer information"],
  },
  {
    slug: "ebay",
    name: "eBay",
    overview: "eBay listings can be affected by product-safety laws, restricted-product policies, recalls and market-specific seller obligations.",
    reviewAreas: ["Restricted-product policy checks", "Safety and recall status", "Product descriptions and claims", "Market-specific seller information"],
  },
  {
    slug: "tiktok-shop",
    name: "TikTok Shop",
    overview: "TikTok Shop sellers need to consider both platform category policies and the product regulations that apply in each target market.",
    reviewAreas: ["Category eligibility", "Required product documentation", "Claims and listing content", "Local product-safety rules"],
  },
  {
    slug: "shopify",
    name: "Shopify",
    overview: "Shopify provides the storefront infrastructure, while the merchant remains responsible for product compliance in each market where products are offered.",
    reviewAreas: ["Target-market product rules", "Storefront product information", "Warnings, labels and instructions", "Merchant and manufacturer traceability"],
  },
];

export const getProduct = (slug: string) => products.find((item) => item.slug === slug);
export const getMarket = (slug: string) => markets.find((item) => item.slug === slug);
export const getMarketplace = (slug: string) => marketplaces.find((item) => item.slug === slug);

export const prettySlug = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

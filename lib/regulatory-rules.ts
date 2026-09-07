export type RuleStatus = "required" | "likely" | "verify" | "platform";

export type RuleGroup =
  | "product-safety"
  | "radio"
  | "electrical"
  | "battery"
  | "environmental"
  | "toy"
  | "cosmetics"
  | "marketplace";

export type RegulatoryRule = {
  id: string;
  title: string;
  shortName: string;
  group: RuleGroup;
  markets: string[];
  products?: string[];
  requiresFeatures?: string[];
  excludesProducts?: string[];
  status: RuleStatus;
  summary: string;
  why: string;
  documents: string[];
  labels: string[];
  actions: string[];
  source: {
    label: string;
    url: string;
  };
  lastVerified: string;
  effectiveNote?: string;
};

export const regulatoryRules: RegulatoryRule[] = [
  {
    id: "eu-gpsr",
    title: "EU General Product Safety Regulation (GPSR)",
    shortName: "GPSR",
    group: "product-safety",
    markets: ["germany", "france"],
    excludesProducts: ["cosmetics"],
    status: "likely",
    summary:
      "The GPSR is the EU general consumer-product safety framework and adds traceability and online-offer duties, including for many products also covered by sector legislation.",
    why:
      "You are offering a consumer product in the EU. Exact GPSR duties depend on the product, supply-chain role and any sector-specific legislation that also applies.",
    documents: [
      "Product risk assessment or equivalent safety evidence",
      "Technical documentation supporting product safety",
      "Manufacturer/importer/economic-operator traceability records",
    ],
    labels: [
      "Product or model identification",
      "Manufacturer contact information",
      "Importer or responsible economic-operator information where applicable",
      "Safety warnings/instructions understandable in the destination market",
    ],
    actions: [
      "Confirm your economic-operator role for the EU market.",
      "Check that the online offer contains required identification and safety information.",
      "Keep safety evidence tied to the exact model/SKU.",
    ],
    source: {
      label: "EUR-Lex — Regulation (EU) 2023/988",
      url: "https://eur-lex.europa.eu/eli/reg/2023/988/oj",
    },
    lastVerified: "2026-09-07",
    effectiveNote: "Applies from 13 December 2024.",
  },
  {
    id: "eu-red",
    title: "EU Radio Equipment Directive",
    shortName: "RED 2014/53/EU",
    group: "radio",
    markets: ["germany", "france"],
    products: ["wireless-headphones", "bluetooth-speakers"],
    requiresFeatures: ["radio"],
    status: "required",
    summary:
      "Bluetooth and other intentional radio transmitters are generally radio equipment under the EU Radio Equipment Directive.",
    why:
      "The detected product uses Bluetooth or another radio transmitter and is intended for an EU market.",
    documents: [
      "EU Declaration of Conformity",
      "Technical documentation / technical file",
      "Relevant radio, EMC and safety test evidence",
    ],
    labels: [
      "CE marking",
      "Manufacturer/model identification",
      "Required importer/economic-operator details",
      "User instructions and any radio-use restrictions",
    ],
    actions: [
      "Confirm the exact radio technologies and frequency bands.",
      "Match test evidence to the final hardware/firmware configuration.",
      "Verify the EU Declaration of Conformity references the exact product model.",
    ],
    source: {
      label: "EUR-Lex — Directive 2014/53/EU",
      url: "https://eur-lex.europa.eu/eli/dir/2014/53",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "eu-rohs",
    title: "EU restriction of hazardous substances in EEE",
    shortName: "RoHS",
    group: "environmental",
    markets: ["germany", "france"],
    products: ["wireless-headphones", "bluetooth-speakers", "power-banks", "led-lights"],
    status: "likely",
    summary:
      "Electrical and electronic equipment commonly falls within RoHS restrictions on specified hazardous substances, subject to scope and exemptions.",
    why:
      "The detected product is electrical/electronic equipment intended for the EU market.",
    documents: [
      "Material/composition declarations",
      "Supplier declarations or test evidence for restricted substances",
      "Technical documentation supporting conformity",
    ],
    labels: ["CE marking where the applicable conformity framework requires it"],
    actions: [
      "Confirm the product is within RoHS scope and check any applicable exemptions.",
      "Collect component/material declarations from suppliers.",
    ],
    source: {
      label: "EUR-Lex — Directive 2011/65/EU",
      url: "https://eur-lex.europa.eu/eli/dir/2011/65",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "eu-weee",
    title: "EU Waste Electrical and Electronic Equipment obligations",
    shortName: "WEEE",
    group: "environmental",
    markets: ["germany", "france"],
    products: ["wireless-headphones", "bluetooth-speakers", "power-banks", "led-lights"],
    status: "likely",
    summary:
      "Electrical and electronic equipment can trigger WEEE producer-registration, financing, information and marking obligations implemented at Member State level.",
    why:
      "The product appears to be electrical/electronic equipment offered in an EU Member State.",
    documents: [
      "Producer-registration records where applicable",
      "EPR/WEEE compliance records for the destination country",
    ],
    labels: ["Crossed-out wheeled-bin marking where required"],
    actions: [
      "Determine who is the WEEE producer in the destination country.",
      "Check Germany/France-specific registration and EPR obligations before sale.",
    ],
    source: {
      label: "EUR-Lex — Directive 2012/19/EU",
      url: "https://eur-lex.europa.eu/eli/dir/2012/19",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "eu-batteries",
    title: "EU Batteries Regulation",
    shortName: "Batteries Regulation",
    group: "battery",
    markets: ["germany", "france"],
    requiresFeatures: ["battery"],
    status: "likely",
    summary:
      "The EU Batteries Regulation covers batteries, including batteries incorporated into products, with phased safety, sustainability, labelling, information and EPR duties.",
    why:
      "The product contains or is itself a rechargeable or non-rechargeable battery.",
    documents: [
      "Battery specifications and chemistry/capacity data",
      "Supplier compliance evidence",
      "Applicable conformity and labelling records",
      "EPR/producer records where the seller is the obligated producer",
    ],
    labels: [
      "Battery information/markings applicable to the battery category and implementation date",
      "Waste-battery collection marking where applicable",
    ],
    actions: [
      "Identify the battery category and whether it is incorporated into another product.",
      "Check phased application dates for the exact battery obligation.",
      "Confirm producer-responsibility obligations for the destination country.",
    ],
    source: {
      label: "EUR-Lex — Regulation (EU) 2023/1542",
      url: "https://eur-lex.europa.eu/eli/reg/2023/1542/oj",
    },
    lastVerified: "2026-09-07",
    effectiveNote:
      "Applies in phases; the former Batteries Directive was repealed with effect from 18 August 2025, with transitional provisions.",
  },
  {
    id: "eu-toy-current",
    title: "Current EU toy-safety framework",
    shortName: "Toy Safety Directive",
    group: "toy",
    markets: ["germany", "france"],
    products: ["toys"],
    status: "required",
    summary:
      "Toys placed on the EU market currently remain subject to the Toy Safety Directive framework during the transition to the new Toy Safety Regulation.",
    why:
      "The detected product is a toy intended for children and the target market is in the EU.",
    documents: [
      "Safety assessment",
      "Technical documentation",
      "EU Declaration of Conformity",
      "Relevant testing against applicable toy-safety requirements/standards",
    ],
    labels: [
      "CE marking",
      "Age/use warnings where applicable",
      "Manufacturer/importer and product traceability",
      "Safety information in the required market language",
    ],
    actions: [
      "Confirm intended age group and foreseeable use.",
      "Identify mechanical, chemical, flammability, electrical, magnet and small-parts hazards.",
      "Confirm conformity assessment and technical documentation for the exact toy.",
    ],
    source: {
      label: "EUR-Lex — Directive 2009/48/EC",
      url: "https://eur-lex.europa.eu/eli/dir/2009/48/oj",
    },
    lastVerified: "2026-09-07",
    effectiveNote:
      "The new Toy Safety Regulation applies generally from 1 August 2030; transitional provisions apply.",
  },
  {
    id: "eu-toy-future",
    title: "Upcoming EU Toy Safety Regulation transition",
    shortName: "Toy Safety Regulation 2025/2509",
    group: "toy",
    markets: ["germany", "france"],
    products: ["toys"],
    status: "verify",
    summary:
      "The new EU Toy Safety Regulation introduces a future regulatory regime including digital product-passport requirements and applies generally from 1 August 2030.",
    why:
      "Long-lived toy listings and product development should account for the transition even though the current directive remains the main placing-on-market framework today.",
    documents: ["Transition plan for product documentation and digital product passport readiness"],
    labels: ["Future digital product-passport data carrier requirements"],
    actions: [
      "Do not treat the 2030 regime as already fully applicable.",
      "Track the transition if the product will remain on sale into 2030.",
    ],
    source: {
      label: "EUR-Lex — Regulation (EU) 2025/2509",
      url: "https://eur-lex.europa.eu/eli/reg/2025/2509/oj/eng",
    },
    lastVerified: "2026-09-07",
    effectiveNote: "Applies generally from 1 August 2030.",
  },
  {
    id: "eu-cosmetics",
    title: "EU Cosmetics Regulation",
    shortName: "Cosmetics Regulation 1223/2009",
    group: "cosmetics",
    markets: ["germany", "france"],
    products: ["cosmetics"],
    status: "required",
    summary:
      "Cosmetic products placed on the EU market require an EU Responsible Person and compliance with product-safety, information-file, notification, ingredient and labelling obligations.",
    why:
      "The detected product is a cosmetic intended for an EU consumer market.",
    documents: [
      "Cosmetic Product Safety Report / safety assessment",
      "Product Information File (PIF)",
      "CPNP notification record",
      "Ingredient/formulation and claims substantiation records",
    ],
    labels: [
      "Responsible Person name/address",
      "Nominal content",
      "Durability/period-after-opening information where applicable",
      "Precautions for use",
      "Batch/reference identification",
      "Function where not obvious",
      "Ingredient list",
    ],
    actions: [
      "Confirm the EU Responsible Person.",
      "Verify the PIF and safety assessment exist for the exact formulation.",
      "Confirm CPNP notification before placing the product on the market.",
      "Review claims so the product is not inadvertently presented as a medicinal product.",
    ],
    source: {
      label: "EUR-Lex — Regulation (EC) No 1223/2009",
      url: "https://eur-lex.europa.eu/eli/reg/2009/1223/oj",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "us-fcc-radio",
    title: "FCC equipment authorization for radio-frequency devices",
    shortName: "FCC Part 15",
    group: "radio",
    markets: ["united-states"],
    products: ["wireless-headphones", "bluetooth-speakers"],
    requiresFeatures: ["radio"],
    status: "required",
    summary:
      "Bluetooth products are intentional radiators and generally require FCC equipment authorization before importation and marketing in the United States.",
    why:
      "The detected product intentionally transmits radio-frequency energy using Bluetooth or another wireless technology.",
    documents: [
      "FCC equipment authorization/certification evidence",
      "RF test report for the applicable transmitter",
      "FCC ID / module authorization evidence where applicable",
    ],
    labels: [
      "FCC identification/information required by the applicable authorization route",
      "Required Part 15 user statements where applicable",
    ],
    actions: [
      "Confirm whether the final device or an integrated module carries the relevant authorization.",
      "Check whether host integration creates additional authorization or labelling obligations.",
    ],
    source: {
      label: "FCC — Part 15 equipment authorization guidance",
      url: "https://apps.fcc.gov/oetcf/kdb/forms/FTSSearchResultPage.cfm?id=21079&switch=P",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "us-toy",
    title: "US mandatory toy-safety standard and children's product certification",
    shortName: "CPSC / ASTM F963",
    group: "toy",
    markets: ["united-states"],
    products: ["toys"],
    status: "required",
    summary:
      "Children's toys are subject to the CPSC's mandatory toy-safety standard and, for products primarily intended for children 12 and under, third-party testing and Children's Product Certificate requirements can apply.",
    why:
      "The detected product is a children's toy being offered in the United States.",
    documents: [
      "CPSC-accepted third-party laboratory test reports where required",
      "Children's Product Certificate (CPC)",
      "Tracking-label and applicable lead/phthalate/small-parts evidence",
    ],
    labels: [
      "Tracking information required for children's products",
      "Age/safety warnings required by the applicable rule",
    ],
    actions: [
      "Confirm the intended age group.",
      "Map the toy to applicable ASTM F963 sections and any additional CPSC rules.",
      "Use a CPSC-accepted third-party laboratory where certification testing is required.",
    ],
    source: {
      label: "CPSC — Toy Safety",
      url: "https://www.cpsc.gov/FAQ/Toy-Safety",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "us-cosmetics-label",
    title: "US cosmetic labelling and claims",
    shortName: "FDA cosmetic labelling",
    group: "cosmetics",
    markets: ["united-states"],
    products: ["cosmetics"],
    status: "required",
    summary:
      "Cosmetics marketed in the United States must comply with FDA cosmetic labelling requirements and must not be adulterated or misbranded.",
    why:
      "The detected product is a cosmetic offered to US consumers.",
    documents: [
      "Final ingredient list and formulation records",
      "Safety substantiation records",
      "Claims substantiation",
    ],
    labels: [
      "Product identity",
      "Name/place of business",
      "Net quantity",
      "Ingredient declaration where required",
      "Required warnings where applicable",
    ],
    actions: [
      "Review the label against 21 CFR cosmetic labelling rules.",
      "Check whether any therapeutic claim would cause the product to be regulated as a drug.",
      "Separately verify current MoCRA facility-registration/product-listing duties and exemptions.",
    ],
    source: {
      label: "FDA — Cosmetics Labeling Guide",
      url: "https://www.fda.gov/cosmetics/cosmetics-labeling-regulations/cosmetics-labeling-guide",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "uk-radio",
    title: "UK Radio Equipment Regulations 2017",
    shortName: "UK Radio Equipment Regulations",
    group: "radio",
    markets: ["united-kingdom"],
    products: ["wireless-headphones", "bluetooth-speakers"],
    requiresFeatures: ["radio"],
    status: "required",
    summary:
      "Radio equipment placed on the Great Britain market is subject to the Radio Equipment Regulations 2017; Northern Ireland has a modified regime.",
    why:
      "The detected product uses Bluetooth or another radio transmitter and the selected market is the United Kingdom.",
    documents: [
      "Declaration of conformity",
      "Technical documentation",
      "Radio/EMC/safety test evidence",
    ],
    labels: [
      "Applicable conformity marking and product identification",
      "Manufacturer/importer information",
      "Required instructions and restrictions",
    ],
    actions: [
      "Confirm whether the destination is Great Britain or Northern Ireland.",
      "Match technical evidence and conformity documentation to the exact product.",
    ],
    source: {
      label: "GOV.UK — Radio equipment regulations",
      url: "https://www.gov.uk/government/publications/radio-equipment-regulations-2017",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "uk-cosmetics",
    title: "Great Britain cosmetic product requirements",
    shortName: "GB Cosmetics",
    group: "cosmetics",
    markets: ["united-kingdom"],
    products: ["cosmetics"],
    status: "required",
    summary:
      "Cosmetics made available to consumers in Great Britain require a Responsible Person, safety documentation, notification to OPSS and compliant labelling.",
    why:
      "The detected product is a cosmetic and the selected destination includes Great Britain.",
    documents: [
      "Product Information File (PIF)",
      "Cosmetic safety assessment",
      "SCPN notification record",
    ],
    labels: [
      "Responsible Person name/address",
      "Ingredients and precautions",
      "Batch/reference information",
      "Required consumer information in English",
    ],
    actions: [
      "Confirm the Responsible Person for Great Britain.",
      "Notify the product through SCPN before placing a new product on the GB market.",
      "Treat Northern Ireland separately because the regulatory route differs.",
    ],
    source: {
      label: "GOV.UK — Making cosmetic products available in Great Britain",
      url: "https://www.gov.uk/guidance/making-cosmetic-products-available-to-consumers-in-great-britain",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "au-radio-rcm",
    title: "Australian radiocommunications / RCM supplier compliance",
    shortName: "ACMA / RCM",
    group: "radio",
    markets: ["australia"],
    products: ["wireless-headphones", "bluetooth-speakers"],
    requiresFeatures: ["radio"],
    status: "required",
    summary:
      "Wireless products supplied in Australia can be subject to ACMA radiocommunications, EMC, technical-standard, record-keeping and labelling rules, commonly including the Regulatory Compliance Mark (RCM).",
    why:
      "The detected product contains Bluetooth or another radio transmitter and is intended for supply in Australia.",
    documents: [
      "Applicable technical-standard test reports or accepted compliance evidence",
      "Supplier declaration/records supporting compliance",
      "Responsible supplier registration evidence where required",
    ],
    labels: [
      "Regulatory Compliance Mark (RCM) or permitted compliance label where applicable",
    ],
    actions: [
      "Use ACMA's supplier steps to identify every applicable radiocommunications, EMC and labelling rule.",
      "Confirm the Australian supplier/responsible-supplier obligations before applying the RCM.",
      "Do not assume CE/FCC markings alone demonstrate Australian compliance.",
    ],
    source: {
      label: "ACMA — Step 1: check the rules to follow",
      url: "https://www.acma.gov.au/step-1-check-rules-follow",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "ca-radio",
    title: "Canada radio apparatus certification requirements",
    shortName: "ISED RSS",
    group: "radio",
    markets: ["canada"],
    products: ["wireless-headphones", "bluetooth-speakers"],
    requiresFeatures: ["radio"],
    status: "required",
    summary:
      "Bluetooth and other radio apparatus must meet applicable Innovation, Science and Economic Development Canada radio standards and certification requirements.",
    why:
      "The product intentionally transmits radio-frequency energy and is intended for the Canadian market.",
    documents: [
      "ISED certification evidence",
      "Applicable radio test report",
      "Host/module integration evidence where relevant",
    ],
    labels: [
      "ISED certification/labelling information",
      "Required user-manual statements",
    ],
    actions: [
      "Identify the applicable RSS standards for the radio technology.",
      "Confirm certification and host/module labelling for the final product configuration.",
    ],
    source: {
      label: "ISED — RSS-Gen General Requirements",
      url: "https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/devices-and-equipment/radio-equipment-standards/radio-standards-specifications-rss/rss-gen-general-requirements-compliance-radio-apparatus",
    },
    lastVerified: "2026-09-07",
  },
];

export const getRulesFor = ({
  marketSlug,
  productSlug,
  features,
}: {
  marketSlug: string;
  productSlug: string;
  features: string[];
}) => {
  const featureSet = new Set(features);

  return regulatoryRules.filter((rule) => {
    if (!rule.markets.includes(marketSlug)) return false;
    if (rule.excludesProducts?.includes(productSlug)) return false;
    if (rule.products && !rule.products.includes(productSlug)) return false;
    if (
      rule.requiresFeatures &&
      !rule.requiresFeatures.every((feature) => featureSet.has(feature))
    ) {
      return false;
    }
    return true;
  });
};

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
  features: string[
  {
    id: "eu-jewelry-reach",
    title: "EU REACH restrictions relevant to jewellery",
    shortName: "REACH Annex XVII",
    group: "environmental",
    markets: ["germany", "france"],
    products: ["jewelry"],
    status: "required",
    summary:
      "Jewellery that comes into direct and prolonged contact with skin is subject to REACH Annex XVII restrictions, including nickel-release limits; other substance restrictions can also apply depending on materials.",
    why:
      "The detected product is jewellery intended for skin contact and is being placed on an EU market.",
    documents: [
      "Material composition declarations",
      "Nickel-release test evidence where applicable",
      "Supplier evidence for other restricted substances",
    ],
    labels: [
      "Accurate material/composition claims",
      "Traceable product/model identification",
    ],
    actions: [
      "Confirm all metals, coatings and platings used in the final item.",
      "Verify nickel release for parts intended for direct and prolonged skin contact.",
      "Check whether additional REACH restrictions apply to the material set.",
    ],
    source: {
      label: "EUR-Lex — REACH Regulation (EC) No 1907/2006",
      url: "https://eur-lex.europa.eu/eli/reg/2006/1907/2024-06-06/eng",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "eu-led-emc",
    title: "EU Electromagnetic Compatibility Directive",
    shortName: "EMC 2014/30/EU",
    group: "electrical",
    markets: ["germany", "france"],
    products: ["led-lights"],
    requiresFeatures: ["electronic"],
    status: "likely",
    summary:
      "Electronic lighting equipment commonly falls within the EU EMC framework for electromagnetic emissions and immunity, subject to exact design and exclusions.",
    why:
      "The detected LED product includes active electronic circuitry and is intended for an EU market.",
    documents: [
      "EMC test reports",
      "Technical documentation",
      "EU Declaration of Conformity where the directive applies",
    ],
    labels: [
      "CE marking where the applicable conformity framework requires it",
      "Manufacturer/model identification",
    ],
    actions: [
      "Confirm whether the final luminaire/lamp is within EMC scope.",
      "Match EMC evidence to the final driver/controller configuration.",
    ],
    source: {
      label: "EUR-Lex — Directive 2014/30/EU",
      url: "https://eur-lex.europa.eu/eli/dir/2014/30/oj",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "eu-led-lvd",
    title: "EU Low Voltage Directive for mains-voltage electrical equipment",
    shortName: "LVD 2014/35/EU",
    group: "electrical",
    markets: ["germany", "france"],
    products: ["led-lights"],
    requiresFeatures: ["mains"],
    status: "required",
    summary:
      "Electrical equipment operating within the voltage limits of the Low Voltage Directive must meet its safety objectives and conformity-documentation requirements.",
    why:
      "You confirmed that the LED product connects directly to mains electricity.",
    documents: [
      "Electrical-safety test evidence",
      "Technical documentation",
      "EU Declaration of Conformity",
    ],
    labels: [
      "CE marking",
      "Manufacturer/model identification",
      "Electrical ratings and safety information",
    ],
    actions: [
      "Confirm rated input voltage and exact scope under the LVD.",
      "Verify safety testing against the final enclosure, driver and wiring configuration.",
    ],
    source: {
      label: "EUR-Lex — Directive 2014/35/EU",
      url: "https://eur-lex.europa.eu/eli/dir/2014/35/oj",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "uk-general-product-safety",
    title: "Great Britain General Product Safety Regulations 2005",
    shortName: "GB GPSR 2005",
    group: "product-safety",
    markets: ["united-kingdom"],
    excludesProducts: ["cosmetics", "toys"],
    status: "likely",
    summary:
      "The General Product Safety Regulations 2005 provide the baseline consumer-product safety framework in Great Britain where product-specific legislation does not fully cover the relevant safety aspect.",
    why:
      "The selected market is the United Kingdom and this product is a consumer product not fully displaced by a more specific regime.",
    documents: [
      "Product safety/risk evidence",
      "Producer/importer traceability records",
      "Records supporting warnings and corrective-action readiness",
    ],
    labels: [
      "Producer/importer identification",
      "Product identification",
      "Safety information and warnings where risks are not obvious",
    ],
    actions: [
      "Confirm whether the sale is into Great Britain or Northern Ireland.",
      "Map any product-specific legislation first, then apply the general safety baseline to remaining risks.",
    ],
    source: {
      label: "GOV.UK — General Product Safety Regulations 2005: Great Britain",
      url: "https://www.gov.uk/government/publications/general-product-safety-regulations-2005/general-product-safety-regulations-2005-great-britain",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "uk-emc",
    title: "UK Electromagnetic Compatibility Regulations 2016",
    shortName: "UK EMC",
    group: "electrical",
    markets: ["united-kingdom"],
    products: ["power-banks", "led-lights"],
    requiresFeatures: ["electronic"],
    status: "likely",
    summary:
      "Electronic equipment supplied in Great Britain can fall within the Electromagnetic Compatibility Regulations 2016 and must meet applicable electromagnetic compatibility requirements.",
    why:
      "The detected product includes active electronic circuitry and is being supplied to the UK market.",
    documents: [
      "EMC test evidence",
      "Technical documentation",
      "Declaration of conformity where required",
    ],
    labels: [
      "Applicable conformity marking and product identification",
      "Manufacturer/importer information",
    ],
    actions: [
      "Confirm scope for the final electronic configuration.",
      "Match EMC testing to the final production hardware.",
    ],
    source: {
      label: "GOV.UK — Electromagnetic Compatibility Regulations 2016",
      url: "https://www.gov.uk/government/publications/electromagnetic-compatibility-regulations-2016",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "uk-electrical-safety",
    title: "UK Electrical Equipment (Safety) Regulations 2016",
    shortName: "UK Electrical Safety",
    group: "electrical",
    markets: ["united-kingdom"],
    products: ["led-lights"],
    requiresFeatures: ["mains"],
    status: "required",
    summary:
      "Mains-voltage electrical equipment in Great Britain can fall within the Electrical Equipment (Safety) Regulations 2016 and must meet applicable safety objectives before being placed on the market.",
    why:
      "You confirmed that the selected LED product connects directly to mains electricity.",
    documents: [
      "Electrical-safety test evidence",
      "Technical documentation",
      "Declaration of conformity",
    ],
    labels: [
      "Applicable conformity marking",
      "Electrical ratings",
      "Manufacturer/importer and model identification",
    ],
    actions: [
      "Confirm the exact voltage range and product scope.",
      "Verify safety evidence against the final product configuration.",
    ],
    source: {
      label: "GOV.UK — Electrical Equipment (Safety) Regulations 2016",
      url: "https://www.gov.uk/government/publications/electrical-equipment-safety-regulations-2016",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "uk-weee",
    title: "UK WEEE producer-responsibility obligations",
    shortName: "UK WEEE",
    group: "environmental",
    markets: ["united-kingdom"],
    products: ["wireless-headphones", "bluetooth-speakers", "power-banks", "led-lights"],
    status: "likely",
    summary:
      "Businesses that put electrical and electronic equipment on the UK market can have WEEE producer-registration, reporting, financing and product-marking duties.",
    why:
      "The detected product is electrical/electronic equipment supplied into the UK market.",
    documents: [
      "Producer registration/compliance-scheme records where applicable",
      "EEE category and placed-on-market records",
    ],
    labels: [
      "Crossed-out wheeled-bin symbol and date mark where applicable",
    ],
    actions: [
      "Identify which legal entity is the UK WEEE producer.",
      "Confirm registration/reporting route and EEE category before sale.",
    ],
    source: {
      label: "GOV.UK — EEE producer responsibilities",
      url: "https://www.gov.uk/guidance/electrical-and-electronic-equipment-eee-producer-responsibility",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "uk-batteries",
    title: "UK battery placing-on-market and producer obligations",
    shortName: "UK Batteries",
    group: "battery",
    markets: ["united-kingdom"],
    requiresFeatures: ["battery"],
    status: "likely",
    summary:
      "Batteries and battery-powered appliances supplied in the UK can trigger substance, marking, capacity and producer-responsibility obligations.",
    why:
      "The product contains or is itself a battery and is intended for the UK market.",
    documents: [
      "Battery chemistry and capacity records",
      "Supplier compliance evidence",
      "Producer-responsibility records where applicable",
    ],
    labels: [
      "Battery markings and capacity information where required",
      "Waste-battery collection marking where applicable",
    ],
    actions: [
      "Identify the battery type and the obligated producer.",
      "Check placing-on-market and waste-battery obligations separately.",
    ],
    source: {
      label: "GOV.UK — Regulations: batteries and accumulators",
      url: "https://www.gov.uk/guidance/batteries",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "uk-toys",
    title: "UK Toys (Safety) Regulations 2011",
    shortName: "UK Toy Safety",
    group: "toy",
    markets: ["united-kingdom"],
    products: ["toys"],
    status: "required",
    summary:
      "Toys placed on the Great Britain market must meet the essential safety requirements in the Toys (Safety) Regulations 2011; Northern Ireland follows a separate route.",
    why:
      "The detected product is a toy and the selected destination is the United Kingdom.",
    documents: [
      "Safety assessment",
      "Technical documentation",
      "Declaration of conformity",
      "Relevant toy-safety test evidence",
    ],
    labels: [
      "Applicable conformity marking",
      "Age and safety warnings where applicable",
      "Manufacturer/importer and traceability information",
    ],
    actions: [
      "Confirm intended age group and foreseeable use.",
      "Use the separate NI route if selling into Northern Ireland.",
    ],
    source: {
      label: "GOV.UK — Toys (Safety) Regulations 2011",
      url: "https://www.gov.uk/government/publications/toys-safety-regulations-2011",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "ca-ccpsa",
    title: "Canada Consumer Product Safety Act baseline",
    shortName: "CCPSA",
    group: "product-safety",
    markets: ["canada"],
    excludesProducts: ["cosmetics"],
    status: "likely",
    summary:
      "The CCPSA applies broadly to suppliers of consumer products in Canada and includes general safety, recordkeeping, incident-reporting, corrective-action and recall obligations.",
    why:
      "The product is a consumer product being manufactured, imported, advertised or sold in Canada.",
    documents: [
      "Supplier/manufacturer/importer records",
      "Safety evidence for known product hazards",
      "Incident and corrective-action records",
    ],
    labels: [
      "Product identification and safety information appropriate to the product",
    ],
    actions: [
      "Confirm whether a product-specific regulation under the CCPSA also applies.",
      "Maintain required traceability records and incident-reporting readiness.",
    ],
    source: {
      label: "Health Canada — CCPSA Quick Reference Guide",
      url: "https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/canada-consumer-product-safety-act-guide.html",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "ca-toys",
    title: "Canada Toys Regulations",
    shortName: "Canada Toys Regulations",
    group: "toy",
    markets: ["canada"],
    products: ["toys"],
    status: "required",
    summary:
      "The Toys Regulations under the CCPSA set mandatory safety requirements for children's toys and related products sold in Canada.",
    why:
      "The detected product is a toy intended for children and is being sold in Canada.",
    documents: [
      "Applicable mechanical/physical/flammability/chemical test evidence",
      "Product age-grading and hazard assessment",
    ],
    labels: [
      "Warnings and safety information required for the specific toy hazard",
      "Traceable product identification",
    ],
    actions: [
      "Map the toy design to the specific Toys Regulations provisions that apply.",
      "Confirm age grading and any small-parts, magnet, battery or flammability hazards.",
    ],
    source: {
      label: "Health Canada — Toys Regulations FAQ",
      url: "https://www.canada.ca/en/health-canada/corporate/about-health-canada/legislation-guidelines/acts-regulations/frequently-asked-questions-toys-regulations.html",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "ca-cosmetics",
    title: "Canada Cosmetic Regulations and notification",
    shortName: "Canada Cosmetics",
    group: "cosmetics",
    markets: ["canada"],
    products: ["cosmetics"],
    status: "required",
    summary:
      "Manufacturers and importers are responsible for compliance with Canada's Food and Drugs Act and Cosmetic Regulations and must submit the required cosmetic notification within the statutory timeline after first sale.",
    why:
      "The detected product is a cosmetic intended for sale in Canada.",
    documents: [
      "Cosmetic Notification Form information",
      "Full ingredient/formulation records",
      "Manufacturing/importing and label-contact records",
    ],
    labels: [
      "Required cosmetic product identity and ingredient information",
      "Required contact and warning information",
    ],
    actions: [
      "Confirm the product is legally classified as a cosmetic rather than a drug or natural health product.",
      "Prepare the Cosmetic Notification Form data and keep it current.",
    ],
    source: {
      label: "Health Canada — Notification of Cosmetics",
      url: "https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/notification-cosmetics.html",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "ca-led-ices005",
    title: "Canada ICES-005 lighting-equipment emissions requirements",
    shortName: "ICES-005",
    group: "electrical",
    markets: ["canada"],
    products: ["led-lights"],
    requiresFeatures: ["electronic"],
    status: "required",
    summary:
      "ICES-005 sets radiated/conducted radio-frequency emission limits and administrative requirements for in-scope lighting equipment with active or switching electronics.",
    why:
      "The detected product is electronic lighting equipment intended for the Canadian market.",
    documents: [
      "ICES-005 / ICES-Gen compliance test evidence",
      "Technical records identifying the tested lighting model",
    ],
    labels: [
      "Administrative/compliance information required by the applicable ISED standards",
    ],
    actions: [
      "Confirm the final lamp/luminaire is within ICES-005 scope.",
      "Match emission testing to the final driver and electronic configuration.",
    ],
    source: {
      label: "ISED — ICES-005 Lighting Equipment",
      url: "https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/devices-and-equipment/interference-causing-equipment-standards-ices/ices-005-lighting-equipment",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "ca-childrens-jewelry",
    title: "Canada Children's Jewellery Regulations",
    shortName: "Children's Jewellery Regulations",
    group: "product-safety",
    markets: ["canada"],
    products: ["jewelry"],
    requiresFeatures: ["children"],
    status: "required",
    summary:
      "Jewellery that appeals primarily to children under 15 is subject to Canada's Children's Jewellery Regulations, including total lead and cadmium limits.",
    why:
      "You confirmed that the jewellery is designed or marketed for children.",
    documents: [
      "Lead and cadmium composition/test evidence",
      "Material and coating specifications",
    ],
    labels: [
      "Accurate age/product positioning and material claims",
    ],
    actions: [
      "Confirm whether the item meets the legal definition of children's jewellery.",
      "Verify regulated lead and cadmium limits for every relevant component.",
    ],
    source: {
      label: "Health Canada — Industry Guide to Children's Jewellery",
      url: "https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/guide-children-jewellery/guidance-document.html",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "us-cpsc-general",
    title: "US CPSC consumer-product safety and reporting baseline",
    shortName: "CPSA / CPSC",
    group: "product-safety",
    markets: ["united-states"],
    excludesProducts: ["cosmetics"],
    status: "likely",
    summary:
      "Many consumer products within CPSC jurisdiction are subject to federal safety prohibitions, product-specific rules where applicable, and mandatory reporting/corrective-action duties for substantial product hazards.",
    why:
      "The product is a consumer product being offered in the United States and is not primarily regulated as a cosmetic.",
    documents: [
      "Product safety and hazard-assessment records",
      "Applicable CPSC test/certification evidence where a specific rule applies",
      "Incident and corrective-action records",
    ],
    labels: [
      "Warnings and identification required by any product-specific CPSC rule",
    ],
    actions: [
      "Map the product to any specific CPSC rule, ban or mandatory standard.",
      "Do not assume a general federal premarket certificate exists if no specific CPSC rule requires one.",
    ],
    source: {
      label: "CPSC — Business & Manufacturing",
      url: "https://www.cpsc.gov/Business--Manufacturing",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "us-lithium-transport",
    title: "US lithium-battery transport test-summary requirements",
    shortName: "UN 38.3 / PHMSA",
    group: "battery",
    markets: ["united-states"],
    products: ["wireless-headphones", "bluetooth-speakers", "power-banks"],
    requiresFeatures: ["battery"],
    status: "likely",
    summary:
      "Lithium batteries must pass the UN Manual of Tests and Criteria 38.3 design-test series, and manufacturers/distributors must make the required lithium-battery test summary available for transport compliance.",
    why:
      "The product contains a lithium battery and will commonly need to be transported into or within the United States.",
    documents: [
      "UN 38.3 lithium-battery test summary",
      "Battery-cell/pack transport classification data",
      "Shipping documentation required for the selected transport mode",
    ],
    labels: [
      "Transport marks/labels required by the battery configuration and shipping mode",
    ],
    actions: [
      "Obtain the UN 38.3 test summary from the cell/pack manufacturer.",
      "Verify shipping classification separately from product-market compliance.",
    ],
    source: {
      label: "PHMSA — Lithium Battery Test Summaries",
      url: "https://www.phmsa.dot.gov/training/hazmat/new-un-requirement-test-summaries",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "us-childrens-jewelry",
    title: "US children's-product lead requirements for jewellery",
    shortName: "CPSIA Lead / CPC",
    group: "product-safety",
    markets: ["united-states"],
    products: ["jewelry"],
    requiresFeatures: ["children"],
    status: "required",
    summary:
      "Children's jewellery can be subject to federal children's-product lead-content requirements and certification/testing obligations enforced by CPSC.",
    why:
      "You confirmed that the jewellery is designed or marketed for children.",
    documents: [
      "Lead-content test evidence from an appropriate laboratory where required",
      "Children's Product Certificate where the applicable rule requires certification",
    ],
    labels: [
      "Children's-product tracking information where applicable",
    ],
    actions: [
      "Confirm the item is a children's product under CPSC rules.",
      "Check all applicable lead, surface-coating and small-parts requirements.",
    ],
    source: {
      label: "CPSC — Total Lead Content",
      url: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Lead/Total-Lead-Content",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "us-cosmetics-mocra",
    title: "US MoCRA cosmetic facility registration and product listing",
    shortName: "MoCRA",
    group: "cosmetics",
    markets: ["united-states"],
    products: ["cosmetics"],
    status: "verify",
    summary:
      "MoCRA created facility-registration and cosmetic-product listing duties, with exemptions for certain businesses/products. These are not FDA product approvals.",
    why:
      "The detected product is a cosmetic intended for the US market, so current MoCRA registration/listing duties and exemptions need to be checked.",
    documents: [
      "Facility registration record where applicable",
      "Cosmetic product listing record where applicable",
    ],
    labels: [],
    actions: [
      "Determine whether the responsible person/facility is subject to MoCRA registration or listing.",
      "Check current exemptions before treating either filing as mandatory.",
    ],
    source: {
      label: "FDA — Cosmetic Product Facility Registration and Product Listing",
      url: "https://www.fda.gov/cosmetics/registration-listing-cosmetic-product-facilities-and-products",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "au-consumer-product-safety",
    title: "Australian Consumer Law product-safety baseline",
    shortName: "ACL Product Safety",
    group: "product-safety",
    markets: ["australia"],
    status: "likely",
    summary:
      "Suppliers in Australia must check whether mandatory product-safety standards, information standards or permanent/interim bans apply to the exact product before supply.",
    why:
      "The selected destination is Australia and the product is being supplied to consumers.",
    documents: [
      "Evidence of compliance with any applicable mandatory standard",
      "Product/batch records supporting safety and recall readiness",
    ],
    labels: [
      "Any mandatory information required by the applicable product standard",
    ],
    actions: [
      "Search the ACCC mandatory-standards and bans register for the exact product category.",
      "Do not assume every Australian consumer product has a mandatory standard.",
    ],
    source: {
      label: "ACCC Product Safety — standards and how to comply",
      url: "https://www.productsafety.gov.au/business/understand-product-safety-rules/product-safety-standards-and-how-to-comply",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "au-toys-under3",
    title: "Australia mandatory standard for toys for children up to 36 months",
    shortName: "AU Toys ≤36 months",
    group: "toy",
    markets: ["australia"],
    products: ["toys"],
    status: "verify",
    summary:
      "A mandatory Australian safety standard applies to toys manufactured, designed, labelled or marketed as playthings for children up to and including 36 months of age.",
    why:
      "The product is a toy, but the exact age grading has not yet been confirmed.",
    documents: [
      "Age-grading evidence",
      "Test reports to an accepted toy-safety standard where the mandatory standard applies",
    ],
    labels: [
      "Age/safety information consistent with the tested product and mandatory standard",
    ],
    actions: [
      "Confirm whether the intended age group includes children 36 months or younger.",
      "If yes, verify the current mandatory standard and accepted test-standard route.",
    ],
    source: {
      label: "ACCC Product Safety — Toys for children up to 36 months",
      url: "https://www.productsafety.gov.au/business/search-mandatory-standards/toys-for-children-up-to-and-including-36-months-of-age-mandatory-standard",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "au-cosmetics-label",
    title: "Australia mandatory cosmetics ingredient-labelling standard",
    shortName: "Cosmetics Information Standard",
    group: "cosmetics",
    markets: ["australia"],
    products: ["cosmetics"],
    status: "required",
    summary:
      "Cosmetic products supplied in Australia are subject to the mandatory cosmetics ingredient-information standard unless an exclusion applies.",
    why:
      "The detected product is a cosmetic intended for the Australian consumer market.",
    documents: [
      "Full final ingredient list",
      "Records supporting product classification and ingredient order",
    ],
    labels: [
      "Ingredient information at the required point of sale",
      "Ingredients listed in the permitted order under the mandatory standard",
    ],
    actions: [
      "Confirm the product is within the cosmetics information standard and not an excluded therapeutic good.",
      "Match the ingredient list to the final formulation sold.",
    ],
    source: {
      label: "ACCC Product Safety — Cosmetics ingredients labelling mandatory standard",
      url: "https://www.productsafety.gov.au/business/search-mandatory-standards/cosmetics-ingredients-labelling-mandatory-standard",
    },
    lastVerified: "2026-09-07",
  },
  {
    id: "au-candle-lead-wick",
    title: "Australia permanent ban on candles with lead wicks",
    shortName: "Lead-wick candle ban",
    group: "product-safety",
    markets: ["australia"],
    products: ["candles"],
    status: "required",
    summary:
      "Australia permanently bans candles and candle wicks with lead content above the permitted threshold in the wick.",
    why:
      "The detected product is a candle intended for supply in Australia.",
    documents: [
      "Wick material specification",
      "Supplier declaration or test evidence showing compliant wick composition",
    ],
    labels: [],
    actions: [
      "Confirm the wick construction and supplier specification.",
      "Do not supply candles using a prohibited lead-core wick.",
    ],
    source: {
      label: "ACCC Product Safety — Candles with lead wicks ban",
      url: "https://www.productsafety.gov.au/business/find-banned-products/candles-with-lead-wicks-ban",
    },
    lastVerified: "2026-09-07",
  },
];
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

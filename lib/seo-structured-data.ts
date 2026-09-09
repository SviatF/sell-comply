export const SITE_ORIGIN = "https://sellcomply.com";
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

export type SeoPageSchemaType =
  | "WebPage"
  | "AboutPage"
  | "ContactPage"
  | "CollectionPage";

type BreadcrumbLike = {
  name: string;
  href: string;
};

type CollectionItem = {
  name: string;
  href: string;
};

type FaqItem = {
  q: string;
  a: string;
};

export function absoluteSeoUrl(path: string) {
  return new URL(path, SITE_ORIGIN).toString();
}

export function getSiteIdentitySchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "SellComply",
        url: SITE_ORIGIN,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "SellComply",
        url: SITE_ORIGIN,
        publisher: { "@id": ORGANIZATION_ID },
        inLanguage: "en",
      },
    ],
  };
}

export function buildWebPageSchema({
  path,
  name,
  description,
  type = "WebPage",
  about,
}: {
  path: string;
  name: string;
  description: string;
  type?: Exclude<SeoPageSchemaType, "CollectionPage">;
  about?: Record<string, unknown>;
}) {
  const url = absoluteSeoUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
    ...(path === "/" ? {} : { breadcrumb: { "@id": `${url}#breadcrumb` } }),
    ...(about ? { about } : {}),
  };
}

export function buildCollectionPageSchema({
  path,
  name,
  description,
  items,
}: {
  path: string;
  name: string;
  description: string;
  items: CollectionItem[];
}) {
  const page = buildWebPageSchema({
    path,
    name,
    description,
    type: "WebPage",
  });

  return {
    ...page,
    "@type": "CollectionPage",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteSeoUrl(item.href),
      })),
    },
  };
}

export function buildFaqPageSchema(path: string, faqs: FaqItem[]) {
  const url = absoluteSeoUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    isPartOf: { "@id": `${url}#webpage` },
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbLike[]) {
  if (items.length < 2) return null;

  const current = items[items.length - 1];
  const url = absoluteSeoUrl(current.href);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteSeoUrl(item.href),
    })),
  };
}

import Link from "next/link";
import { Fragment } from "react";
import type { SeoBreadcrumbItem } from "@/lib/seo-breadcrumbs";
import SeoJsonLd from "@/app/components/SeoJsonLd";
import { buildBreadcrumbSchema } from "@/lib/seo-structured-data";

type Props = {
  items: SeoBreadcrumbItem[];
};

export default function SeoBreadcrumbs({ items }: Props) {
  if (items.length < 2) return null;

  const schema = buildBreadcrumbSchema(items);

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={item.href}>
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {isLast ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link href={item.href}>{item.name}</Link>
              )}
            </Fragment>
          );
        })}
      </nav>
      {schema ? <SeoJsonLd data={schema} /> : null}
    </>
  );
}

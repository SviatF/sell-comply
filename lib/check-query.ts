import type { ProductFacts } from "@/lib/compliance-engine";

export type CheckQueryInput = {
  product?: string;
  country?: string;
  marketplace?: string;
  radio?: string;
  battery?: string;
  children?: string;
  mains?: string;
  role?: string;
};

export function parseCheckFacts(params: CheckQueryInput): ProductFacts {
  const parseFact = (value?: string) =>
    value === "yes" ? true : value === "no" ? false : undefined;

  const allowedRoles = new Set([
    "manufacturer",
    "importer",
    "distributor",
    "seller",
  ]);

  return {
    radio: parseFact(params.radio),
    battery: parseFact(params.battery),
    children: parseFact(params.children),
    mains: parseFact(params.mains),
    role: allowedRoles.has(params.role || "")
      ? (params.role as ProductFacts["role"])
      : undefined,
  };
}

export function buildCheckParams({
  product,
  country,
  marketplace,
  facts,
}: {
  product: string;
  country: string;
  marketplace?: string;
  facts?: ProductFacts;
}) {
  const params = new URLSearchParams({
    product,
    country,
  });

  if (marketplace) params.set("marketplace", marketplace);

  const setFact = (key: "radio" | "battery" | "children" | "mains") => {
    const value = facts?.[key];
    if (value === true) params.set(key, "yes");
    if (value === false) params.set(key, "no");
  };

  setFact("radio");
  setFact("battery");
  setFact("children");
  setFact("mains");

  if (facts?.role) params.set("role", facts.role);

  return params;
}

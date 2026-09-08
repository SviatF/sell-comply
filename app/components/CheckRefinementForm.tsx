"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";

type TriState = "" | "yes" | "no";

type Props = {
  rawProduct: string;
  country: string;
  marketplace: string;
  inferredFeatures: string[];
  initial: {
    radio?: string;
    battery?: string;
    children?: string;
    mains?: string;
    role?: string;
  };
};

const options: Array<{
  key: "radio" | "battery" | "children" | "mains";
  label: string;
  question: string;
}> = [
  {
    key: "radio",
    label: "RADIO",
    question: "Bluetooth / Wi-Fi / radio transmitter?",
  },
  {
    key: "battery",
    label: "BATTERY",
    question: "Contains or includes a battery?",
  },
  {
    key: "children",
    label: "CHILDREN",
    question: "Designed or marketed for children?",
  },
  {
    key: "mains",
    label: "MAINS POWER",
    question: "Connects directly to mains electricity?",
  },
];

function normalizeTriState(value?: string): TriState {
  return value === "yes" || value === "no" ? value : "";
}

export default function CheckRefinementForm({
  rawProduct,
  country,
  marketplace,
  inferredFeatures,
  initial,
}: Props) {
  const router = useRouter();

  const inferred = useMemo(
    () => new Set(inferredFeatures),
    [inferredFeatures]
  );

  const [values, setValues] = useState<Record<string, string>>({
    radio: normalizeTriState(initial.radio),
    battery: normalizeTriState(initial.battery),
    children: normalizeTriState(initial.children),
    mains: normalizeTriState(initial.mains),
    role: initial.role || "",
  });

  const [busy, setBusy] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);

    const params = new URLSearchParams({
      product: rawProduct,
      country,
    });

    if (marketplace) params.set("marketplace", marketplace);

    for (const key of ["radio", "battery", "children", "mains"]) {
      if (values[key] === "yes" || values[key] === "no") {
        params.set(key, values[key]);
      }
    }

    if (values.role) params.set("role", values.role);

    trackEvent("checker_refined", {
      metadata: {
        country,
        marketplace: marketplace || null,
        confirmedFacts: ["radio", "battery", "children", "mains"].filter(
          (key) => values[key] === "yes" || values[key] === "no"
        ).length,
        roleConfirmed: Boolean(values.role),
      },
    });

    router.push(`/check?${params.toString()}`);
  };

  return (
    <form className="check-refine-card" onSubmit={submit}>
      <div className="check-refine-head">
        <div>
          <span className="seo-kicker"><i /> IMPROVE ACCURACY</span>
          <h2>Confirm the product facts.</h2>
        </div>
        <p>
          Auto-detection is a screening step. Confirm the facts below to remove
          rules that clearly do not apply and expose rules triggered by the
          final product configuration.
        </p>
      </div>

      <div className="check-refine-grid">
        {options.map((option) => {
          const inferredYes = inferred.has(option.key);
          const selected = values[option.key] as TriState;

          return (
            <div className="refine-field" key={option.key}>
              <div className="refine-field-copy">
                <span>{option.label}</span>
                <strong>{option.question}</strong>
                {!selected && (
                  <small>
                    Auto-detected: {inferredYes ? "likely yes" : "unknown"}
                  </small>
                )}
              </div>

              <div className="refine-toggle" role="group" aria-label={option.question}>
                <button
                  type="button"
                  className={selected === "yes" ? "active" : ""}
                  onClick={() =>
                    setValues((current) => ({ ...current, [option.key]: "yes" }))
                  }
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={selected === "no" ? "active" : ""}
                  onClick={() =>
                    setValues((current) => ({ ...current, [option.key]: "no" }))
                  }
                >
                  No
                </button>
                <button
                  type="button"
                  className={!selected ? "active muted" : ""}
                  onClick={() =>
                    setValues((current) => ({ ...current, [option.key]: "" }))
                  }
                >
                  Not sure
                </button>
              </div>
            </div>
          );
        })}

        <div className="refine-field role-field">
          <div className="refine-field-copy">
            <span>YOUR ROLE</span>
            <strong>How do you place this product on the market?</strong>
            <small>Obligations can change by supply-chain role.</small>
          </div>

          <select
            value={values.role}
            onChange={(event) =>
              setValues((current) => ({ ...current, role: event.target.value }))
            }
            aria-label="Supply-chain role"
          >
            <option value="">Not sure yet</option>
            <option value="manufacturer">Manufacturer / private label</option>
            <option value="importer">Importer</option>
            <option value="distributor">Distributor</option>
            <option value="seller">Marketplace / online seller</option>
          </select>
        </div>
      </div>

      <div className="check-refine-footer">
        <span>
          This refinement changes screening logic only; it does not certify compliance.
        </span>
        <button type="submit" disabled={busy}>
          {busy ? "Updating…" : "Update compliance review →"}
        </button>
      </div>
    </form>
  );
}

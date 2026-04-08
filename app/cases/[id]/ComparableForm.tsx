"use client";

import { useState } from "react";
import { FACTOR_OPTIONS, type Adjustment } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";
import {
  inputClass,
  inputErrorClass,
  btnPrimary,
  btnDashed,
  btnRemove,
  card,
  labelClass,
  overline,
} from "@/lib/styles";

const TRANSACTION_TYPE_OPTIONS = [
  "Sale",
  "Letting",
  "Rent Review",
  "Lease Renewal",
];

function emptyAdjustment(): Adjustment {
  return { factor: "location", percentage: 0, rationale: "" };
}

export default function ComparableForm({
  action,
  redirectStep,
}: {
  action: (formData: FormData) => void;
  redirectStep?: string;
}) {
  const [priceOrRent, setPriceOrRent] = useState("");
  const [area, setArea] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  const price = parseFloat(priceOrRent);
  const areaVal = parseFloat(area);
  const ratePreview =
    !isNaN(price) && !isNaN(areaVal) && areaVal > 0 ? price / areaVal : null;

  const totalPct = adjustments.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0
  );
  const adjustedRatePreview =
    ratePreview !== null && adjustments.length > 0
      ? ratePreview * (1 + totalPct / 100)
      : null;

  const hasFieldError = (field: "price" | "area") =>
    errors.some((e) =>
      field === "price" ? e.includes("Price") : e.includes("Area")
    );

  function updateAdjustment(
    index: number,
    field: keyof Adjustment,
    value: string | number
  ) {
    setAdjustments((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  function removeAdjustment(index: number) {
    setAdjustments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const newErrors: string[] = [];

    if (!priceOrRent || isNaN(price) || price <= 0) {
      newErrors.push("Price / Rent must be greater than 0.");
    }
    if (!area || isNaN(areaVal) || areaVal <= 0) {
      newErrors.push("Gross Internal Area must be greater than 0.");
    }

    if (newErrors.length > 0) {
      e.preventDefault();
      setErrors(newErrors);
      return;
    }

    setErrors([]);
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className="rounded-xl border border-dashed border-zinc-200 p-5"
    >
      {redirectStep && <input type="hidden" name="_step" value={redirectStep} />}
      <h3 className={`${overline} mb-4`}>Add Comparable</h3>

      {errors.length > 0 && (
        <div className="mb-4 rounded-xl bg-red-50/80 px-4 py-3 ring-1 ring-red-200/60">
          <ul className="space-y-1">
            {errors.map((err) => (
              <li
                key={err}
                className="flex items-center gap-2 text-sm text-red-700"
              >
                <span className="text-red-400">&#10005;</span>
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="comp_address" className={labelClass}>
            Address
          </label>
          <input
            type="text"
            id="comp_address"
            name="address"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="transaction_type" className={labelClass}>
            Transaction Type
          </label>
          <select
            id="transaction_type"
            name="transaction_type"
            required
            className={inputClass}
          >
            <option value="">Select type...</option>
            {TRANSACTION_TYPE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="transaction_date" className={labelClass}>
            Transaction Date
          </label>
          <input
            type="date"
            id="transaction_date"
            name="transaction_date"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="price_or_rent" className={labelClass}>
            Price / Rent (&euro;)
          </label>
          <input
            type="number"
            id="price_or_rent"
            name="price_or_rent"
            required
            step="0.01"
            min="0.01"
            value={priceOrRent}
            onChange={(e) => {
              setPriceOrRent(e.target.value);
              if (errors.length > 0) setErrors([]);
            }}
            className={hasFieldError("price") ? inputErrorClass : inputClass}
          />
        </div>

        <div>
          <label htmlFor="comp_gross_internal_area" className={labelClass}>
            Gross Internal Area (sq m)
          </label>
          <input
            type="number"
            id="comp_gross_internal_area"
            name="gross_internal_area"
            required
            step="0.01"
            min="0.01"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              if (errors.length > 0) setErrors([]);
            }}
            className={hasFieldError("area") ? inputErrorClass : inputClass}
          />
        </div>

        {ratePreview !== null && (
          <div className="bg-zinc-50 rounded-lg px-3.5 py-2.5">
            <span className="text-sm text-zinc-500">
              Raw rate:{" "}
              <span className="font-semibold text-zinc-900">
                &euro;{fmtCurrency(ratePreview)}/sq m
              </span>
            </span>
          </div>
        )}

        {/* Inline Adjustments */}
        <div className="border-t border-zinc-100 pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className={overline}>Adjustments</h4>
            <span className="text-xs text-zinc-300">Optional</span>
          </div>

          {adjustments.length > 0 && (
            <div className="space-y-2 mb-3">
              {adjustments.map((adj, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_80px_1fr_28px] gap-2 items-start"
                >
                  <select
                    value={adj.factor}
                    onChange={(e) =>
                      updateAdjustment(i, "factor", e.target.value)
                    }
                    className={inputClass}
                  >
                    {FACTOR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={adj.percentage}
                    onChange={(e) =>
                      updateAdjustment(
                        i,
                        "percentage",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="%"
                    step="0.5"
                    className={inputClass + " text-right tabular-nums"}
                  />

                  <input
                    type="text"
                    value={adj.rationale}
                    onChange={(e) =>
                      updateAdjustment(i, "rationale", e.target.value)
                    }
                    placeholder="Rationale"
                    className={inputClass}
                  />

                  <button
                    type="button"
                    onClick={() => removeAdjustment(i)}
                    className={btnRemove}
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setAdjustments([...adjustments, emptyAdjustment()])
            }
            className={btnDashed}
          >
            + Add adjustment
          </button>

          {adjustments.length > 0 && ratePreview !== null && (
            <div
              className={`mt-3 text-sm ${card} px-3.5 py-2.5 flex justify-between items-center`}
            >
              <span className="text-zinc-500">
                Total: {totalPct >= 0 ? "+" : ""}
                {totalPct.toFixed(1)}%
              </span>
              <span className="font-semibold text-zinc-900 tabular-nums">
                Adjusted: &euro;{fmtCurrency(adjustedRatePreview!)}/sq m
              </span>
            </div>
          )}
        </div>

        <input
          type="hidden"
          name="adjustments_json"
          value={JSON.stringify(adjustments)}
        />

        <div className="pt-2">
          <button type="submit" className={btnPrimary}>
            Add Comparable
          </button>
        </div>
      </div>
    </form>
  );
}

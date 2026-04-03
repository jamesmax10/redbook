"use client";

import { useState } from "react";

const inputClass =
  "w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent";

const inputErrorClass =
  "w-full border border-red-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent";

const TRANSACTION_TYPE_OPTIONS = [
  "Sale",
  "Letting",
  "Rent Review",
  "Lease Renewal",
];

const FACTOR_OPTIONS = [
  { value: "location", label: "Location" },
  { value: "condition", label: "Condition" },
  { value: "size", label: "Size" },
  { value: "age", label: "Age" },
  { value: "specification", label: "Specification" },
  { value: "lease_terms", label: "Lease Terms" },
  { value: "parking", label: "Parking" },
  { value: "floor_level", label: "Floor Level" },
  { value: "market_movement", label: "Market Movement" },
  { value: "other", label: "Other" },
];

interface Adjustment {
  factor: string;
  percentage: number;
  rationale: string;
}

function emptyAdjustment(): Adjustment {
  return { factor: "location", percentage: 0, rationale: "" };
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ComparableForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [priceOrRent, setPriceOrRent] = useState("");
  const [area, setArea] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  const price = parseFloat(priceOrRent);
  const areaVal = parseFloat(area);
  const ratePreview =
    !isNaN(price) && !isNaN(areaVal) && areaVal > 0
      ? price / areaVal
      : null;

  const totalPct = adjustments.reduce((sum, a) => sum + (a.percentage || 0), 0);
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
      className="rounded-lg border border-dashed border-zinc-200 p-5"
    >
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
        Add Comparable
      </h3>

      {errors.length > 0 && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <ul className="space-y-1">
            {errors.map((err) => (
              <li key={err} className="flex items-center gap-2 text-sm text-red-700">
                <span className="text-red-400">&#10005;</span>
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="comp_address"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
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
          <label
            htmlFor="transaction_type"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
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
          <label
            htmlFor="transaction_date"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
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
          <label
            htmlFor="price_or_rent"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
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
          <label
            htmlFor="comp_gross_internal_area"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
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
          <div className="bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">
            <span className="text-sm text-zinc-600">
              Raw rate:{" "}
              <span className="font-semibold text-zinc-900">
                &euro;{formatCurrency(ratePreview)}/sq m
              </span>
            </span>
          </div>
        )}

        {/* Inline Adjustments */}
        <div className="border-t border-zinc-100 pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
              Adjustments
            </h4>
            <span className="text-xs text-zinc-400">Optional</span>
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
                    className="text-zinc-400 hover:text-red-600 text-lg leading-none pt-2"
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
            className="text-xs text-zinc-600 hover:text-zinc-900 border border-dashed border-zinc-300 rounded-md px-3 py-1.5 w-full"
          >
            + Add adjustment
          </button>

          {adjustments.length > 0 && ratePreview !== null && (
            <div className="mt-3 text-sm bg-white border border-zinc-200 rounded-md px-3 py-2 flex justify-between items-center">
              <span className="text-zinc-600">
                Total: {totalPct >= 0 ? "+" : ""}
                {totalPct.toFixed(1)}%
              </span>
              <span className="font-semibold text-zinc-900">
                Adjusted: &euro;{formatCurrency(adjustedRatePreview!)}/sq m
              </span>
            </div>
          )}
        </div>

        <input
          type="hidden"
          name="adjustments_json"
          value={JSON.stringify(adjustments)}
        />

        <div className="pt-1">
          <button
            type="submit"
            className="bg-zinc-900 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700"
          >
            Add Comparable
          </button>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { saveAdjustments, type Adjustment } from "@/app/actions";

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

const inputClass =
  "w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface Props {
  comparableId: string;
  caseId: string;
  ratePerSqm: number;
  initialAdjustments: Adjustment[] | null;
}

function emptyAdjustment(): Adjustment {
  return { factor: "location", percentage: 0, rationale: "" };
}

export default function AdjustmentsEditor({
  comparableId,
  caseId,
  ratePerSqm,
  initialAdjustments,
}: Props) {
  const [open, setOpen] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    initialAdjustments ?? []
  );
  const [isPending, startTransition] = useTransition();

  const totalPct = adjustments.reduce((sum, a) => sum + (a.percentage || 0), 0);
  const liveAdjustedRate = ratePerSqm * (1 + totalPct / 100);

  const savedTotalPct = initialAdjustments
    ? initialAdjustments.reduce((sum, a) => sum + a.percentage, 0)
    : 0;
  const isDirty =
    JSON.stringify(adjustments) !== JSON.stringify(initialAdjustments ?? []);

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

  function handleSave() {
    startTransition(() => {
      saveAdjustments(comparableId, caseId, adjustments);
    });
  }

  const hasSavedAdjustments =
    initialAdjustments && initialAdjustments.length > 0;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
      >
        <span
          className="inline-block transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          &#9654;
        </span>
        {hasSavedAdjustments
          ? `Adjustments (${initialAdjustments.length}) \u2014 ${savedTotalPct >= 0 ? "+" : ""}${savedTotalPct}%`
          : "Add adjustments"}
      </button>

      {open && (
        <div className="mt-3 border border-zinc-200 rounded-md p-4 bg-zinc-50 space-y-3">
          {adjustments.map((adj, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_80px_1fr_28px] gap-2 items-start"
            >
              <select
                value={adj.factor}
                onChange={(e) => updateAdjustment(i, "factor", e.target.value)}
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
                  updateAdjustment(i, "percentage", parseFloat(e.target.value) || 0)
                }
                placeholder="%"
                step="0.5"
                className={inputClass + " text-right tabular-nums"}
              />

              <input
                type="text"
                value={adj.rationale}
                onChange={(e) => updateAdjustment(i, "rationale", e.target.value)}
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

          <button
            type="button"
            onClick={() => setAdjustments([...adjustments, emptyAdjustment()])}
            className="text-xs text-zinc-600 hover:text-zinc-900 border border-dashed border-zinc-300 rounded-md px-3 py-1.5 w-full"
          >
            + Add adjustment
          </button>

          {adjustments.length > 0 && (
            <div className="text-sm bg-white border border-zinc-200 rounded-md px-3 py-2 flex justify-between items-center">
              <span className="text-zinc-600">
                Total: {totalPct >= 0 ? "+" : ""}
                {totalPct.toFixed(1)}%
              </span>
              <span className="font-semibold text-zinc-900">
                Adjusted: &euro;{formatCurrency(liveAdjustedRate)}/sq m
              </span>
            </div>
          )}

          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="bg-zinc-900 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700 disabled:opacity-50"
            >
              {isPending ? "Saving\u2026" : "Save Adjustments"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

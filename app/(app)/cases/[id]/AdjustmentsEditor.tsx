"use client";

import { useState, useTransition } from "react";
import { saveAdjustments } from "@/app/actions";
import { FACTOR_OPTIONS, type Adjustment } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";
import {
  inputClass,
  btnPrimary,
  btnDashed,
  btnRemove,
  card,
} from "@/lib/styles";

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

  const totalPct = adjustments.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0
  );
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
        className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
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
        <div className="mt-3 rounded-lg p-4 bg-zinc-50/80 space-y-3">
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

          <button
            type="button"
            onClick={() =>
              setAdjustments([...adjustments, emptyAdjustment()])
            }
            className={btnDashed}
          >
            + Add adjustment
          </button>

          {adjustments.length > 0 && (
            <div
              className={`text-sm ${card} px-3.5 py-2.5 flex justify-between items-center`}
            >
              <span className="text-zinc-500">
                Total: {totalPct >= 0 ? "+" : ""}
                {totalPct.toFixed(1)}%
              </span>
              <span className="font-semibold text-zinc-900 tabular-nums">
                Adjusted: &euro;{fmtCurrency(liveAdjustedRate)}/sq m
              </span>
            </div>
          )}

          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className={btnPrimary}
            >
              {isPending ? "Saving\u2026" : "Save Adjustments"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

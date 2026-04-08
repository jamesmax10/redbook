"use client";

import { useState, useTransition, Fragment } from "react";
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
import DeleteComparableButton from "./DeleteComparableButton";

function emptyAdjustment(): Adjustment {
  return { factor: "location", percentage: 0, rationale: "" };
}

interface ComparableData {
  id: string;
  address: string;
  transaction_type: string;
  transaction_date: string;
  price_or_rent: number;
  gross_internal_area: number;
  rate_per_sqm: number;
  adjustments: Adjustment[] | null;
  adjusted_rate_per_sqm: number | null;
}

interface Props {
  comp: ComparableData;
  caseId: string;
  redirectStep?: string;
}

export default function ComparableRow({ comp, caseId, redirectStep }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    comp.adjustments ?? []
  );
  const [isPending, startTransition] = useTransition();

  const totalPct = adjustments.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0
  );
  const liveAdjustedRate = Number(comp.rate_per_sqm) * (1 + totalPct / 100);

  const isDirty =
    JSON.stringify(adjustments) !== JSON.stringify(comp.adjustments ?? []);

  const deltaPct =
    comp.adjusted_rate_per_sqm != null
      ? ((comp.adjusted_rate_per_sqm - comp.rate_per_sqm) /
          comp.rate_per_sqm) *
        100
      : null;

  const adjSummary = comp.adjustments?.length
    ? comp.adjustments
        .map((a) => `${a.percentage >= 0 ? "+" : ""}${a.percentage}%`)
        .join(", ")
    : null;

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
      saveAdjustments(comp.id, caseId, adjustments, redirectStep);
    });
  }

  return (
    <Fragment>
      <tr className="border-b border-zinc-50 last:border-0 align-top hover:bg-zinc-50/50 transition-colors">
        <td className="px-4 py-3.5 font-medium text-zinc-900">
          {comp.address}
        </td>
        <td className="px-4 py-3.5 text-zinc-400">{comp.transaction_type}</td>
        <td className="px-4 py-3.5 text-zinc-400 tabular-nums">
          {comp.transaction_date}
        </td>
        <td className="px-4 py-3.5 text-zinc-500 text-right tabular-nums">
          {"\u20AC"}
          {fmtCurrency(comp.rate_per_sqm)}
        </td>
        <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-zinc-900">
          {comp.adjusted_rate_per_sqm != null
            ? `\u20AC${fmtCurrency(comp.adjusted_rate_per_sqm)}`
            : "\u2014"}
        </td>
        <td className="px-4 py-3.5 text-right tabular-nums text-zinc-500">
          {deltaPct != null
            ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`
            : "\u2014"}
        </td>
        <td className="px-4 py-3.5 text-xs max-w-[140px]">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <span
              className="inline-block transition-transform text-[10px]"
              style={{
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              &#9654;
            </span>
            <span>{adjSummary ?? "Add adjustments"}</span>
          </button>
        </td>
        <td className="px-2 py-3.5 text-center w-8">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${comp.adjusted_rate_per_sqm != null ? "bg-zinc-900" : "bg-zinc-200"}`}
            title={
              comp.adjusted_rate_per_sqm != null
                ? "Adjusted"
                : "Not adjusted"
            }
          />
        </td>
        <td className="px-2 py-3.5 text-center w-8">
          <DeleteComparableButton comparableId={comp.id} caseId={caseId} redirectStep={redirectStep} />
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-zinc-50">
          <td colSpan={9} className="pb-4 pt-1 px-4">
            <div className="bg-zinc-50/80 rounded-lg p-4 space-y-3">
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
                    Adjusted: {"\u20AC"}
                    {fmtCurrency(liveAdjustedRate)}/sq m
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
          </td>
        </tr>
      )}
    </Fragment>
  );
}

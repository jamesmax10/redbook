"use client";

import { saveValuation } from "@/app/actions";
import { SEVERITY_ICON, type SectionStatus } from "./validation";

const inputClass =
  "w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent";

function fmtCurrency(v: number): string {
  return v.toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface SummaryMetrics {
  count: number;
  min: number;
  max: number;
  average: number;
}

interface Valuation {
  id: string;
  adopted_rate_per_sqm: number | null;
  adopted_rate_rationale: string | null;
}

interface Props {
  caseId: string;
  metrics: SummaryMetrics | null;
  valuation: Valuation | null;
  sectionStatus: SectionStatus;
}

export default function ValuationSection({
  caseId,
  metrics,
  valuation,
  sectionStatus,
}: Props) {
  const boundAction = saveValuation.bind(null, caseId, valuation?.id ?? null);

  return (
    <div className="mt-14">
      {/* Comparable Insights — derived output */}
      <div className="mb-10">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Comparable Insights
        </h3>

        {metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-50 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Comparables used</p>
              <p className="text-xl font-semibold text-zinc-900 tabular-nums">
                {metrics.count}
              </p>
            </div>
            <div className="bg-zinc-50 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Adjusted range</p>
              <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                &euro;{fmtCurrency(metrics.min)} &ndash; &euro;
                {fmtCurrency(metrics.max)}/sq&nbsp;m
              </p>
            </div>
            <div className="bg-zinc-50 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Average rate</p>
              <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                &euro;{fmtCurrency(metrics.average)}/sq&nbsp;m
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 italic">
            Add comparables with adjustments to see insights.
          </p>
        )}
      </div>

      {/* Adopted Rate — Decision Layer */}
      <div className="border-t border-zinc-200 pt-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-zinc-900">Adopted Rate</h2>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              sectionStatus.severity === "pass"
                ? "text-green-600"
                : sectionStatus.severity === "warning"
                  ? "text-amber-600"
                  : "text-red-500"
            }`}
          >
            <span>{SEVERITY_ICON[sectionStatus.severity]}</span>
            <span>{sectionStatus.message}</span>
          </span>
        </div>
        <p className="text-sm text-zinc-500 mb-6">
          Set the adopted rate based on your comparable analysis.
        </p>

        <form action={boundAction} className="max-w-xl">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="adopted_rate_per_sqm"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Adopted Rate per sq&nbsp;m (&euro;)
              </label>
              <input
                type="number"
                id="adopted_rate_per_sqm"
                name="adopted_rate_per_sqm"
                step="0.01"
                min="0"
                defaultValue={valuation?.adopted_rate_per_sqm ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="adopted_rate_rationale"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Rationale
              </label>
              <textarea
                id="adopted_rate_rationale"
                name="adopted_rate_rationale"
                rows={3}
                defaultValue={valuation?.adopted_rate_rationale ?? ""}
                className={inputClass}
                placeholder="Explain why this rate was adopted..."
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="bg-zinc-900 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700"
              >
                {valuation ? "Update Valuation" : "Save Valuation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

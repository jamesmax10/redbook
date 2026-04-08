"use client";

import { saveValuation } from "@/app/actions";
import { fmtCurrency } from "@/lib/format";
import {
  inputClass,
  btnPrimary,
  card,
  labelClass,
  overline,
} from "@/lib/styles";

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
  assumptions: string | null;
  limiting_conditions: string | null;
  valuer_name: string | null;
}

interface Props {
  caseId: string;
  metrics: SummaryMetrics | null;
  valuation: Valuation | null;
  saved?: boolean;
  issueCount?: number;
  nextStep?: string;
}

export default function ValuationSection({
  caseId,
  metrics,
  valuation,
  saved,
  issueCount = 0,
  nextStep,
}: Props) {
  const boundAction = saveValuation.bind(null, caseId, valuation?.id ?? null);

  return (
    <div>
      {/* Comparable Insights */}
      <div className="mb-10">
        <h3 className={`${overline} mb-4`}>Comparable Insights</h3>

        {metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`${card} px-5 py-4`}>
              <p className="text-xs text-zinc-400 mb-1">Comparables used</p>
              <p className="text-xl font-semibold text-zinc-900 tabular-nums">
                {metrics.count}
              </p>
            </div>
            <div className={`${card} px-5 py-4`}>
              <p className="text-xs text-zinc-400 mb-1">Adjusted range</p>
              <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                &euro;{fmtCurrency(metrics.min)} &ndash; &euro;
                {fmtCurrency(metrics.max)}/sq&nbsp;m
              </p>
            </div>
            <div className={`${card} px-5 py-4`}>
              <p className="text-xs text-zinc-400 mb-1">Average rate</p>
              <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                &euro;{fmtCurrency(metrics.average)}/sq&nbsp;m
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            Add comparables with adjustments to see insights.
          </p>
        )}
      </div>

      {/* Adopted Rate */}
      <div>
        <h3 className={`${overline} mb-1`}>Adopted Rate</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Set the adopted rate based on your comparable analysis.
        </p>

        {saved && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
              issueCount === 0
                ? "bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-200/60"
                : "bg-amber-50/80 text-amber-800 ring-1 ring-amber-200/60"
            }`}
          >
            {issueCount === 0
              ? "Valuation updated \u2014 ready for valuation"
              : `Valuation updated \u2014 ${issueCount} ${issueCount === 1 ? "issue" : "issues"} remaining`}
          </div>
        )}

        <form action={boundAction} className="max-w-xl">
          {nextStep && <input type="hidden" name="_step" value={nextStep} />}
          <div className="space-y-4">
            <div>
              <label htmlFor="adopted_rate_per_sqm" className={labelClass}>
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
              <label htmlFor="adopted_rate_rationale" className={labelClass}>
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

            <div>
              <label htmlFor="assumptions" className={labelClass}>
                Assumptions
              </label>
              <textarea
                id="assumptions"
                name="assumptions"
                rows={3}
                defaultValue={valuation?.assumptions ?? ""}
                className={inputClass}
                placeholder="State assumptions underpinning this valuation..."
              />
            </div>

            <div>
              <label htmlFor="limiting_conditions" className={labelClass}>
                Limiting Conditions
              </label>
              <textarea
                id="limiting_conditions"
                name="limiting_conditions"
                rows={3}
                defaultValue={valuation?.limiting_conditions ?? ""}
                className={inputClass}
                placeholder="Describe any limiting conditions..."
              />
            </div>

            <div>
              <label htmlFor="valuer_name" className={labelClass}>
                Valuer Name
              </label>
              <input
                type="text"
                id="valuer_name"
                name="valuer_name"
                defaultValue={valuation?.valuer_name ?? ""}
                className={inputClass}
                placeholder="Full name of the valuer..."
              />
            </div>

            <div className="pt-2">
              <button type="submit" className={btnPrimary}>
                {nextStep
                  ? "Save & Continue"
                  : valuation
                    ? "Update Valuation"
                    : "Save Valuation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

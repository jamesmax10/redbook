"use client";

import { useState } from "react";
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

  const [adoptedRate, setAdoptedRate] = useState<string>(
    valuation?.adopted_rate_per_sqm ? String(valuation.adopted_rate_per_sqm) : ""
  );

  const adoptedRateNum = parseFloat(adoptedRate);
  const hasValidAdoptedRate = !isNaN(adoptedRateNum) && adoptedRateNum > 0;

  const rangePosition =
    metrics && hasValidAdoptedRate && metrics.max > metrics.min
      ? Math.max(0, Math.min(100, ((adoptedRateNum - metrics.min) / (metrics.max - metrics.min)) * 100))
      : null;

  const avgPosition =
    metrics && metrics.max > metrics.min
      ? Math.max(0, Math.min(100, ((metrics.average - metrics.min) / (metrics.max - metrics.min)) * 100))
      : 50;

  const vsAverage =
    metrics && hasValidAdoptedRate && metrics.average > 0
      ? ((adoptedRateNum - metrics.average) / metrics.average) * 100
      : null;

  const impliedValue =
    metrics && hasValidAdoptedRate
      ? null
      : null;

  return (
    <div>
      {/* Comparable Insights */}
      <div className="mb-8">
        <h3 className={`${overline} mb-4`}>Comparable Evidence</h3>

        {metrics ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className={`${card} px-5 py-4`}>
                <p className="text-xs text-zinc-400 mb-1">Comparables used</p>
                <p className="text-2xl font-semibold text-zinc-900 tabular-nums">{metrics.count}</p>
              </div>
              <div className={`${card} px-5 py-4`}>
                <p className="text-xs text-zinc-400 mb-1">Adjusted range</p>
                <p className="text-sm font-semibold text-zinc-900 tabular-nums mt-1">
                  €{fmtCurrency(metrics.min)} – €{fmtCurrency(metrics.max)}/m²
                </p>
              </div>
              <div className={`${card} px-5 py-4`}>
                <p className="text-xs text-zinc-400 mb-1">Average rate</p>
                <p className="text-sm font-semibold text-zinc-900 tabular-nums mt-1">
                  €{fmtCurrency(metrics.average)}/m²
                </p>
              </div>
            </div>

            {/* Rate range bar — shows adopted rate position within evidence */}
            <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Rate Position
                </p>
                {vsAverage !== null && (
                  <span className={`text-xs font-medium tabular-nums ${
                    Math.abs(vsAverage) < 2 ? "text-emerald-600"
                      : Math.abs(vsAverage) < 10 ? "text-amber-600"
                      : "text-red-500"
                  }`}>
                    Adopted {vsAverage >= 0 ? "+" : ""}{vsAverage.toFixed(1)}% vs avg
                  </span>
                )}
              </div>

              <div className="relative mx-1">
                {/* Track */}
                <div className="h-2 bg-zinc-100 rounded-full" />

                {/* Average marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${avgPosition}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-px h-4 bg-zinc-300" />
                </div>

                {/* Adopted rate marker */}
                {rangePosition !== null && (
                  <div
                    className="absolute top-1/2 w-3.5 h-3.5 bg-zinc-900 rounded-full border-2 border-white shadow-md transition-all duration-150"
                    style={{ left: `${rangePosition}%`, transform: "translate(-50%, -50%)" }}
                  />
                )}
              </div>

              <div className="flex justify-between mt-2.5 text-[11px] text-zinc-400 tabular-nums">
                <span>€{fmtCurrency(metrics.min)}</span>
                <span className="text-zinc-400">avg €{fmtCurrency(metrics.average)}</span>
                <span>€{fmtCurrency(metrics.max)}</span>
              </div>

              {!hasValidAdoptedRate && (
                <p className="text-xs text-zinc-400 mt-2 text-center">
                  Enter an adopted rate below to see its position
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-400">Add comparables to see evidence insights.</p>
        )}
      </div>

      {/* Adopted Rate */}
      <div>
        <h3 className={`${overline} mb-1`}>Adopted Rate &amp; Rationale</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Set the adopted rate and document your professional judgment.
        </p>

        {saved && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
            issueCount === 0
              ? "bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-200/60"
              : "bg-amber-50/80 text-amber-800 ring-1 ring-amber-200/60"
          }`}>
            {issueCount === 0
              ? "Valuation saved — ready for report"
              : `Valuation saved — ${issueCount} ${issueCount === 1 ? "issue" : "issues"} remaining`}
          </div>
        )}

        <form action={boundAction} className="max-w-2xl space-y-4">
          {nextStep && <input type="hidden" name="_step" value={nextStep} />}

          {/* Adopted rate — primary decision field */}
          <div>
            <label htmlFor="adopted_rate_per_sqm" className={labelClass}>
              Adopted Rate per m² (€)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="adopted_rate_per_sqm"
                name="adopted_rate_per_sqm"
                step="0.01"
                min="0"
                value={adoptedRate}
                onChange={(e) => setAdoptedRate(e.target.value)}
                className={inputClass + " max-w-[200px]"}
              />
              {metrics && hasValidAdoptedRate && (
                <span className="text-sm text-zinc-500 tabular-nums">
                  = €{fmtCurrency(adoptedRateNum)}/m²
                </span>
              )}
            </div>
          </div>

          {/* Rationale — the analytical conclusion */}
          <div>
            <label htmlFor="adopted_rate_rationale" className={labelClass}>
              Rationale
            </label>
            <textarea
              id="adopted_rate_rationale"
              name="adopted_rate_rationale"
              rows={4}
              defaultValue={valuation?.adopted_rate_rationale ?? ""}
              className={inputClass}
              placeholder="Explain why this rate was adopted, referencing the comparable evidence..."
            />
          </div>

          {/* Valuer name — professional identity */}
          <div>
            <label htmlFor="valuer_name" className={labelClass}>
              Valuer Name
            </label>
            <input
              type="text"
              id="valuer_name"
              name="valuer_name"
              defaultValue={valuation?.valuer_name ?? ""}
              className={inputClass + " max-w-xs"}
              placeholder="Full name of the valuer"
            />
          </div>

          {/* Assumptions and Limiting Conditions — professional disclaimers */}
          <div className="border-t border-zinc-100 pt-4">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Professional Caveats
            </p>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className={btnPrimary}>
              {nextStep ? "Save & Continue" : valuation ? "Update Valuation" : "Save Valuation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fmtCurrency } from "@/lib/format";
import { inputClass, btnPrimary, labelClass } from "@/lib/styles";

interface Metrics {
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

interface CompRef {
  id: string;
  address: string;
  effectiveRate: number;
  isAdjusted: boolean;
  rawRate: number;
}

interface Props {
  caseId: string;
  metrics: Metrics | null;
  valuation: Valuation | null;
  compRefs: CompRef[];
  saveAction: (formData: FormData) => Promise<void>;
  justSaved: boolean;
}

export default function AnalysisWorkspace({ caseId, metrics, valuation, compRefs, saveAction, justSaved }: Props) {
  const [adoptedRate, setAdoptedRate] = useState(
    valuation?.adopted_rate_per_sqm ? String(valuation.adopted_rate_per_sqm) : ""
  );
  const [caveatsOpen, setCaveatsOpen] = useState(
    !!(valuation?.assumptions || valuation?.limiting_conditions)
  );

  const adoptedRateNum = parseFloat(adoptedRate);
  const hasValidRate = !isNaN(adoptedRateNum) && adoptedRateNum > 0;

  const rangePosition =
    metrics && hasValidRate && metrics.max > metrics.min
      ? Math.max(0, Math.min(100, ((adoptedRateNum - metrics.min) / (metrics.max - metrics.min)) * 100))
      : null;

  const avgPosition =
    metrics && metrics.max > metrics.min
      ? Math.max(0, Math.min(100, ((metrics.average - metrics.min) / (metrics.max - metrics.min)) * 100))
      : 50;

  const vsAverage =
    metrics && hasValidRate && metrics.average > 0
      ? ((adoptedRateNum - metrics.average) / metrics.average) * 100
      : null;

  const pathname = usePathname();
  const caseBase = pathname.replace(/\/analysis$/, "");

  return (
    <div className="px-6 py-6 grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6 items-start max-w-7xl mx-auto">

      {/* ── Left: Decision workspace ── */}
      <div>
        <div className="mb-5">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-0.5">Analysis</p>
          <h2 className="text-lg font-semibold text-zinc-900">Adopted Rate & Rationale</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Set the adopted rate and document your professional judgment.
          </p>
        </div>

        {justSaved && (
          <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-200/60 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Analysis saved
          </div>
        )}

        {/* Rate position visualization */}
        {metrics && (
          <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Rate Position</p>
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
            <div className="relative mx-1 mb-3">
              <div className="h-2 bg-zinc-100 rounded-full" />
              <div
                className="absolute top-1/2 w-px h-4 bg-zinc-300"
                style={{ left: `${avgPosition}%`, transform: "translate(-50%, -50%)" }}
              />
              {rangePosition !== null && (
                <div
                  className="absolute top-1/2 w-3.5 h-3.5 bg-zinc-900 rounded-full border-2 border-white shadow-md transition-all duration-150"
                  style={{ left: `${rangePosition}%`, transform: "translate(-50%, -50%)" }}
                />
              )}
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 tabular-nums">
              <span>€{fmtCurrency(metrics.min)}</span>
              <span>avg €{fmtCurrency(metrics.average)}</span>
              <span>€{fmtCurrency(metrics.max)}</span>
            </div>
            {!hasValidRate && (
              <p className="text-xs text-zinc-400 mt-2 text-center">Enter an adopted rate to see its position</p>
            )}
          </div>
        )}

        {!metrics && (
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-xs text-amber-700">
              Add comparable evidence before setting an adopted rate.{" "}
              <Link href={`${caseBase}/evidence`} className="underline underline-offset-2 font-medium">Go to Evidence →</Link>
            </p>
          </div>
        )}

        <form action={saveAction} className="space-y-4">
          <input type="hidden" name="_step" value="analysis" />

          {/* Primary decision field */}
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
                className={inputClass + " max-w-[200px] text-lg font-semibold"}
                placeholder="0.00"
              />
              {hasValidRate && (
                <span className="text-base font-semibold text-zinc-900 tabular-nums">
                  = €{fmtCurrency(adoptedRateNum)}/m²
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="adopted_rate_rationale" className={labelClass}>
              Rationale
            </label>
            <textarea
              id="adopted_rate_rationale"
              name="adopted_rate_rationale"
              rows={5}
              defaultValue={valuation?.adopted_rate_rationale ?? ""}
              className={inputClass}
              placeholder="Explain why this rate was adopted, referencing the comparable evidence..."
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
              className={inputClass + " max-w-xs"}
              placeholder="Full name of the valuer"
            />
          </div>

          {/* Professional caveats — collapsible */}
          <div className="border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={() => setCaveatsOpen((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider hover:text-zinc-600 transition-colors mb-3"
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform ${caveatsOpen ? "rotate-90" : ""}`}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Professional Caveats
            </button>

            {caveatsOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="assumptions" className={labelClass}>Assumptions</label>
                  <textarea
                    id="assumptions"
                    name="assumptions"
                    rows={4}
                    defaultValue={valuation?.assumptions ?? ""}
                    className={inputClass}
                    placeholder="State assumptions underpinning this valuation..."
                  />
                </div>
                <div>
                  <label htmlFor="limiting_conditions" className={labelClass}>Limiting Conditions</label>
                  <textarea
                    id="limiting_conditions"
                    name="limiting_conditions"
                    rows={4}
                    defaultValue={valuation?.limiting_conditions ?? ""}
                    className={inputClass}
                    placeholder="Describe any limiting conditions..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-1 flex items-center gap-3">
            <button type="submit" className={btnPrimary}>
              {valuation ? "Update Analysis" : "Save Analysis"}
            </button>
            {valuation?.adopted_rate_per_sqm && (
              <Link
                href={`${caseBase}/report`}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                View Draft Report →
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* ── Right: Evidence reference ── */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Evidence Reference</p>

          {metrics ? (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100">
                {[
                  { label: "Comps", value: String(metrics.count) },
                  { label: "Low", value: `€${fmtCurrency(metrics.min)}` },
                  { label: "High", value: `€${fmtCurrency(metrics.max)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-3 text-center">
                    <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-zinc-900 tabular-nums">{value}/m²</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                <p className="text-xs text-zinc-400">Average</p>
                <p className="text-base font-semibold text-zinc-900 tabular-nums">
                  €{fmtCurrency(metrics.average)}/m²
                </p>
              </div>

              {/* Comparable list */}
              <div className="divide-y divide-zinc-50">
                {compRefs.map((c, i) => (
                  <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-zinc-300 tabular-nums shrink-0">{i + 1}</span>
                      <p className="text-xs text-zinc-600 truncate">{c.address}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.isAdjusted && (
                        <span className="text-xs text-zinc-400 line-through tabular-nums">€{fmtCurrency(c.rawRate)}</span>
                      )}
                      <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                        €{fmtCurrency(c.effectiveRate)}/m²
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2.5 border-t border-zinc-100">
                <Link
                  href={`${caseBase}/evidence`}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  ← Edit comparables
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl px-4 py-8 text-center">
              <p className="text-sm text-zinc-400 mb-2">No comparable evidence yet</p>
              <Link
                href={`${caseBase}/evidence`}
                className="text-xs font-medium text-zinc-700 hover:text-zinc-900 underline underline-offset-2"
              >
                Add comparables →
              </Link>
            </div>
          )}
        </div>

        {/* Adopted rate summary if already set */}
        {valuation?.adopted_rate_per_sqm && (
          <div className="bg-zinc-900 rounded-xl px-5 py-4">
            <p className="text-xs text-zinc-400 mb-1">Current Adopted Rate</p>
            <p className="text-2xl font-bold text-white tabular-nums">
              €{fmtCurrency(valuation.adopted_rate_per_sqm)}/m²
            </p>
            {metrics && (
              <p className="text-xs text-zinc-400 mt-1">
                {valuation.adopted_rate_per_sqm < metrics.min
                  ? "Below evidence range"
                  : valuation.adopted_rate_per_sqm > metrics.max
                  ? "Above evidence range"
                  : "Within evidence range"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface Finding {
  id?: string;
  severity: "critical" | "warning" | "pass";
  category?: string;
  title: string;
  detail: string;
  standard?: string;
  evidence?: string;
  action: string;
}

interface ValidationResult {
  hardRules: {
    findings: Finding[];
    criticalCount: number;
    warningCount: number;
    passCount: number;
  };
  aiFindings: Finding[];
  summary: {
    critical: number;
    warnings: number;
    passed: number;
    aiRan: boolean;
  };
}

const severityConfig = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "✕",
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    label: "bg-red-100 text-red-700",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "⚠",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    label: "bg-amber-100 text-amber-700",
  },
  pass: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "✓",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900",
    label: "bg-emerald-100 text-emerald-700",
  },
};

export default function ValidationPanel({ caseId }: { caseId: string }) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runValidation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runValidation() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/validate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch {
      setError("Validation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const passedFindings = result?.hardRules.findings.filter(
    (f) => f.severity === "pass"
  ) ?? [];

  const failedFindings = result?.hardRules.findings.filter(
    (f) => f.severity !== "pass"
  ) ?? [];

  return (
    <div className="mt-8 border-t border-zinc-100 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Red Book Validation
          </h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            RICS Red Book Global Standards 2024
          </p>
        </div>
        <button
          onClick={runValidation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D3142] text-white text-sm font-medium rounded-lg hover:bg-[#363B52] transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Validating...
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Run Validation
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200 mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-red-600">
                {result.summary.critical}
              </p>
              <p className="text-xs text-red-700 mt-0.5">Critical</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {result.summary.warnings}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Warnings</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {result.summary.passed}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">Passed</p>
            </div>
          </div>

          {/* Overall verdict */}
          {result.summary.critical === 0 && result.summary.warnings === 0 ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3 mb-4">
              <span className="text-emerald-600 text-lg">✓</span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Valuation meets Red Book standards
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  No critical issues or warnings identified
                </p>
              </div>
            </div>
          ) : result.summary.critical > 0 ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-3 mb-4">
              <span className="text-red-600 text-lg">✕</span>
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Critical issues must be resolved
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  This valuation does not meet Red Book standards
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3 mb-4">
              <span className="text-amber-600 text-lg">⚠</span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Warnings require attention
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Review warnings before finalising
                </p>
              </div>
            </div>
          )}

          {/* Hard rule findings — failures only */}
          {failedFindings.length > 0 && (
            <>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Standards Checks
              </p>
              {failedFindings.map((f, i) => {
                const config = severityConfig[f.severity];
                return (
                  <div
                    key={i}
                    className={`rounded-xl border ${config.bg} ${config.border} px-4 py-3`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`${config.iconColor} font-bold text-sm mt-0.5 shrink-0`}>
                        {config.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${config.titleColor}`}>
                            {f.title}
                          </p>
                          {f.standard && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${config.label}`}>
                              {f.standard}
                            </span>
                          )}
                        </div>
                        {f.detail && (
                          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                            {f.detail}
                          </p>
                        )}
                        {f.evidence && (
                          <p className="text-xs text-zinc-500 mt-1 italic">
                            Evidence: {f.evidence}
                          </p>
                        )}
                        {f.action && (
                          <p className="text-xs font-medium text-zinc-700 mt-2">
                            → {f.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Passed checks (collapsed) */}
          {passedFindings.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 select-none">
                {passedFindings.length} checks passed ▸
              </summary>
              <div className="mt-2 space-y-2">
                {passedFindings.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center gap-2"
                  >
                    <span className="text-emerald-600 text-xs font-bold shrink-0">✓</span>
                    <p className="text-xs text-emerald-800">{f.title}</p>
                    {f.standard && (
                      <span className="text-xs text-emerald-500 font-mono ml-auto shrink-0">
                        {f.standard}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* AI quality review findings */}
          {result.aiFindings.length > 0 && (
            <>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-4 mb-2">
                Quality Review
              </p>
              {result.aiFindings.map((f, i) => {
                const config =
                  severityConfig[f.severity as keyof typeof severityConfig] ??
                  severityConfig.warning;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border ${config.bg} ${config.border} px-4 py-3`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`${config.iconColor} font-bold text-sm mt-0.5 shrink-0`}>
                        {config.icon}
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${config.titleColor}`}>
                          {f.title}
                        </p>
                        {f.detail && (
                          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                            {f.detail}
                          </p>
                        )}
                        {f.action && (
                          <p className="text-xs font-medium text-zinc-700 mt-2">
                            → {f.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {result.summary.aiRan && (
            <p className="text-xs text-zinc-300 text-center mt-4">
              AI quality review powered by Claude
            </p>
          )}
        </div>
      )}
    </div>
  );
}

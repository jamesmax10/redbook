"use client";

import { useState } from "react";
import Link from "next/link";

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

function SparkleIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L13.09 8.26L19 6L14.74 10.74L21 12L14.74 13.26L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.26L3 12L9.26 10.74L5 6L10.91 8.26L12 2Z" />
    </svg>
  );
}

function getFixHref(caseId: string, finding: Finding): string | null {
  if (finding.severity === "pass") return null;
  const cat = (finding.category ?? finding.title ?? "").toLowerCase();
  if (cat.includes("comparable") || cat.includes("evidence") || cat.includes("transaction")) {
    return `/cases/${caseId}/evidence`;
  }
  if (
    cat.includes("valuation") || cat.includes("rate") ||
    cat.includes("rationale") || cat.includes("assumption") ||
    cat.includes("limiting") || cat.includes("valuer") || cat.includes("conclusion")
  ) {
    return `/cases/${caseId}/analysis`;
  }
  return `/cases/${caseId}/overview`;
}

export default function ValidationPanel({ caseId }: { caseId: string }) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runValidation() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/validate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch {
      setError("Validation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const passedFindings = result?.hardRules.findings.filter((f) => f.severity === "pass") ?? [];
  const failedFindings = result?.hardRules.findings.filter((f) => f.severity !== "pass") ?? [];

  // ── Pre-run state ──
  if (!result && !loading) {
    return (
      <div>
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200 mb-4">
            {error}
          </div>
        )}
        <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/50 via-white to-indigo-50/40 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <SparkleIcon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Validation Agent</p>
              <p className="text-xs text-zinc-400">Powered by Claude · RICS Red Book 2024</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            Checks your valuation against RICS Red Book Global Standards. Identifies missing fields,
            insufficient rationale, and standards compliance issues.
          </p>
          <button
            onClick={runValidation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-600 to-indigo-600 text-white hover:from-teal-500 hover:to-indigo-500 transition-all shadow-sm active:scale-[0.98]"
          >
            <SparkleIcon size={13} />
            Run Validation Agent
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/50 via-white to-indigo-50/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white block" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Analysing valuation…</p>
            <p className="text-xs text-zinc-400">Checking against Red Book standards</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Result state ──
  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { count: result!.summary.critical, label: "Critical", bg: "bg-red-50 border-red-200", text: "text-red-600", sub: "text-red-700" },
          { count: result!.summary.warnings, label: "Warnings", bg: "bg-amber-50 border-amber-200", text: "text-amber-600", sub: "text-amber-700" },
          { count: result!.summary.passed, label: "Passed", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-600", sub: "text-emerald-700" },
        ].map(({ count, label, bg, text, sub }) => (
          <div key={label} className={`border rounded-xl px-3 py-2.5 text-center ${bg}`}>
            <p className={`text-xl font-bold tabular-nums ${text}`}>{count}</p>
            <p className={`text-xs mt-0.5 ${sub}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Overall verdict */}
      {result!.summary.critical === 0 && result!.summary.warnings === 0 ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-2.5">
          <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
          <div>
            <p className="text-sm font-semibold text-emerald-900">Meets Red Book standards</p>
            <p className="text-xs text-emerald-600 mt-0.5">No critical issues or warnings found</p>
          </div>
        </div>
      ) : result!.summary.critical > 0 ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2.5">
          <span className="text-red-600 font-bold text-sm shrink-0">✕</span>
          <div>
            <p className="text-sm font-semibold text-red-900">Critical issues must be resolved</p>
            <p className="text-xs text-red-600 mt-0.5">Valuation does not meet Red Book standards</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2.5">
          <span className="text-amber-600 font-bold text-sm shrink-0">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Warnings require attention</p>
            <p className="text-xs text-amber-600 mt-0.5">Review before finalising</p>
          </div>
        </div>
      )}

      {/* Hard rule failures */}
      {failedFindings.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Standards Checks
          </p>
          <div className="space-y-2">
            {failedFindings.map((f, i) => {
              const config = severityConfig[f.severity];
              const fixHref = getFixHref(caseId, f);
              return (
                <div key={i} className={`rounded-xl border ${config.bg} ${config.border} px-4 py-3`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`${config.iconColor} font-bold text-sm mt-0.5 shrink-0`}>
                      {config.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <p className={`text-sm font-semibold ${config.titleColor}`}>{f.title}</p>
                          {f.standard && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-mono shrink-0 ${config.label}`}>
                              {f.standard}
                            </span>
                          )}
                        </div>
                        {fixHref && (
                          <Link
                            href={fixHref}
                            className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 underline underline-offset-2 shrink-0 transition-colors"
                          >
                            Fix →
                          </Link>
                        )}
                      </div>
                      {f.detail && (
                        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{f.detail}</p>
                      )}
                      {f.evidence && (
                        <p className="text-xs text-zinc-500 mt-1 italic">Evidence: {f.evidence}</p>
                      )}
                      {f.action && (
                        <p className="text-xs font-medium text-zinc-700 mt-1.5">→ {f.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Passed checks (collapsed) */}
      {passedFindings.length > 0 && (
        <details className="mt-1">
          <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 select-none transition-colors">
            {passedFindings.length} checks passed ▸
          </summary>
          <div className="mt-2 space-y-1.5">
            {passedFindings.map((f, i) => (
              <div key={i} className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center gap-2">
                <span className="text-emerald-600 text-xs font-bold shrink-0">✓</span>
                <p className="text-xs text-emerald-800 flex-1">{f.title}</p>
                {f.standard && (
                  <span className="text-xs text-emerald-500 font-mono ml-auto shrink-0">{f.standard}</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* AI quality review */}
      {result!.aiFindings.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <SparkleIcon size={11} className="text-teal-500" />
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quality Review</p>
          </div>
          <div className="space-y-2">
            {result!.aiFindings.map((f, i) => {
              const config = severityConfig[f.severity as keyof typeof severityConfig] ?? severityConfig.warning;
              const fixHref = getFixHref(caseId, f);
              return (
                <div key={i} className={`rounded-xl border ${config.bg} ${config.border} px-4 py-3`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`${config.iconColor} font-bold text-sm mt-0.5 shrink-0`}>{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${config.titleColor}`}>{f.title}</p>
                        {fixHref && (
                          <Link
                            href={fixHref}
                            className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 underline underline-offset-2 shrink-0 transition-colors"
                          >
                            Fix →
                          </Link>
                        )}
                      </div>
                      {f.detail && (
                        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{f.detail}</p>
                      )}
                      {f.action && (
                        <p className="text-xs font-medium text-zinc-700 mt-1.5">→ {f.action}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result!.summary.aiRan && (
        <p className="text-xs text-zinc-300 text-center pt-1">AI quality review powered by Claude</p>
      )}

      {/* Re-run — compact, not prominent */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
        <button
          onClick={runValidation}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors disabled:opacity-40"
        >
          <SparkleIcon size={11} />
          Re-run Validation Agent
        </button>
        <span className="text-xs text-zinc-300">RICS Red Book 2024</span>
      </div>
    </div>
  );
}

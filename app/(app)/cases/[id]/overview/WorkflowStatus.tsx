import Link from "next/link";
import { btnPrimary } from "@/lib/styles";
import {
  SEVERITY_ICON,
  SECTION_LABELS,
  type Section,
  type ValidationResult,
} from "../validation";

interface Props {
  caseId: string;
  validation: ValidationResult;
}

export default function WorkflowStatus({ caseId, validation }: Props) {
  const isReady = validation.errorCount === 0 && validation.warningCount === 0;
  const base = `/cases/${caseId}`;

  return (
    <div>
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Workflow Readiness</p>

      {/* Status banner */}
      {isReady ? (
        <div className="mb-4 rounded-xl px-4 py-3.5 flex items-center gap-3 bg-emerald-50/80 ring-1 ring-emerald-200/60">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div>
            <p className="text-sm font-medium text-emerald-800">All steps complete</p>
            <p className="text-xs text-emerald-600 mt-0.5">Your report is ready to review.</p>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-xl px-4 py-3.5 flex items-center gap-3 bg-amber-50/80 ring-1 ring-amber-200/60">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">
              {validation.errorCount + validation.warningCount}{" "}
              {validation.errorCount + validation.warningCount === 1 ? "issue" : "issues"} remaining
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Complete each section to generate your report.</p>
          </div>
        </div>
      )}

      {/* Section checklist */}
      <div className="space-y-2 mb-4">
        {(["case", "comparables", "valuation"] as Section[]).map((section) => {
          const sectionChecks = validation.checks.filter((c) => c.section === section);
          const sectionHref =
            section === "comparables"
              ? `${base}/evidence`
              : section === "valuation"
              ? `${base}/analysis`
              : null;

          return (
            <div key={section} className="bg-white border border-zinc-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">
                    {SECTION_LABELS[section]}
                  </span>
                  {sectionHref && (
                    <Link
                      href={sectionHref}
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      →
                    </Link>
                  )}
                </div>
                <span>{SEVERITY_ICON[validation.sections[section].severity]}</span>
              </div>
              <ul className="space-y-1">
                {sectionChecks.map((check) => {
                  const color =
                    check.severity === "pass"
                      ? "text-emerald-600"
                      : check.severity === "warning"
                        ? "text-amber-600"
                        : "text-red-500";
                  return (
                    <li key={check.message} className={`text-xs ${color} flex items-center gap-1.5`}>
                      <span>{check.message}</span>
                      {check.severity !== "pass" && check.fixHref && (
                        <Link
                          href={check.fixHref}
                          className="underline underline-offset-2 shrink-0 hover:opacity-70 transition-opacity"
                        >
                          Fix →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="space-y-2">
        {!isReady ? (
          <>
            <Link
              href={`${base}/evidence`}
              className="flex items-center justify-between w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 hover:border-zinc-300 hover:shadow-sm transition-all group"
            >
              <span className="text-sm font-medium text-zinc-900">Evidence</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-zinc-700 transition-colors">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            <Link
              href={`${base}/analysis`}
              className="flex items-center justify-between w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 hover:border-zinc-300 hover:shadow-sm transition-all group"
            >
              <span className="text-sm font-medium text-zinc-900">Analysis</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-zinc-700 transition-colors">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </>
        ) : null}
        <Link
          href={`${base}/report`}
          className={`${btnPrimary} w-full justify-center`}
        >
          View Draft Report
        </Link>
      </div>
    </div>
  );
}

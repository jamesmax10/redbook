import Link from "next/link";
import { STATUS_BADGE, type CaseStatus } from "@/lib/caseStatus";

interface Props {
  caseId: string;
  clientName: string;
  propertyAddress: string;
  purpose: string | null;
  basisOfValue: string | null;
  valuationDate: string | null;
  status: CaseStatus;
  issueCount: number;
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CaseHeader({
  clientName,
  propertyAddress,
  purpose,
  basisOfValue,
  valuationDate,
  status,
  issueCount,
}: Props) {
  const badge = STATUS_BADGE[status];

  return (
    <div className="px-6 pt-5 pb-4 bg-white border-b border-zinc-100">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors mb-3"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All Cases
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold text-zinc-900 leading-tight tracking-tight truncate">
            {clientName}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5 truncate">{propertyAddress}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {issueCount > 0 && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200/60">
              {issueCount} {issueCount === 1 ? "issue" : "issues"}
            </span>
          )}
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {(purpose || basisOfValue || valuationDate) && (
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {purpose && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600">
              {purpose}
            </span>
          )}
          {basisOfValue && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600">
              {basisOfValue}
            </span>
          )}
          {valuationDate && (
            <span className="text-xs text-zinc-400 tabular-nums">
              {fmtDate(valuationDate)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  btnPrimary,
} from "@/lib/styles";
import {
  deriveCaseStatus,
  deriveStepCompletion,
  STATUS_BADGE,
  type CaseStatus,
  type CaseStatusInput,
} from "@/lib/caseStatus";

export const dynamic = "force-dynamic";

const STATUS_PRIORITY: Record<CaseStatus, number> = {
  incomplete: 0,
  in_progress: 1,
  ready: 2,
};

const FILTERABLE_STATUSES: CaseStatus[] = [
  "ready",
  "in_progress",
  "incomplete",
];

function firstOrSelf<T>(val: T | T[] | null | undefined): T | null {
  if (val == null) return null;
  return Array.isArray(val) ? val[0] ?? null : val;
}

function countRelated(val: unknown): number {
  return Array.isArray(val) ? val.length : val ? 1 : 0;
}

interface CaseRow {
  id: string;
  client_name: string;
  property_address: string;
  valuation_date: string;
  purpose: string;
  basis_of_value: string;
  created_at: string;
  properties: Record<string, unknown>[] | Record<string, unknown> | null;
  comparables: Record<string, unknown>[] | Record<string, unknown> | null;
  valuations: Record<string, unknown>[] | Record<string, unknown> | null;
}

function statusInputFromCase(c: CaseRow): CaseStatusInput {
  return {
    caseFields: c,
    property: firstOrSelf(c.properties) as {
      property_type: unknown;
      gross_internal_area: unknown;
      condition: unknown;
      tenure: unknown;
    } | null,
    comparableCount: countRelated(c.comparables),
    valuation: firstOrSelf(c.valuations) as {
      adopted_rate_per_sqm: number | null;
      adopted_rate_rationale: string | null;
    } | null,
  };
}

function parseStatusFilter(
  raw: string | string[] | undefined
): CaseStatus | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return FILTERABLE_STATUSES.includes(v as CaseStatus) ? (v as CaseStatus) : null;
}

function fmtShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface NextAction {
  label: string;
  href: string;
  completedCount: number;
  done: boolean;
}

function getNextAction(caseId: string, completedSteps: Set<number>): NextAction {
  const completedCount = [1, 2, 3, 4].filter((n) => completedSteps.has(n)).length;
  if (!completedSteps.has(1)) return { label: "Add details", href: `/cases/${caseId}/overview`, completedCount, done: false };
  if (!completedSteps.has(2)) return { label: "Add property", href: `/cases/${caseId}/overview`, completedCount, done: false };
  if (!completedSteps.has(3)) return { label: "Add comparables", href: `/cases/${caseId}/evidence`, completedCount, done: false };
  if (!completedSteps.has(4)) return { label: "Set valuation", href: `/cases/${caseId}/analysis`, completedCount, done: false };
  return { label: "Review draft", href: `/cases/${caseId}/report`, completedCount, done: true };
}

const STATUS_DOT: Record<CaseStatus, string> = {
  incomplete: "bg-amber-400",
  in_progress: "bg-blue-400",
  ready: "bg-emerald-400",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const firstName =
    (user.user_metadata?.first_name as string) ||
    user.email?.split("@")[0] ||
    "Your";

  const sp = await searchParams;
  const activeFilter = parseStatusFilter(sp.status);

  const { data: rawCases, error } = await supabase
    .from("cases")
    .select(
      `
      *,
      properties(id, property_type, gross_internal_area, condition, tenure),
      comparables(id),
      valuations(id, adopted_rate_per_sqm, adopted_rate_rationale)
    `
    )
    .order("created_at", { ascending: false });

  const cases = ((rawCases as CaseRow[] | null) ?? [])
    .map((c) => {
      const statusInput = statusInputFromCase(c);
      return {
        ...c,
        status: deriveCaseStatus(statusInput),
        completedSteps: deriveStepCompletion(statusInput),
      };
    })
    .sort((a, b) => {
      const pri = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      if (pri !== 0) return pri;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  const filteredCases = activeFilter
    ? cases.filter((c) => c.status === activeFilter)
    : cases;

  const counts = {
    total: cases.length,
    ready: cases.filter((c) => c.status === "ready").length,
    in_progress: cases.filter((c) => c.status === "in_progress").length,
    incomplete: cases.filter((c) => c.status === "incomplete").length,
  };

  const grouped: Record<CaseStatus, typeof filteredCases> = {
    incomplete: filteredCases.filter((c) => c.status === "incomplete"),
    in_progress: filteredCases.filter((c) => c.status === "in_progress"),
    ready: filteredCases.filter((c) => c.status === "ready"),
  };

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            {firstName}&apos;s Valuations
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {new Date().toLocaleDateString("en-IE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link href="/cases/new" className={btnPrimary}>
          + New Case
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          Failed to load cases: {error.message}
        </div>
      )}

      {/* Metric strip */}
      {counts.total > 0 && (
        <div className="flex items-center gap-1 mb-6 bg-white border border-zinc-200 rounded-xl px-1 py-1 w-fit">
          {[
            { href: "/", label: "All", count: counts.total, active: activeFilter === null },
            { href: activeFilter === "ready" ? "/" : "/?status=ready", label: "Ready", count: counts.ready, active: activeFilter === "ready" },
            { href: activeFilter === "in_progress" ? "/" : "/?status=in_progress", label: "In Progress", count: counts.in_progress, active: activeFilter === "in_progress" },
            { href: activeFilter === "incomplete" ? "/" : "/?status=incomplete", label: "Incomplete", count: counts.incomplete, active: activeFilter === "incomplete" },
          ].map(({ href, label, count, active }) => (
            <Link
              key={label}
              href={href}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              {label}
              <span className={`text-xs tabular-nums ${active ? "text-zinc-300" : "text-zinc-400"}`}>
                {count}
              </span>
            </Link>
          ))}
        </div>
      )}

      {cases.length === 0 && !error && (
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl text-center py-20">
          <p className="text-zinc-400 text-sm mb-4">No valuations yet.</p>
          <Link href="/cases/new" className={btnPrimary}>
            Create your first valuation
          </Link>
        </div>
      )}

      {cases.length > 0 && filteredCases.length === 0 && (
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl text-center py-12 px-6">
          <p className="text-zinc-500 text-sm mb-3">No cases match this filter.</p>
          <Link href="/" className="text-sm font-medium text-zinc-900 hover:text-zinc-600 underline underline-offset-2">
            Show all
          </Link>
        </div>
      )}

      {cases.length > 0 && filteredCases.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Address</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">Purpose</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Next Action</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredCases.map((c) => {
                const badge = STATUS_BADGE[c.status];
                const dot = STATUS_DOT[c.status];
                const nextAction = getNextAction(c.id, c.completedSteps);
                return (
                  <tr key={c.id} className="hover:bg-zinc-50/60 transition-colors group cursor-pointer">
                    <td className="px-5 py-3.5">
                      <Link href={`/cases/${c.id}/overview`} className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                        <span className="font-medium text-zinc-900 truncate group-hover:text-zinc-700 transition-colors">
                          {c.client_name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/cases/${c.id}/overview`} className="block text-zinc-500 truncate max-w-[220px]">
                        {c.property_address}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <Link href={`/cases/${c.id}/overview`} className="block">
                        {c.purpose ? (
                          <span className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">
                            {c.purpose}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <Link href={`/cases/${c.id}/overview`} className="block text-zinc-400 tabular-nums text-xs">
                        {c.valuation_date ? fmtShortDate(c.valuation_date) : "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/cases/${c.id}/overview`} className="block">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={nextAction.href} className="block">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          nextAction.done
                            ? "bg-zinc-50 text-zinc-500 border border-zinc-200 group-hover:border-zinc-300 group-hover:text-zinc-700"
                            : "bg-zinc-900 text-white group-hover:bg-zinc-700"
                        }`}>
                          {nextAction.label}
                        </span>
                        {!nextAction.done && (
                          <span className="mt-1 block text-[11px] text-zinc-400 tabular-nums">
                            {nextAction.completedCount} of 4 complete
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/cases/${c.id}/overview`}
                        className="text-zinc-300 group-hover:text-zinc-500 transition-colors"
                        aria-label="Open case"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

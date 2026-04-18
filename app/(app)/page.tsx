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

function StepProgressDots({ completedSteps }: { completedSteps: Set<number> }) {
  const total = 5;
  const done = completedSteps.size;
  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`${done} of ${total} workflow steps complete`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`size-2 shrink-0 rounded-full ${
            completedSteps.has(n)
              ? "bg-emerald-500"
              : "bg-zinc-100 ring-1 ring-zinc-300/80"
          }`}
        />
      ))}
    </div>
  );
}

function getActionPrompt(completedSteps: Set<number>): string {
  if (!completedSteps.has(2)) return "Add subject property";
  if (!completedSteps.has(3)) return "Add comparables";
  if (!completedSteps.has(4)) return "Set adopted rate";
  if (completedSteps.size === 5) return "Report ready to export";
  return "Continue workflow";
}

const SECTION_CONFIG: {
  key: "incomplete" | "in_progress" | "ready";
  label: string;
}[] = [
  { key: "incomplete", label: "NEEDS ATTENTION" },
  { key: "in_progress", label: "IN PROGRESS" },
  { key: "ready", label: "READY" },
];

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
    <div className="relative">
      {/* Watermark */}
      <div className="fixed bottom-8 right-8 pointer-events-none select-none z-0">
        <img
          src="/logo.png"
          alt=""
          className="w-64 opacity-[0.04] grayscale"
        />
      </div>

      <div className="relative z-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            {firstName}&apos;s Valuations
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {counts.total} cases ·{" "}
            {new Date().toLocaleDateString("en-IE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link href="/cases/new" className={btnPrimary}>
          New Valuation
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          Failed to load cases: {error.message}
        </div>
      )}

      {/* Metric strip */}
      {counts.total > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Link
            href="/"
            className={`bg-white border border-zinc-200 rounded-xl px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition-all ${activeFilter === null ? "ring-2 ring-zinc-900/10" : "opacity-80 hover:opacity-100"}`}
          >
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-semibold text-zinc-900 tabular-nums">{counts.total}</p>
          </Link>
          <Link
            href={activeFilter === "ready" ? "/" : "/?status=ready"}
            className={`bg-white border border-zinc-200 rounded-xl px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition-all ${activeFilter === "ready" ? "ring-2 ring-emerald-500/20" : "opacity-80 hover:opacity-100"}`}
          >
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Ready</p>
            <p className="text-3xl font-semibold text-emerald-600 tabular-nums">{counts.ready}</p>
          </Link>
          <Link
            href={activeFilter === "in_progress" ? "/" : "/?status=in_progress"}
            className={`bg-white border border-zinc-200 rounded-xl px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition-all ${activeFilter === "in_progress" ? "ring-2 ring-blue-500/20" : "opacity-80 hover:opacity-100"}`}
          >
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">In Progress</p>
            <p className="text-3xl font-semibold text-blue-600 tabular-nums">{counts.in_progress}</p>
          </Link>
          <Link
            href={activeFilter === "incomplete" ? "/" : "/?status=incomplete"}
            className={`bg-white border border-zinc-200 rounded-xl px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition-all ${activeFilter === "incomplete" ? "ring-2 ring-amber-500/20" : "opacity-80 hover:opacity-100"}`}
          >
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Incomplete</p>
            <p className="text-3xl font-semibold text-amber-600 tabular-nums">{counts.incomplete}</p>
          </Link>
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
          <p className="text-zinc-500 text-sm mb-3">
            No cases match this filter.
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-900 hover:text-zinc-600 underline underline-offset-2"
          >
            Show all cases
          </Link>
        </div>
      )}

      {cases.length > 0 && filteredCases.length > 0 && (
        <div>
          {SECTION_CONFIG.map(({ key, label }, sectionIdx) => {
            const group = grouped[key];
            if (group.length === 0) return null;
            return (
              <div key={key}>
                <div className={`flex items-center gap-3 mb-3 ${sectionIdx > 0 ? "mt-6" : ""}`}>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    {label}
                  </span>
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span className="text-xs text-zinc-400">{group.length}</span>
                </div>
                <div>
                  {group.map((c) => {
                    const badge = STATUS_BADGE[c.status];
                    const actionPrompt = getActionPrompt(c.completedSteps);
                    return (
                      <Link
                        key={c.id}
                        href={`/cases/${c.id}`}
                        className="block group"
                      >
                        <div
                          className={`bg-white border border-zinc-200 rounded-xl px-5 py-4 mb-2 hover:border-zinc-300 hover:shadow-sm transition-all ${
                            c.status === "ready"
                              ? "border-l-4 border-l-emerald-400"
                              : c.status === "in_progress"
                              ? "border-l-4 border-l-blue-400"
                              : "border-l-4 border-l-amber-400"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-900 text-[15px] group-hover:text-zinc-700 transition-colors truncate">
                                {c.client_name}
                              </p>
                              <p className="text-sm text-zinc-500 mt-0.5 truncate">
                                {c.property_address}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <StepProgressDots completedSteps={c.completedSteps} />
                            <span className="text-xs text-zinc-400">
                              {actionPrompt}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

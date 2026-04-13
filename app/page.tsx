import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  btnPrimary,
  card,
  pageTitle,
  thClass,
  tdBase,
  trHover,
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

// Supabase returns arrays for one-to-many but single objects for one-to-one
// (detected via UNIQUE constraint on the FK). This helper handles both shapes.
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
  // one-to-many (no unique constraint) → array
  properties: Record<string, unknown>[] | Record<string, unknown> | null;
  comparables: Record<string, unknown>[] | Record<string, unknown> | null;
  // one-to-one (unique constraint on case_id) → single object
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] | undefined }>;
}) {
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className={pageTitle}>Valuations</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage and track valuation cases
          </p>
        </div>
        <Link href="/cases/new" className={btnPrimary}>
          New Valuation
        </Link>
      </div>

      {/* Metrics */}
      {counts.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Cases"
            value={counts.total}
            href="/"
            isActive={activeFilter === null}
          />
          <MetricCard
            label="Ready"
            value={counts.ready}
            color="emerald"
            href={activeFilter === "ready" ? "/" : "/?status=ready"}
            isActive={activeFilter === "ready"}
          />
          <MetricCard
            label="In Progress"
            value={counts.in_progress}
            color="blue"
            href={
              activeFilter === "in_progress" ? "/" : "/?status=in_progress"
            }
            isActive={activeFilter === "in_progress"}
          />
          <MetricCard
            label="Incomplete"
            value={counts.incomplete}
            color="amber"
            href={
              activeFilter === "incomplete" ? "/" : "/?status=incomplete"
            }
            isActive={activeFilter === "incomplete"}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50/80 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 ring-1 ring-red-200/60">
          Failed to load cases: {error.message}
        </div>
      )}

      {cases.length === 0 && !error && (
        <div className={`${card} text-center py-20`}>
          <p className="text-zinc-400 mb-4">No valuations yet.</p>
          <Link href="/cases/new" className={btnPrimary}>
            Create your first valuation
          </Link>
        </div>
      )}

      {cases.length > 0 && filteredCases.length === 0 && (
        <div className={`${card} text-center py-12 px-6`}>
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
        <div className={`${card} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className={`text-left px-5 py-3 ${thClass}`}>Client</th>
                <th className={`text-left px-5 py-3 ${thClass}`}>
                  Property Address
                </th>
                <th className={`text-left px-5 py-3 ${thClass}`}>Status</th>
                <th className={`text-left px-5 py-3 ${thClass}`}>
                  Valuation Date
                </th>
                <th className={`text-left px-5 py-3 ${thClass}`}>Purpose</th>
                <th className={`text-left px-5 py-3 ${thClass}`}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => {
                const badge = STATUS_BADGE[c.status];
                const incompleteFirstCell =
                  c.status === "incomplete"
                    ? "border-l-2 border-l-amber-400/65"
                    : "";
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-zinc-50 last:border-0 ${trHover}`}
                  >
                    <td className={`${tdBase} ${incompleteFirstCell}`}>
                      <Link
                        href={`/cases/${c.id}`}
                        className="text-zinc-900 font-medium hover:text-zinc-600 transition-colors"
                      >
                        {c.client_name}
                      </Link>
                    </td>
                    <td className={`${tdBase} text-zinc-500`}>
                      {c.property_address}
                    </td>
                    <td className={tdBase}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className={`${tdBase} text-zinc-500 tabular-nums`}>
                      {c.valuation_date}
                    </td>
                    <td className={`${tdBase} text-zinc-500`}>{c.purpose}</td>
                    <td className={tdBase}>
                      <StepProgressDots completedSteps={c.completedSteps} />
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

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  color,
  href,
  isActive,
}: {
  label: string;
  value: number;
  color?: "emerald" | "blue" | "amber";
  href: string;
  isActive?: boolean;
}) {
  const valueColor = color
    ? ({
        emerald: "text-emerald-600",
        blue: "text-blue-600",
        amber: "text-amber-600",
      })[color]
    : "text-zinc-900";

  return (
    <Link
      href={href}
      className={`block rounded-xl transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
        isActive ? "ring-2 ring-zinc-900/15 shadow-sm" : "hover:shadow-md"
      }`}
    >
      <div className={`${card} px-5 py-4 h-full`}>
        <p className="text-xs text-zinc-400 mb-1">{label}</p>
        <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>
          {value}
        </p>
      </div>
    </Link>
  );
}

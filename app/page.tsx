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
import { deriveCaseStatus, STATUS_BADGE } from "@/lib/caseStatus";

export const dynamic = "force-dynamic";

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
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

  const cases = ((rawCases as CaseRow[] | null) ?? []).map((c) => ({
    ...c,
    status: deriveCaseStatus({
      caseFields: c,
      property: firstOrSelf(c.properties) as { property_type: unknown; gross_internal_area: unknown; condition: unknown; tenure: unknown } | null,
      comparableCount: countRelated(c.comparables),
      valuation: firstOrSelf(c.valuations) as { adopted_rate_per_sqm: number | null; adopted_rate_rationale: string | null } | null,
    }),
  }));

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
          <MetricCard label="Total Cases" value={counts.total} />
          <MetricCard label="Ready" value={counts.ready} color="emerald" />
          <MetricCard
            label="In Progress"
            value={counts.in_progress}
            color="blue"
          />
          <MetricCard
            label="Incomplete"
            value={counts.incomplete}
            color="amber"
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

      {cases.length > 0 && (
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
                <th className={`text-left px-5 py-3 ${thClass}`}>Created</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const badge = STATUS_BADGE[c.status];
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-zinc-50 last:border-0 ${trHover}`}
                  >
                    <td className={tdBase}>
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
                    <td className={`${tdBase} text-zinc-400 tabular-nums`}>
                      {new Date(c.created_at).toLocaleDateString()}
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
}: {
  label: string;
  value: number;
  color?: "emerald" | "blue" | "amber";
}) {
  const valueColor = color
    ? ({
        emerald: "text-emerald-600",
        blue: "text-blue-600",
        amber: "text-amber-600",
      })[color]
    : "text-zinc-900";

  return (
    <div className={`${card} px-5 py-4`}>
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

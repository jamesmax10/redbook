import { createClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import { addComparable } from "@/app/actions";
import type { Adjustment } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";
import ComparableForm from "../ComparableForm";
import EvidenceTable from "./EvidenceTable";

export const dynamic = "force-dynamic";

export interface ComparableRecord {
  id: string;
  address: string;
  transaction_type: string;
  transaction_date: string;
  price_or_rent: number;
  gross_internal_area: number;
  rate_per_sqm: number;
  adjustments: Adjustment[] | null;
  adjusted_rate_per_sqm: number | null;
}

function fmtShortDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IE", {
    month: "short",
    year: "numeric",
  });
}

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("id, property_address")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (caseError || !caseData) notFound();

  const { data: rawComparables } = await supabase
    .from("comparables")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: true });

  const comparables: ComparableRecord[] = (rawComparables ?? []).map((c) => ({
    id: c.id,
    address: c.address,
    transaction_type: c.transaction_type,
    transaction_date: c.transaction_date,
    price_or_rent: Number(c.price_or_rent),
    gross_internal_area: Number(c.gross_internal_area),
    rate_per_sqm: Number(c.rate_per_sqm),
    adjustments: c.adjustments ?? null,
    adjusted_rate_per_sqm: c.adjusted_rate_per_sqm != null ? Number(c.adjusted_rate_per_sqm) : null,
  }));

  const effectiveRates = comparables.map(
    (c) => c.adjusted_rate_per_sqm ?? c.rate_per_sqm
  );

  const stats =
    effectiveRates.length > 0
      ? {
          count: effectiveRates.length,
          min: Math.min(...effectiveRates),
          max: Math.max(...effectiveRates),
          avg: effectiveRates.reduce((a, b) => a + b, 0) / effectiveRates.length,
        }
      : null;

  const addComparableForCase = addComparable.bind(null, id);

  return (
    <div className="flex flex-col">
      {/* Stats bar */}
      <div className="bg-white border-b border-zinc-100 px-6 py-3.5 flex items-center justify-between gap-4">
        {stats ? (
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Comparables</span>
              <span className="text-sm font-semibold text-zinc-900 tabular-nums">{stats.count}</span>
            </div>
            <div className="w-px h-4 bg-zinc-200" />
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-zinc-400">Low </span>
                <span className="text-sm font-medium text-zinc-700 tabular-nums">€{fmtCurrency(stats.min)}/m²</span>
              </div>
              <div>
                <span className="text-xs text-zinc-400">Avg </span>
                <span className="text-sm font-semibold text-zinc-900 tabular-nums">€{fmtCurrency(stats.avg)}/m²</span>
              </div>
              <div>
                <span className="text-xs text-zinc-400">High </span>
                <span className="text-sm font-medium text-zinc-700 tabular-nums">€{fmtCurrency(stats.max)}/m²</span>
              </div>
            </div>
            {stats.count >= 2 && (
              <>
                <div className="w-px h-4 bg-zinc-200 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2">
                  <div className="relative w-40 h-1.5 bg-zinc-100 rounded-full overflow-visible">
                    <div className="h-full bg-zinc-300 rounded-full" style={{ width: "100%" }} />
                    <div
                      className="absolute top-1/2 w-2.5 h-2.5 bg-zinc-500 rounded-full border-2 border-white shadow-sm -translate-y-1/2"
                      style={{
                        left: `${((stats.avg - stats.min) / (stats.max - stats.min)) * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400">range</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Comparable Evidence</span>
            <span className="text-xs text-zinc-300">— no data yet</span>
          </div>
        )}
      </div>

      {/* Main workspace */}
      <EvidenceTable
        caseId={id}
        comparables={comparables}
        addComparableAction={addComparableForCase}
        existingComparables={comparables.map((c) => ({
          address: c.address,
          price_or_rent: c.price_or_rent,
          gross_internal_area: c.gross_internal_area,
        }))}
      />
    </div>
  );
}

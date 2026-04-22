import { createClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import { saveValuation } from "@/app/actions";
import { fmtCurrency } from "@/lib/format";
import AnalysisWorkspace from "./AnalysisWorkspace";

export const dynamic = "force-dynamic";

function fmtShortDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IE", {
    month: "short",
    year: "numeric",
  });
}

export default async function AnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (caseError || !caseData) notFound();

  const [{ data: comparables }, { data: valuation }] = await Promise.all([
    supabase
      .from("comparables")
      .select("id, address, adjusted_rate_per_sqm, rate_per_sqm")
      .eq("case_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("valuations").select("*").eq("case_id", id).maybeSingle(),
  ]);

  const effectiveRates = (comparables ?? []).map(
    (c: { adjusted_rate_per_sqm: number | null; rate_per_sqm: number }) =>
      Number(c.adjusted_rate_per_sqm ?? c.rate_per_sqm)
  );

  const metrics =
    effectiveRates.length > 0
      ? {
          count: effectiveRates.length,
          min: Math.min(...effectiveRates),
          max: Math.max(...effectiveRates),
          average: effectiveRates.reduce((a: number, b: number) => a + b, 0) / effectiveRates.length,
        }
      : null;

  const compRefs = (comparables ?? []).map((c: {
    id: string;
    address: string;
    adjusted_rate_per_sqm: number | null;
    rate_per_sqm: number;
  }) => ({
    id: c.id,
    address: c.address,
    effectiveRate: Number(c.adjusted_rate_per_sqm ?? c.rate_per_sqm),
    isAdjusted: c.adjusted_rate_per_sqm != null && c.adjusted_rate_per_sqm !== c.rate_per_sqm,
    rawRate: Number(c.rate_per_sqm),
  }));

  const saveValuationForCase = saveValuation.bind(null, id, valuation?.id ?? null);
  const justSaved = sp.saved === "valuation";

  return (
    <AnalysisWorkspace
      caseId={id}
      metrics={metrics}
      valuation={valuation ?? null}
      compRefs={compRefs}
      saveAction={saveValuationForCase}
      justSaved={justSaved}
    />
  );
}

import { createClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import CaseHeader from "./CaseHeader";
import CaseTabNav from "./CaseTabNav";
import { deriveCaseStatus, deriveStepCompletion } from "@/lib/caseStatus";
import { runValidation } from "./validation";

export const dynamic = "force-dynamic";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: caseData } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!caseData) notFound();

  const [{ data: property }, { data: comparables }, { data: valuation }] =
    await Promise.all([
      supabase.from("properties").select("*").eq("case_id", id).maybeSingle(),
      supabase.from("comparables").select("id, adjusted_rate_per_sqm, rate_per_sqm").eq("case_id", id),
      supabase.from("valuations").select("*").eq("case_id", id).maybeSingle(),
    ]);

  const validation = runValidation(id, caseData, comparables ?? [], valuation ?? null);
  const issueCount = validation.errorCount + validation.warningCount;

  const statusInput = {
    caseFields: caseData,
    property: property ?? null,
    comparableCount: comparables?.length ?? 0,
    valuation: valuation ?? null,
  };
  const status = deriveCaseStatus(statusInput);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/30">
      {/* Workspace chrome: header + tab strip */}
      <div className="bg-white border-b border-zinc-200 sticky top-11 z-10">
        <CaseHeader
          caseId={id}
          clientName={caseData.client_name}
          propertyAddress={caseData.property_address}
          purpose={caseData.purpose ?? null}
          basisOfValue={caseData.basis_of_value ?? null}
          valuationDate={caseData.valuation_date ?? null}
          status={status}
          issueCount={issueCount}
        />
        <CaseTabNav caseId={id} />
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

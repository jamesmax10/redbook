import { createClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import { updateCase, saveProperty } from "@/app/actions";
import { runValidation } from "../validation";
import { deriveStepCompletion } from "@/lib/caseStatus";
import Link from "next/link";
import CaseDetailsSection from "./CaseDetailsSection";
import PropertySection from "./PropertySection";
import WorkflowStatus from "./WorkflowStatus";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
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
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (caseError || !caseData) notFound();

  const [{ data: property }, { data: comparables }, { data: valuation }] =
    await Promise.all([
      supabase.from("properties").select("*").eq("case_id", id).maybeSingle(),
      supabase.from("comparables").select("*").eq("case_id", id),
      supabase.from("valuations").select("*").eq("case_id", id).maybeSingle(),
    ]);

  const validation = runValidation(id, caseData, comparables ?? [], valuation ?? null);
  const completedSteps = deriveStepCompletion({
    caseFields: caseData,
    property: property ?? null,
    comparableCount: comparables?.length ?? 0,
    valuation: valuation ?? null,
  });

  const updateCaseWithId = updateCase.bind(null, id);
  const savePropertyForCase = saveProperty.bind(null, id, property?.id ?? null);

  return (
    <div className="px-6 py-6 grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6 items-start max-w-7xl mx-auto">
      {/* Left: case + property details */}
      <div className="space-y-4">
        <CaseDetailsSection
          caseData={{
            client_name: caseData.client_name ?? "",
            property_address: caseData.property_address ?? "",
            valuation_date: caseData.valuation_date ?? "",
            purpose: caseData.purpose ?? "",
            basis_of_value: caseData.basis_of_value ?? "",
          }}
          action={updateCaseWithId}
        />
        <PropertySection
          property={
            property
              ? {
                  address: property.address ?? "",
                  property_type: property.property_type ?? "",
                  condition: property.condition ?? "",
                  gross_internal_area: Number(property.gross_internal_area) ?? 0,
                  tenure: property.tenure ?? "",
                }
              : null
          }
          action={savePropertyForCase}
          defaultAddress={caseData.property_address ?? ""}
        />
      </div>

      {/* Right: workflow readiness */}
      <div className="space-y-4">
        <WorkflowStatus caseId={id} validation={validation} />
      </div>
    </div>
  );
}

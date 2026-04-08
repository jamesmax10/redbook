import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateReportDocx, type ReportData } from "@/lib/generateReportDocx";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (caseError || !caseData) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("*")
    .eq("case_id", id)
    .maybeSingle();

  if (propError) {
    return NextResponse.json({ error: propError.message }, { status: 500 });
  }

  const { data: comparables } = await supabase
    .from("comparables")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: false });

  const { data: valuation, error: valError } = await supabase
    .from("valuations")
    .select("*")
    .eq("case_id", id)
    .maybeSingle();

  if (valError) {
    return NextResponse.json({ error: valError.message }, { status: 500 });
  }

  const reportData: ReportData = {
    reportDate: new Date().toISOString(),
    caseData: {
      id: caseData.id,
      property_address: caseData.property_address,
      client_name: caseData.client_name,
      valuation_date: caseData.valuation_date,
      purpose: caseData.purpose,
      basis_of_value: caseData.basis_of_value,
    },
    property: property
      ? {
          address: property.address,
          property_type: property.property_type,
          gross_internal_area: property.gross_internal_area,
          condition: property.condition,
          tenure: property.tenure,
        }
      : null,
    comparables: (comparables ?? []).map((c: Record<string, unknown>) => ({
      address: c.address as string,
      price_or_rent: c.price_or_rent as number,
      gross_internal_area: c.gross_internal_area as number,
      rate_per_sqm: c.rate_per_sqm as number,
      adjustments: c.adjustments as ReportData["comparables"][number]["adjustments"],
      adjusted_rate_per_sqm: c.adjusted_rate_per_sqm as number | null,
    })),
    valuation: valuation
      ? {
          adopted_rate_per_sqm: valuation.adopted_rate_per_sqm,
          adopted_rate_rationale: valuation.adopted_rate_rationale,
          assumptions: valuation.assumptions,
          limiting_conditions: valuation.limiting_conditions,
          valuer_name: valuation.valuer_name,
        }
      : null,
  };

  const buffer = await generateReportDocx(reportData);
  const filename = `valuation-report-${id}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

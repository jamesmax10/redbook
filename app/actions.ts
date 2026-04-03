"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function createCase(formData: FormData) {
  const { data, error } = await supabase
    .from("cases")
    .insert({
      client_name: formData.get("client_name") as string,
      property_address: formData.get("property_address") as string,
      valuation_date: formData.get("valuation_date") as string,
      purpose: formData.get("purpose") as string,
      basis_of_value: formData.get("basis_of_value") as string,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/cases/${data.id}`);
}

export async function updateCase(caseId: string, formData: FormData) {
  const { error } = await supabase
    .from("cases")
    .update({
      client_name: formData.get("client_name") as string,
      property_address: formData.get("property_address") as string,
      valuation_date: formData.get("valuation_date") as string,
      purpose: formData.get("purpose") as string,
      basis_of_value: formData.get("basis_of_value") as string,
    })
    .eq("id", caseId);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/cases/${caseId}`);
}

export async function saveProperty(
  caseId: string,
  propertyId: string | null,
  formData: FormData
) {
  const row = {
    case_id: caseId,
    address: formData.get("address") as string,
    property_type: formData.get("property_type") as string,
    gross_internal_area: parseFloat(
      formData.get("gross_internal_area") as string
    ),
    condition: formData.get("condition") as string,
    tenure: formData.get("tenure") as string,
  };

  if (propertyId) {
    const { error } = await supabase
      .from("properties")
      .update(row)
      .eq("id", propertyId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("properties").insert(row);
    if (error) throw new Error(error.message);
  }

  redirect(`/cases/${caseId}`);
}

export async function addComparable(caseId: string, formData: FormData) {
  const priceOrRent = parseFloat(formData.get("price_or_rent") as string);
  const grossInternalArea = parseFloat(
    formData.get("gross_internal_area") as string
  );

  if (isNaN(priceOrRent) || priceOrRent <= 0) {
    throw new Error("Price / Rent must be greater than 0.");
  }
  if (isNaN(grossInternalArea) || grossInternalArea <= 0) {
    throw new Error("Gross Internal Area must be greater than 0.");
  }

  const ratePerSqm = priceOrRent / grossInternalArea;

  let adjustments: Adjustment[] | null = null;
  let adjustedRatePerSqm: number | null = null;

  const adjustmentsRaw = formData.get("adjustments_json") as string | null;
  if (adjustmentsRaw) {
    const parsed: Adjustment[] = JSON.parse(adjustmentsRaw);
    if (parsed.length > 0) {
      adjustments = parsed;
      const totalPct = parsed.reduce((sum, a) => sum + a.percentage, 0);
      adjustedRatePerSqm = ratePerSqm * (1 + totalPct / 100);
    }
  }

  const { error } = await supabase.from("comparables").insert({
    case_id: caseId,
    address: formData.get("address") as string,
    transaction_type: formData.get("transaction_type") as string,
    transaction_date: formData.get("transaction_date") as string,
    price_or_rent: priceOrRent,
    gross_internal_area: grossInternalArea,
    rate_per_sqm: ratePerSqm,
    adjustments,
    adjusted_rate_per_sqm: adjustedRatePerSqm,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/cases/${caseId}`);
}

export interface Adjustment {
  factor: string;
  percentage: number;
  rationale: string;
}

export async function saveAdjustments(
  comparableId: string,
  caseId: string,
  adjustments: Adjustment[]
) {
  const { data: comp, error: fetchError } = await supabase
    .from("comparables")
    .select("rate_per_sqm")
    .eq("id", comparableId)
    .single();

  if (fetchError || !comp) {
    throw new Error("Comparable not found.");
  }

  const totalPct = adjustments.reduce((sum, a) => sum + a.percentage, 0);
  const adjustedRate = Number(comp.rate_per_sqm) * (1 + totalPct / 100);

  const { error } = await supabase
    .from("comparables")
    .update({
      adjustments: adjustments.length > 0 ? adjustments : null,
      adjusted_rate_per_sqm: adjustments.length > 0 ? adjustedRate : null,
    })
    .eq("id", comparableId);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/cases/${caseId}`);
}

export async function saveValuation(
  caseId: string,
  valuationId: string | null,
  formData: FormData
) {
  const adopted_rate_per_sqm =
    (formData.get("adopted_rate_per_sqm") as string)?.trim() || null;
  const adopted_rate_rationale =
    (formData.get("adopted_rate_rationale") as string)?.trim() || null;

  const row = {
    case_id: caseId,
    adopted_rate_per_sqm: adopted_rate_per_sqm
      ? parseFloat(adopted_rate_per_sqm)
      : null,
    adopted_rate_rationale,
  };

  if (valuationId) {
    const { error } = await supabase
      .from("valuations")
      .update(row)
      .eq("id", valuationId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("valuations").insert(row);
    if (error) throw new Error(error.message);
  }

  redirect(`/cases/${caseId}`);
}

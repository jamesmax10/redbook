"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Adjustment } from "@/lib/types";

function requireField(formData: FormData, name: string, label: string): string {
  const value = (formData.get(name) as string | null)?.trim() ?? "";
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function caseUrl(caseId: string, formData?: FormData, extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  const step = formData?.get("_step") as string | null;
  if (step) params.set("step", step);
  if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  const qs = params.toString();
  return `/cases/${caseId}${qs ? `?${qs}` : ""}`;
}

export async function createCase(formData: FormData) {
  const client_name = requireField(formData, "client_name", "Client name");
  const property_address = requireField(formData, "property_address", "Property address");
  const valuation_date = requireField(formData, "valuation_date", "Valuation date");
  const purpose = requireField(formData, "purpose", "Purpose");
  const basis_of_value = requireField(formData, "basis_of_value", "Basis of value");

  const { data, error } = await supabase
    .from("cases")
    .insert({ client_name, property_address, valuation_date, purpose, basis_of_value })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/cases/${data.id}?step=1`);
}

export async function updateCase(caseId: string, formData: FormData) {
  const client_name = requireField(formData, "client_name", "Client name");
  const property_address = requireField(formData, "property_address", "Property address");
  const valuation_date = requireField(formData, "valuation_date", "Valuation date");
  const purpose = requireField(formData, "purpose", "Purpose");
  const basis_of_value = requireField(formData, "basis_of_value", "Basis of value");

  const { error } = await supabase
    .from("cases")
    .update({ client_name, property_address, valuation_date, purpose, basis_of_value })
    .eq("id", caseId);

  if (error) {
    throw new Error(error.message);
  }

  redirect(caseUrl(caseId, formData));
}

export async function saveProperty(
  caseId: string,
  propertyId: string | null,
  formData: FormData
) {
  const grossInternalArea = parseFloat(
    formData.get("gross_internal_area") as string
  );

  if (isNaN(grossInternalArea) || grossInternalArea <= 0) {
    throw new Error("Gross Internal Area must be greater than 0.");
  }

  const row = {
    case_id: caseId,
    address: formData.get("address") as string,
    property_type: formData.get("property_type") as string,
    gross_internal_area: grossInternalArea,
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

  redirect(caseUrl(caseId, formData));
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
  let adjustedRatePerSqm: number = ratePerSqm;

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

  redirect(caseUrl(caseId, formData));
}

export type { Adjustment } from "@/lib/types";

export async function updateComparable(
  comparableId: string,
  caseId: string,
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  const address = (formData.get("address") as string)?.trim();
  if (!address) return { success: false, error: "Address is required." };

  const transactionType = (formData.get("transaction_type") as string)?.trim();
  if (!transactionType) return { success: false, error: "Transaction type is required." };

  const transactionDate = (formData.get("transaction_date") as string)?.trim();
  if (!transactionDate) return { success: false, error: "Transaction date is required." };

  const priceOrRent = parseFloat(formData.get("price_or_rent") as string);
  const grossInternalArea = parseFloat(formData.get("gross_internal_area") as string);

  if (isNaN(priceOrRent) || priceOrRent <= 0) {
    return { success: false, error: "Price / Rent must be greater than 0." };
  }
  if (isNaN(grossInternalArea) || grossInternalArea <= 0) {
    return { success: false, error: "Gross Internal Area must be greater than 0." };
  }

  const ratePerSqm = priceOrRent / grossInternalArea;

  let adjustments: Adjustment[] | null = null;
  let adjustedRatePerSqm: number = ratePerSqm;

  const adjustmentsRaw = formData.get("adjustments_json") as string | null;
  if (adjustmentsRaw) {
    const parsed: Adjustment[] = JSON.parse(adjustmentsRaw);
    if (parsed.length > 0) {
      adjustments = parsed;
      const totalPct = parsed.reduce((sum, a) => sum + a.percentage, 0);
      adjustedRatePerSqm = ratePerSqm * (1 + totalPct / 100);
    }
  }

  const { error } = await supabase
    .from("comparables")
    .update({
      address,
      transaction_type: transactionType,
      transaction_date: transactionDate,
      price_or_rent: priceOrRent,
      gross_internal_area: grossInternalArea,
      rate_per_sqm: ratePerSqm,
      adjustments,
      adjusted_rate_per_sqm: adjustedRatePerSqm,
    })
    .eq("id", comparableId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}

export async function deleteComparable(comparableId: string, caseId: string, redirectStep?: string) {
  const { error } = await supabase
    .from("comparables")
    .delete()
    .eq("id", comparableId);

  if (error) {
    throw new Error(error.message);
  }

  const step = redirectStep ? `?step=${redirectStep}` : "";
  redirect(`/cases/${caseId}${step}`);
}

export async function saveAdjustments(
  comparableId: string,
  caseId: string,
  adjustments: Adjustment[],
  redirectStep?: string
) {
  const { data: comp, error: fetchError } = await supabase
    .from("comparables")
    .select("rate_per_sqm")
    .eq("id", comparableId)
    .single();

  if (fetchError || !comp) {
    throw new Error("Comparable not found.");
  }

  const ratePerSqm = Number(comp.rate_per_sqm);
  const totalPct = adjustments.reduce((sum, a) => sum + a.percentage, 0);
  const adjustedRate = ratePerSqm * (1 + totalPct / 100);

  const { error } = await supabase
    .from("comparables")
    .update({
      adjustments: adjustments.length > 0 ? adjustments : null,
      adjusted_rate_per_sqm: adjustments.length > 0 ? adjustedRate : ratePerSqm,
    })
    .eq("id", comparableId);

  if (error) {
    throw new Error(error.message);
  }

  const step = redirectStep ? `?step=${redirectStep}` : "";
  redirect(`/cases/${caseId}${step}`);
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
  const assumptions =
    (formData.get("assumptions") as string)?.trim() || null;
  const limiting_conditions =
    (formData.get("limiting_conditions") as string)?.trim() || null;
  const valuer_name =
    (formData.get("valuer_name") as string)?.trim() || null;

  const row = {
    case_id: caseId,
    adopted_rate_per_sqm: adopted_rate_per_sqm
      ? parseFloat(adopted_rate_per_sqm)
      : null,
    adopted_rate_rationale,
    assumptions,
    limiting_conditions,
    valuer_name,
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

  redirect(caseUrl(caseId, formData, { saved: "valuation" }));
}

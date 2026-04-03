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

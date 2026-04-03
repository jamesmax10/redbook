import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCase, saveProperty } from "@/app/actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent";

const PURPOSE_OPTIONS = [
  "Secured Lending",
  "Purchase",
  "Sale",
  "Financial Reporting",
  "Tax / CGT",
  "Insurance",
  "Probate",
  "Litigation",
  "Other",
];

const BASIS_OPTIONS = [
  "Market Value",
  "Market Rent",
  "Fair Value",
  "Investment Value",
  "Existing Use Value",
];

const PROPERTY_TYPE_OPTIONS = [
  "Residential - Detached",
  "Residential - Semi-detached",
  "Residential - Terraced",
  "Residential - Apartment",
  "Commercial - Office",
  "Commercial - Retail",
  "Commercial - Industrial",
  "Mixed Use",
  "Development Land",
  "Agricultural",
];

const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor", "Derelict"];

const TENURE_OPTIONS = ["Freehold", "Leasehold", "Fee Simple"];

function getValidationErrors(
  caseData: Record<string, unknown>,
  property: Record<string, unknown> | null
): string[] {
  const errors: string[] = [];

  if (!caseData.client_name) errors.push("Missing client name");
  if (!caseData.property_address) errors.push("Missing property address");
  if (!caseData.valuation_date) errors.push("Missing valuation date");
  if (!caseData.purpose) errors.push("Missing purpose");
  if (!caseData.basis_of_value) errors.push("Missing basis of value");

  if (!property) {
    errors.push("Missing subject property");
  } else {
    if (!property.address) errors.push("Missing subject property address");
    if (!property.property_type) errors.push("Missing property type");
    if (!property.gross_internal_area)
      errors.push("Missing gross internal area");
    if (!property.condition) errors.push("Missing condition");
    if (!property.tenure) errors.push("Missing tenure");
  }

  return errors;
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (caseError || !caseData) {
    notFound();
  }

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("case_id", id)
    .single();

  const updateCaseWithId = updateCase.bind(null, id);
  const savePropertyForCase = saveProperty.bind(
    null,
    id,
    property?.id ?? null
  );

  const errors = getValidationErrors(caseData, property);

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 mb-1">
        {caseData.client_name}
      </h1>
      <p className="text-zinc-500 text-sm mb-6">{caseData.property_address}</p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Case Details Form */}
        <form
          action={updateCaseWithId}
          className="bg-white rounded-lg border border-zinc-200 p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Case Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="client_name"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Client Name
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                required
                defaultValue={caseData.client_name}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="property_address"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Property Address
              </label>
              <input
                type="text"
                id="property_address"
                name="property_address"
                required
                defaultValue={caseData.property_address}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="valuation_date"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Valuation Date
              </label>
              <input
                type="date"
                id="valuation_date"
                name="valuation_date"
                required
                defaultValue={caseData.valuation_date}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="purpose"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Purpose
              </label>
              <select
                id="purpose"
                name="purpose"
                required
                defaultValue={caseData.purpose}
                className={inputClass}
              >
                <option value="">Select purpose...</option>
                {PURPOSE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="basis_of_value"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Basis of Value
              </label>
              <select
                id="basis_of_value"
                name="basis_of_value"
                required
                defaultValue={caseData.basis_of_value}
                className={inputClass}
              >
                <option value="">Select basis...</option>
                {BASIS_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="bg-zinc-900 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700"
              >
                Save Case
              </button>
            </div>
          </div>
        </form>

        {/* Subject Property Form */}
        <form
          action={savePropertyForCase}
          className="bg-white rounded-lg border border-zinc-200 p-6"
        >
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Subject Property
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                defaultValue={
                  property?.address ?? caseData.property_address ?? ""
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="property_type"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Property Type
              </label>
              <select
                id="property_type"
                name="property_type"
                required
                defaultValue={property?.property_type ?? ""}
                className={inputClass}
              >
                <option value="">Select type...</option>
                {PROPERTY_TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="gross_internal_area"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Gross Internal Area (sq m)
              </label>
              <input
                type="number"
                id="gross_internal_area"
                name="gross_internal_area"
                required
                step="0.01"
                min="0"
                defaultValue={property?.gross_internal_area ?? ""}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Condition
              </label>
              <select
                id="condition"
                name="condition"
                required
                defaultValue={property?.condition ?? ""}
                className={inputClass}
              >
                <option value="">Select condition...</option>
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tenure"
                className="block text-sm font-medium text-zinc-700 mb-1"
              >
                Tenure
              </label>
              <select
                id="tenure"
                name="tenure"
                required
                defaultValue={property?.tenure ?? ""}
                className={inputClass}
              >
                <option value="">Select tenure...</option>
                {TENURE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="bg-zinc-900 text-white px-4 py-2 rounded-md text-sm hover:bg-zinc-700"
              >
                {property ? "Update Property" : "Save Property"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Validation Panel */}
      <div className="mt-6">
        {errors.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">&#10003;</span>
              <h2 className="text-base font-semibold text-green-800">
                Phase 0 Complete
              </h2>
            </div>
            <p className="text-green-700 text-sm mt-1">
              All required case and property fields are filled in.
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <h2 className="text-base font-semibold text-red-800 mb-3">
              Validation Errors
            </h2>
            <ul className="space-y-1.5">
              {errors.map((e) => (
                <li
                  key={e}
                  className="flex items-center gap-2 text-sm text-red-700"
                >
                  <span className="text-red-400">&#10005;</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

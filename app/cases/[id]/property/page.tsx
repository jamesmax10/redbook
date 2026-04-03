import { saveProperty } from "@/app/actions";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent";

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

export default async function PropertyFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: caseData, error } = await supabase
    .from("cases")
    .select("id, client_name, property_address")
    .eq("id", id)
    .single();

  if (error || !caseData) {
    notFound();
  }

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("case_id", id)
    .single();

  const isEditing = !!property;
  const savePropertyForCase = saveProperty.bind(
    null,
    id,
    property?.id ?? null
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/cases/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          &larr; Back to Case
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 mb-1">
        {isEditing ? "Edit Subject Property" : "Add Subject Property"}
      </h1>
      <p className="text-zinc-500 text-sm mb-6">
        {caseData.client_name} &mdash; {caseData.property_address}
      </p>

      <form
        action={savePropertyForCase}
        className="bg-white rounded-lg border border-zinc-200 p-6 max-w-xl space-y-5"
      >
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

        <div className="pt-2">
          <button
            type="submit"
            className="bg-zinc-900 text-white px-5 py-2 rounded-md text-sm hover:bg-zinc-700"
          >
            {isEditing ? "Update Property" : "Save Property"}
          </button>
        </div>
      </form>
    </div>
  );
}

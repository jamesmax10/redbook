"use client";

import { useState } from "react";
import { inputClass, btnPrimary, labelClass } from "@/lib/styles";
import AddressAutocomplete from "../AddressAutocomplete";

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

interface PropertyData {
  address: string;
  property_type: string;
  condition: string;
  gross_internal_area: number;
  tenure: string;
}

interface Props {
  property: PropertyData | null;
  action: (formData: FormData) => Promise<void>;
  defaultAddress: string;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-zinc-50 last:border-0">
      <span className="text-xs text-zinc-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-zinc-900">{value || "—"}</span>
    </div>
  );
}

export default function PropertySection({ property, action, defaultAddress }: Props) {
  const [editing, setEditing] = useState(!property);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Subject Property
        </p>
        {!editing && property && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form action={action} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="prop_address" className={labelClass}>
                Address
              </label>
              <AddressAutocomplete
                id="prop_address"
                name="address"
                required
                defaultValue={property?.address ?? defaultAddress}
              />
            </div>
            <div>
              <label htmlFor="prop_type" className={labelClass}>
                Property Type
              </label>
              <select
                id="prop_type"
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
              <label htmlFor="prop_condition" className={labelClass}>
                Condition
              </label>
              <select
                id="prop_condition"
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
              <label htmlFor="prop_gia" className={labelClass}>
                Gross Internal Area (m²)
              </label>
              <input
                type="number"
                id="prop_gia"
                name="gross_internal_area"
                required
                step="0.01"
                min="0"
                defaultValue={property?.gross_internal_area ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prop_tenure" className={labelClass}>
                Tenure
              </label>
              <select
                id="prop_tenure"
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
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className={btnPrimary}>
              Save Changes
            </button>
            {property && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        property && (
          <div className="px-5 py-1">
            <FieldRow label="Address" value={property.address} />
            <FieldRow label="Property Type" value={property.property_type} />
            <FieldRow label="Condition" value={property.condition} />
            <FieldRow
              label="GIA"
              value={`${property.gross_internal_area.toLocaleString("en-IE")} m²`}
            />
            <FieldRow label="Tenure" value={property.tenure} />
          </div>
        )
      )}
    </div>
  );
}

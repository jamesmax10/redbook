"use client";

import { useState } from "react";
import { inputClass, btnPrimary, labelClass } from "@/lib/styles";

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

interface CaseData {
  client_name: string;
  property_address: string;
  valuation_date: string;
  purpose: string;
  basis_of_value: string;
}

interface Props {
  caseData: CaseData;
  action: (formData: FormData) => Promise<void>;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-zinc-50 last:border-0">
      <span className="text-xs text-zinc-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-zinc-900">{value || "—"}</span>
    </div>
  );
}

export default function CaseDetailsSection({ caseData, action }: Props) {
  const [editing, setEditing] = useState(false);

  const fmtDate = (d: string) =>
    d
      ? new Date(d + "T00:00:00").toLocaleDateString("en-IE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <div className="bg-white border border-zinc-200 rounded-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Case Details
        </p>
        {!editing && (
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
              <label htmlFor="cd_client_name" className={labelClass}>
                Client Name
              </label>
              <input
                type="text"
                id="cd_client_name"
                name="client_name"
                required
                defaultValue={caseData.client_name}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="cd_property_address" className={labelClass}>
                Property Address
              </label>
              <input
                type="text"
                id="cd_property_address"
                name="property_address"
                required
                defaultValue={caseData.property_address}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cd_valuation_date" className={labelClass}>
                Valuation Date
              </label>
              <input
                type="date"
                id="cd_valuation_date"
                name="valuation_date"
                required
                defaultValue={caseData.valuation_date}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cd_purpose" className={labelClass}>
                Purpose
              </label>
              <select
                id="cd_purpose"
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
            <div className="col-span-2">
              <label htmlFor="cd_basis_of_value" className={labelClass}>
                Basis of Value
              </label>
              <select
                id="cd_basis_of_value"
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
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className={btnPrimary}>
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="px-5 py-1">
          <FieldRow label="Client Name" value={caseData.client_name} />
          <FieldRow label="Property Address" value={caseData.property_address} />
          <FieldRow label="Valuation Date" value={fmtDate(caseData.valuation_date)} />
          <FieldRow label="Purpose" value={caseData.purpose} />
          <FieldRow label="Basis of Value" value={caseData.basis_of_value} />
        </div>
      )}
    </div>
  );
}

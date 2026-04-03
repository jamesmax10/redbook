import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCase, saveProperty, addComparable } from "@/app/actions";
import type { Adjustment } from "@/app/actions";
import ComparableForm from "./ComparableForm";
import AdjustmentsEditor from "./AdjustmentsEditor";
import ValuationSection from "./ValuationSection";
import {
  runValidation,
  SEVERITY_ICON,
  SECTION_LABELS,
  type Section,
  type ValidationResult,
} from "./validation";

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

function StatusBanner({ validation }: { validation: ValidationResult }) {
  const issueCount = validation.errorCount + validation.warningCount;

  if (validation.status === "ready") {
    return (
      <div className="mb-8 bg-green-50 border border-green-200 rounded-lg px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{"\u2705"}</span>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Ready for Valuation
            </p>
            <p className="text-xs text-green-600">
              All checks pass — this valuation is complete.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (validation.status === "review") {
    return (
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{"\u26A0\uFE0F"}</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Needs Review
            </p>
            <p className="text-xs text-amber-600">
              {issueCount} {issueCount === 1 ? "warning" : "warnings"} to
              review before finalising.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-red-50 border border-red-200 rounded-lg px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{"\u274C"}</span>
        <div>
          <p className="text-sm font-semibold text-red-800">
            Incomplete Valuation
          </p>
          <p className="text-xs text-red-600">
            {issueCount} {issueCount === 1 ? "issue" : "issues"} to resolve
            before this valuation is ready.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionIndicator({
  section,
  validation,
}: {
  section: Section;
  validation: ValidationResult;
}) {
  const s = validation.sections[section];
  const colorMap = {
    pass: "text-green-600",
    warning: "text-amber-600",
    error: "text-red-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorMap[s.severity]}`}
    >
      <span>{SEVERITY_ICON[s.severity]}</span>
      <span>{s.message}</span>
    </span>
  );
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

  const { data: comparables } = await supabase
    .from("comparables")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: false });

  const { data: valuation } = await supabase
    .from("valuations")
    .select("*")
    .eq("case_id", id)
    .single();

  const adjustedRates = (comparables ?? [])
    .map((c: { adjusted_rate_per_sqm: number | null }) => c.adjusted_rate_per_sqm)
    .filter((v): v is number => v != null);

  const summaryMetrics =
    adjustedRates.length > 0
      ? {
          count: adjustedRates.length,
          min: Math.min(...adjustedRates),
          max: Math.max(...adjustedRates),
          average:
            adjustedRates.reduce((a: number, b: number) => a + b, 0) /
            adjustedRates.length,
        }
      : null;

  const updateCaseWithId = updateCase.bind(null, id);
  const savePropertyForCase = saveProperty.bind(
    null,
    id,
    property?.id ?? null
  );
  const addComparableForCase = addComparable.bind(null, id);

  const validation = runValidation(caseData, comparables, valuation);

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
          &larr; Back to Dashboard
        </Link>
      </div>

      <StatusBanner validation={validation} />

      <h1 className="text-2xl font-bold text-zinc-900 mb-1">
        {caseData.client_name}
      </h1>
      <p className="text-zinc-500 text-sm mb-6">{caseData.property_address}</p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Case Details Form */}
        <form
          action={updateCaseWithId}
          className="bg-white rounded-lg border border-zinc-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">
              Case Details
            </h2>
            <SectionIndicator section="case" validation={validation} />
          </div>
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
          className="bg-white rounded-lg border border-zinc-100 p-6"
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

      {/* Comparables Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Comparables</h2>
          <SectionIndicator section="comparables" validation={validation} />
        </div>

        <ComparableForm action={addComparableForCase} />

        <div className="mt-8">
          {comparables && comparables.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-zinc-200 text-left">
                      <th className="pb-3 pr-4 font-medium text-zinc-500">
                        Address
                      </th>
                      <th className="pb-3 pr-4 font-medium text-zinc-400">
                        Type
                      </th>
                      <th className="pb-3 pr-4 font-medium text-zinc-400">
                        Date
                      </th>
                      <th className="pb-3 pr-4 font-medium text-zinc-500 text-right">
                        &euro;/sq&nbsp;m
                      </th>
                      <th className="pb-3 pr-4 font-medium text-zinc-900 text-right">
                        Adj. &euro;/sq&nbsp;m
                      </th>
                      <th className="pb-3 pr-4 font-medium text-zinc-500 text-right">
                        &Delta;&nbsp;%
                      </th>
                      <th className="pb-3 pr-4 font-medium text-zinc-400">
                        Adjustments
                      </th>
                      <th className="pb-3 font-medium text-zinc-400 text-center w-8">
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparables.map(
                      (comp: {
                        id: string;
                        address: string;
                        transaction_type: string;
                        transaction_date: string;
                        price_or_rent: number;
                        gross_internal_area: number;
                        rate_per_sqm: number;
                        adjustments: Adjustment[] | null;
                        adjusted_rate_per_sqm: number | null;
                      }) => {
                        const fmtNum = (v: number) =>
                          Number(v).toLocaleString("en-IE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                        const deltaPct =
                          comp.adjusted_rate_per_sqm != null
                            ? ((comp.adjusted_rate_per_sqm -
                                comp.rate_per_sqm) /
                                comp.rate_per_sqm) *
                              100
                            : null;
                        const adjSummary = comp.adjustments?.length
                          ? comp.adjustments
                              .map(
                                (a) =>
                                  `${a.percentage >= 0 ? "+" : ""}${a.percentage}%`
                              )
                              .join(", ")
                          : null;

                        return (
                          <tr
                            key={comp.id}
                            className="border-b border-zinc-100 last:border-0 align-top"
                          >
                            <td className="py-3 pr-4 font-medium text-zinc-900">
                              {comp.address}
                            </td>
                            <td className="py-3 pr-4 text-zinc-400">
                              {comp.transaction_type}
                            </td>
                            <td className="py-3 pr-4 text-zinc-400">
                              {comp.transaction_date}
                            </td>
                            <td className="py-3 pr-4 text-zinc-500 text-right tabular-nums">
                              {`\u20AC${fmtNum(comp.rate_per_sqm)}`}
                            </td>
                            <td className="py-3 pr-4 text-right tabular-nums font-semibold text-zinc-900">
                              {comp.adjusted_rate_per_sqm != null
                                ? `\u20AC${fmtNum(comp.adjusted_rate_per_sqm)}`
                                : "\u2014"}
                            </td>
                            <td className="py-3 pr-4 text-right tabular-nums text-zinc-600">
                              {deltaPct != null
                                ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%`
                                : "\u2014"}
                            </td>
                            <td className="py-3 pr-4 text-xs text-zinc-400 max-w-[140px]">
                              {adjSummary ?? "\u2014"}
                            </td>
                            <td className="py-3 text-center w-8">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${comp.adjusted_rate_per_sqm != null ? "bg-zinc-900" : "bg-zinc-200"}`}
                                title={comp.adjusted_rate_per_sqm != null ? "Adjusted" : "Not adjusted"}
                              />
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>

                <div className="mt-6 space-y-4 border-t border-zinc-100 pt-4">
                  {comparables.map(
                    (comp: {
                      id: string;
                      address: string;
                      rate_per_sqm: number;
                      adjustments: Adjustment[] | null;
                    }) => (
                      <div key={comp.id}>
                        <p className="text-sm font-medium text-zinc-700">
                          {comp.address}
                        </p>
                        <AdjustmentsEditor
                          comparableId={comp.id}
                          caseId={id}
                          ratePerSqm={Number(comp.rate_per_sqm)}
                          initialAdjustments={comp.adjustments}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
          ) : (
            <p className="text-sm text-zinc-500">
              No comparables added yet. Use the form above to add comparable
              evidence.
            </p>
          )}
        </div>
      </div>

      {/* Comparable Insights & Adopted Rate */}
      <ValuationSection
        caseId={id}
        metrics={summaryMetrics}
        valuation={valuation}
        sectionStatus={validation.sections.valuation}
      />

      {/* Validation Panel */}
      <div className="mt-12 pt-8 border-t border-zinc-100">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">
          Valuation Checklist
        </h2>
        <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100">
          {(["case", "comparables", "valuation"] as Section[]).map(
            (section) => {
              const sectionChecks = validation.checks.filter(
                (c) => c.section === section
              );
              return (
                <div key={section} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{SEVERITY_ICON[validation.sections[section].severity]}</span>
                    <h3 className="text-sm font-semibold text-zinc-800">
                      {SECTION_LABELS[section]}
                    </h3>
                  </div>
                  <ul className="space-y-1 pl-7">
                    {sectionChecks.map((check) => {
                      const color =
                        check.severity === "pass"
                          ? "text-green-700"
                          : check.severity === "warning"
                            ? "text-amber-700"
                            : "text-red-600";
                      return (
                        <li
                          key={check.message}
                          className={`flex items-center gap-2 text-sm ${color}`}
                        >
                          <span className="text-xs">
                            {SEVERITY_ICON[check.severity]}
                          </span>
                          {check.message}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

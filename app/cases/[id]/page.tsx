import { Fragment } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCase, saveProperty, addComparable } from "@/app/actions";
import type { Adjustment } from "@/lib/types";
import {
  inputClass,
  btnPrimary,
  card,
  labelClass,
  thClass,
  backLink,
} from "@/lib/styles";
import {
  deriveCaseStatus,
  deriveStepCompletion,
  STATUS_BADGE,
} from "@/lib/caseStatus";
import ComparableForm from "./ComparableForm";
import ComparableRow from "./ComparableRow";
import ComparableStepNav from "./ComparableStepNav";
import ValuationSection from "./ValuationSection";
import {
  runValidation,
  SEVERITY_ICON,
  SECTION_LABELS,
  type Section,
  type Severity,
} from "./validation";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { num: 1, label: "Details" },
  { num: 2, label: "Property" },
  { num: 3, label: "Comparables" },
  { num: 4, label: "Valuation" },
  { num: 5, label: "Report" },
] as const;

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


// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar({
  currentStep,
  completedSteps,
  caseId,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  caseId: string;
}) {
  return (
    <nav className="mb-10" aria-label="Workflow progress">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const isComplete = completedSteps.has(step.num);
          const isCurrent = currentStep === step.num;

          return (
            <Fragment key={step.num}>
              {i > 0 && (
                <li aria-hidden className="flex-1 px-1 sm:px-2">
                  <div
                    className={`h-px ${
                      completedSteps.has(STEPS[i - 1].num)
                        ? "bg-emerald-300"
                        : "bg-zinc-200"
                    }`}
                  />
                </li>
              )}
              <li>
                <Link
                  href={`/cases/${caseId}?step=${step.num}`}
                  className="flex flex-col items-center gap-1.5 group"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      isComplete
                        ? "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-200"
                        : isCurrent
                          ? "bg-zinc-900 text-white ring-2 ring-zinc-900"
                          : "bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200"
                    }`}
                  >
                    {isComplete ? "\u2713" : step.num}
                  </span>
                  <span
                    className={`text-xs font-medium whitespace-nowrap transition-colors ${
                      isCurrent
                        ? "text-zinc-900"
                        : isComplete
                          ? "text-emerald-600"
                          : "text-zinc-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </Link>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Step navigation footer
// ---------------------------------------------------------------------------

function StepNav({
  caseId,
  currentStep,
  nextLabel,
  nextHref,
}: {
  caseId: string;
  currentStep: number;
  nextLabel?: string;
  nextHref?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-zinc-100">
      {currentStep > 1 ? (
        <Link
          href={`/cases/${caseId}?step=${currentStep - 1}`}
          className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          &larr; Back
        </Link>
      ) : (
        <Link href="/" className={backLink}>
          &larr; Dashboard
        </Link>
      )}
      {nextHref && (
        <Link href={nextHref} className={btnPrimary}>
          {nextLabel ?? "Continue"}
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const rawStep = parseInt(resolvedSearchParams.step as string) || 1;
  const currentStep = rawStep >= 1 && rawStep <= 5 ? rawStep : 1;
  const valuationSaved = resolvedSearchParams.saved === "valuation";
  const comparableAdded = resolvedSearchParams.added === "1";
  const lastTransactionType = (resolvedSearchParams.tt as string) || "";

  // ── Fetch data ──────────────────────────────────────────────

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (caseError || !caseData) {
    notFound();
  }

  const { data: property, error: propError } = await supabase
    .from("properties")
    .select("*")
    .eq("case_id", id)
    .maybeSingle();

  if (propError) throw propError;

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

  if (valError) throw valError;

  // ── Derived state ───────────────────────────────────────────

  const effectiveRates = (comparables ?? []).map(
    (c: { adjusted_rate_per_sqm: number | null; rate_per_sqm: number }) =>
      c.adjusted_rate_per_sqm ?? Number(c.rate_per_sqm)
  );

  const summaryMetrics =
    effectiveRates.length > 0
      ? {
          count: effectiveRates.length,
          min: Math.min(...effectiveRates),
          max: Math.max(...effectiveRates),
          average:
            effectiveRates.reduce((a: number, b: number) => a + b, 0) /
            effectiveRates.length,
        }
      : null;

  const validation = runValidation(caseData, comparables, valuation);

  const statusInput = {
    caseFields: caseData,
    property: property ?? null,
    comparableCount: comparables?.length ?? 0,
    valuation: valuation ?? null,
  };
  const overallBadge = STATUS_BADGE[deriveCaseStatus(statusInput)];
  const completed = deriveStepCompletion(statusInput);

  // Bind actions
  const updateCaseWithId = updateCase.bind(null, id);
  const savePropertyForCase = saveProperty.bind(
    null,
    id,
    property?.id ?? null
  );
  const addComparableForCase = addComparable.bind(null, id);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div>
      {/* Back to dashboard */}
      <div className="mb-6">
        <Link href="/" className={backLink}>
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Header card */}
      <div className={`${card} px-6 py-5 mb-2`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 truncate">
                {caseData.client_name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${overallBadge.className}`}
              >
                {overallBadge.label}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1 truncate">
              {caseData.property_address}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {caseData.purpose && (
                <span className="text-xs text-zinc-500 bg-zinc-100 rounded-full px-2.5 py-0.5">
                  {caseData.purpose}
                </span>
              )}
              {caseData.basis_of_value && (
                <span className="text-xs text-zinc-500 bg-zinc-100 rounded-full px-2.5 py-0.5">
                  {caseData.basis_of_value}
                </span>
              )}
              {caseData.valuation_date && (
                <span className="text-xs text-zinc-500 bg-zinc-100 rounded-full px-2.5 py-0.5 tabular-nums">
                  {caseData.valuation_date}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-8">
        <ProgressBar
          currentStep={currentStep}
          completedSteps={completed}
          caseId={id}
        />
      </div>

      {/* ── Step 1: Case Details ───────────────────────────────── */}
      {currentStep === 1 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">
            Case Details
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            Enter the core details for this valuation case.
          </p>

          <form action={updateCaseWithId} className="max-w-2xl space-y-4">
            <input type="hidden" name="_step" value="2" />

            <div>
              <label htmlFor="client_name" className={labelClass}>
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
              <label htmlFor="property_address" className={labelClass}>
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
              <label htmlFor="valuation_date" className={labelClass}>
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
              <label htmlFor="purpose" className={labelClass}>
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
              <label htmlFor="basis_of_value" className={labelClass}>
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

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-100">
              <Link href="/" className={backLink}>
                &larr; Dashboard
              </Link>
              <button type="submit" className={btnPrimary}>
                Save &amp; Continue
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Step 2: Subject Property ───────────────────────────── */}
      {currentStep === 2 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">
            Subject Property
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            Describe the property being valued.
          </p>

          <form action={savePropertyForCase} className="max-w-2xl space-y-4">
            <input type="hidden" name="_step" value="3" />

            <div>
              <label htmlFor="address" className={labelClass}>
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
              <label htmlFor="property_type" className={labelClass}>
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
              <label htmlFor="gross_internal_area" className={labelClass}>
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
              <label htmlFor="condition" className={labelClass}>
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
              <label htmlFor="tenure" className={labelClass}>
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

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-100">
              <Link
                href={`/cases/${id}?step=1`}
                className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                &larr; Back
              </Link>
              <button type="submit" className={btnPrimary}>
                Save &amp; Continue
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Step 3: Comparables ────────────────────────────────── */}
      {currentStep === 3 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">
            Comparables
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            {(comparables?.length ?? 0) >= 2
              ? "\u2713 Minimum comparables met."
              : (comparables?.length ?? 0) === 1
                ? "1 comparable added \u2014 1 more required."
                : "Add at least 2 comparables to proceed."}
          </p>

          <ComparableForm
            action={addComparableForCase}
            redirectStep="3"
            existingComparables={(comparables ?? []).map((c: { address: string; price_or_rent: number; gross_internal_area: number }) => ({
              address: c.address,
              price_or_rent: c.price_or_rent,
              gross_internal_area: c.gross_internal_area,
            }))}
            justAdded={comparableAdded}
            defaultTransactionType={lastTransactionType}
          />

          <div className="mt-8">
            {comparables && comparables.length > 0 ? (
              <div className={`${card} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className={`text-left px-4 py-3 ${thClass}`}>
                          Address
                        </th>
                        <th className={`text-left px-4 py-3 ${thClass}`}>
                          Type
                        </th>
                        <th className={`text-left px-4 py-3 ${thClass}`}>
                          Date
                        </th>
                        <th className={`text-right px-4 py-3 ${thClass}`}>
                          &euro;/sq&nbsp;m
                        </th>
                        <th
                          className={`text-right px-4 py-3 ${thClass} !text-zinc-900`}
                        >
                          Adj. &euro;/sq&nbsp;m
                        </th>
                        <th className={`text-right px-4 py-3 ${thClass}`}>
                          &Delta;&nbsp;%
                        </th>
                        <th className={`text-left px-4 py-3 ${thClass}`}>
                          Adjustments
                        </th>
                        <th className="px-2 py-3 w-8"></th>
                        <th className="px-2 py-3 w-8"></th>
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
                        }) => (
                          <ComparableRow
                            key={comp.id}
                            comp={comp}
                            caseId={id}
                            redirectStep="3"
                          />
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                No comparables added yet. Use the form above to add comparable
                evidence.
              </p>
            )}
          </div>

          <ComparableStepNav
            caseId={id}
            comparableCount={comparables?.length ?? 0}
          />
        </section>
      )}

      {/* ── Step 4: Valuation ──────────────────────────────────── */}
      {currentStep === 4 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">
            Valuation
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            Review comparable insights and set your adopted rate.
          </p>

          <ValuationSection
            caseId={id}
            metrics={summaryMetrics}
            valuation={valuation}
            saved={valuationSaved}
            issueCount={validation.errorCount + validation.warningCount}
            nextStep="5"
          />

          <div className="flex items-center pt-8 mt-8 border-t border-zinc-100">
            <Link
              href={`/cases/${id}?step=3`}
              className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              &larr; Back
            </Link>
          </div>
        </section>
      )}

      {/* ── Step 5: Report ─────────────────────────────────────── */}
      {currentStep === 5 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">
            Review &amp; Report
          </h2>
          <p className="text-sm text-zinc-400 mb-8">
            Check that all workflow steps are complete, then view your report.
          </p>

          {/* Completion banner */}
          {completed.has(5) ? (
            <div className="mb-8 rounded-xl px-5 py-4 flex items-center gap-3 bg-emerald-50/80 ring-1 ring-emerald-200/60">
              <span className="text-lg">{"\u2705"}</span>
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Valuation Complete
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  All workflow steps are complete. Your report is ready.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-xl px-5 py-4 flex items-center gap-3 bg-amber-50/80 ring-1 ring-amber-200/60">
              <span className="text-lg">{"\u26A0\uFE0F"}</span>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Incomplete Steps
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Some workflow steps are missing data. Review the checklist
                  below.
                </p>
              </div>
            </div>
          )}

          {/* Checklist */}
          <div className={`${card} divide-y divide-zinc-100`}>
            {(["case", "comparables", "valuation"] as Section[]).map(
              (section) => {
                const sectionChecks = validation.checks.filter(
                  (c) => c.section === section
                );
                return (
                  <div key={section} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span>
                        {SEVERITY_ICON[validation.sections[section].severity]}
                      </span>
                      <h3 className="text-sm font-semibold text-zinc-800">
                        {SECTION_LABELS[section]}
                      </h3>
                    </div>
                    <ul className="space-y-1 pl-7">
                      {sectionChecks.map((check) => {
                        const color =
                          check.severity === "pass"
                            ? "text-emerald-700"
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

          {/* Report action */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href={`/cases/${id}/report`}
              className={`${btnPrimary} px-8 py-2.5`}
            >
              View Report
            </Link>
            <span className="text-xs text-zinc-400">
              You can return to any step using the progress bar above.
            </span>
          </div>

          <div className="flex items-center pt-8 mt-8 border-t border-zinc-100">
            <Link
              href={`/cases/${id}?step=4`}
              className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              &larr; Back
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

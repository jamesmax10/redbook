/**
 * Single source of truth for case status across the entire app.
 * Both the dashboard and the case detail page import from here.
 */

export type CaseStatus = "ready" | "in_progress" | "incomplete";

export interface CaseStatusInput {
  caseFields: {
    client_name: unknown;
    property_address: unknown;
    valuation_date: unknown;
    purpose: unknown;
    basis_of_value: unknown;
  };
  property: {
    property_type: unknown;
    gross_internal_area: unknown;
    condition: unknown;
    tenure: unknown;
  } | null;
  comparableCount: number;
  valuation: {
    adopted_rate_per_sqm: number | null;
    adopted_rate_rationale: string | null;
  } | null;
}

function checkCompletion(input: CaseStatusInput) {
  return {
    caseOk: !!(
      input.caseFields.client_name &&
      input.caseFields.property_address &&
      input.caseFields.valuation_date &&
      input.caseFields.purpose &&
      input.caseFields.basis_of_value
    ),
    propertyOk: !!(
      input.property?.property_type &&
      input.property?.gross_internal_area &&
      input.property?.condition &&
      input.property?.tenure
    ),
    comparablesOk: input.comparableCount >= 2,
    valuationOk:
      input.valuation != null &&
      input.valuation.adopted_rate_per_sqm != null &&
      !!input.valuation.adopted_rate_rationale,
  };
}

export function deriveCaseStatus(input: CaseStatusInput): CaseStatus {
  const { caseOk, propertyOk, comparablesOk, valuationOk } =
    checkCompletion(input);

  if (caseOk && propertyOk && comparablesOk && valuationOk) {
    return "ready";
  }
  if (input.property || input.comparableCount > 0 || input.valuation) {
    return "in_progress";
  }
  return "incomplete";
}

export function deriveStepCompletion(input: CaseStatusInput): Set<number> {
  const { caseOk, propertyOk, comparablesOk, valuationOk } =
    checkCompletion(input);

  const completed = new Set<number>();
  if (caseOk) completed.add(1);
  if (propertyOk) completed.add(2);
  if (comparablesOk) completed.add(3);
  if (valuationOk) completed.add(4);
  if (caseOk && propertyOk && comparablesOk && valuationOk) completed.add(5);
  return completed;
}

export const STATUS_BADGE: Record<
  CaseStatus,
  { label: string; className: string }
> = {
  ready: {
    label: "Ready",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-700/20",
  },
  incomplete: {
    label: "Incomplete",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  },
};

export type Severity = "error" | "warning" | "pass";
export type Section = "case" | "comparables" | "valuation";

export interface ValidationCheck {
  section: Section;
  severity: Severity;
  message: string;
}

export interface SectionStatus {
  severity: Severity;
  message: string;
}

export interface ValidationResult {
  checks: ValidationCheck[];
  status: "ready" | "incomplete" | "review";
  errorCount: number;
  warningCount: number;
  sections: Record<Section, SectionStatus>;
}

export function runValidation(
  caseData: Record<string, unknown>,
  comparables: unknown[] | null,
  valuation: {
    adopted_rate_per_sqm: number | null;
    adopted_rate_rationale: string | null;
    assumptions: string | null;
    limiting_conditions: string | null;
    valuer_name: string | null;
  } | null
): ValidationResult {
  const checks: ValidationCheck[] = [];

  // --- Case / Property checks ---

  checks.push(
    caseData.client_name
      ? { section: "case", severity: "pass", message: "Client name provided" }
      : {
          section: "case",
          severity: "error",
          message: "Client name is missing",
        }
  );

  checks.push(
    caseData.property_address
      ? {
          section: "case",
          severity: "pass",
          message: "Property address provided",
        }
      : {
          section: "case",
          severity: "error",
          message: "Property address is missing",
        }
  );

  checks.push(
    caseData.valuation_date
      ? { section: "case", severity: "pass", message: "Valuation date set" }
      : {
          section: "case",
          severity: "error",
          message: "Valuation date is missing",
        }
  );

  // --- Comparables checks ---

  const compCount = comparables?.length ?? 0;
  if (compCount >= 2) {
    checks.push({
      section: "comparables",
      severity: "pass",
      message: `${compCount} comparables added`,
    });
  } else if (compCount === 1) {
    checks.push({
      section: "comparables",
      severity: "warning",
      message: "Only 1 comparable (minimum 2 recommended)",
    });
  } else {
    checks.push({
      section: "comparables",
      severity: "error",
      message: "No comparables added yet",
    });
  }

  // --- Valuation checks ---

  checks.push(
    valuation?.adopted_rate_per_sqm != null
      ? { section: "valuation", severity: "pass", message: "Adopted rate set" }
      : {
          section: "valuation",
          severity: "error",
          message: "Adopted rate is missing",
        }
  );

  checks.push(
    valuation?.adopted_rate_rationale
      ? {
          section: "valuation",
          severity: "pass",
          message: "Rationale provided",
        }
      : {
          section: "valuation",
          severity: "error",
          message: "Adopted rate rationale is missing",
        }
  );

  checks.push(
    valuation?.assumptions
      ? {
          section: "valuation",
          severity: "pass",
          message: "Assumptions provided",
        }
      : {
          section: "valuation",
          severity: "warning",
          message: "Assumptions not provided",
        }
  );

  checks.push(
    valuation?.limiting_conditions
      ? {
          section: "valuation",
          severity: "pass",
          message: "Limiting conditions provided",
        }
      : {
          section: "valuation",
          severity: "warning",
          message: "Limiting conditions not provided",
        }
  );

  checks.push(
    valuation?.valuer_name
      ? {
          section: "valuation",
          severity: "pass",
          message: "Valuer name provided",
        }
      : {
          section: "valuation",
          severity: "warning",
          message: "Valuer name not provided",
        }
  );

  // --- Aggregate ---

  const errorCount = checks.filter((c) => c.severity === "error").length;
  const warningCount = checks.filter((c) => c.severity === "warning").length;

  let status: "ready" | "incomplete" | "review";
  if (errorCount > 0) status = "incomplete";
  else if (warningCount > 0) status = "review";
  else status = "ready";

  const sections = buildSectionStatuses(checks);

  return { checks, status, errorCount, warningCount, sections };
}

function worstSeverity(checks: ValidationCheck[]): Severity {
  if (checks.some((c) => c.severity === "error")) return "error";
  if (checks.some((c) => c.severity === "warning")) return "warning";
  return "pass";
}

function buildSectionStatuses(
  checks: ValidationCheck[]
): Record<Section, SectionStatus> {
  const bySection = (s: Section) => checks.filter((c) => c.section === s);

  const sectionMessage = (s: Section, severity: Severity): string => {
    const sectionChecks = bySection(s);
    if (severity === "pass") {
      const labels: Record<Section, string> = {
        case: "Property details complete",
        comparables: "Comparables complete",
        valuation: "Valuation complete",
      };
      return labels[s];
    }
    const issues = sectionChecks.filter((c) => c.severity !== "pass");
    return issues.map((c) => c.message).join("; ");
  };

  const result = {} as Record<Section, SectionStatus>;
  for (const s of ["case", "comparables", "valuation"] as Section[]) {
    const severity = worstSeverity(bySection(s));
    result[s] = { severity, message: sectionMessage(s, severity) };
  }
  return result;
}

export const SEVERITY_ICON: Record<Severity, string> = {
  pass: "\u2705",
  warning: "\u26A0\uFE0F",
  error: "\u274C",
};

export const SECTION_LABELS: Record<Section, string> = {
  case: "Case Details",
  comparables: "Comparables",
  valuation: "Valuation",
};

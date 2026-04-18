export interface ValidationFinding {
  id: string;
  severity: "critical" | "warning" | "pass";
  category: "terms" | "comparables" | "valuation" | "report";
  title: string;
  detail: string;
  standard: string;
  evidence: string;
  action: string;
}

export interface HardRuleResult {
  findings: ValidationFinding[];
  criticalCount: number;
  warningCount: number;
  passCount: number;
  canProceedToAI: boolean;
}

export function runHardRules(data: {
  caseData: Record<string, unknown>;
  property: Record<string, unknown> | null;
  comparables: Array<Record<string, unknown>>;
  valuation: Record<string, unknown> | null;
}): HardRuleResult {
  const findings: ValidationFinding[] = [];
  const { caseData, comparables, valuation } = data;

  // --- TERMS OF ENGAGEMENT CHECKS ---

  // VPS 1 para 3.2(f) — Purpose of valuation
  if (!caseData.purpose) {
    findings.push({
      id: "TOE-001",
      severity: "critical",
      category: "terms",
      title: "Purpose of valuation not recorded",
      detail: "The purpose for which the valuation is prepared must be clearly identified and stated.",
      standard: "VPS 1 para 3.2(f)",
      evidence: "Purpose field is empty",
      action: "Record the purpose of valuation in Case Details (Step 1)",
    });
  } else {
    findings.push({
      id: "TOE-001",
      severity: "pass",
      category: "terms",
      title: "Purpose of valuation recorded",
      detail: "",
      standard: "VPS 1 para 3.2(f)",
      evidence: `Purpose: ${caseData.purpose}`,
      action: "",
    });
  }

  // VPS 1 para 3.2(h) — Valuation date
  if (!caseData.valuation_date) {
    findings.push({
      id: "TOE-002",
      severity: "critical",
      category: "terms",
      title: "Valuation date not recorded",
      detail: "The valuation date must be stated. An assumption that the valuation date is the date of the report is not acceptable.",
      standard: "VPS 1 para 3.2(h)",
      evidence: "Valuation date field is empty",
      action: "Set the valuation date in Case Details (Step 1)",
    });
  } else {
    findings.push({
      id: "TOE-002",
      severity: "pass",
      category: "terms",
      title: "Valuation date recorded",
      detail: "",
      standard: "VPS 1 para 3.2(h)",
      evidence: `Valuation date: ${caseData.valuation_date}`,
      action: "",
    });
  }

  // VPS 2 para 3.4 — Basis of value
  if (!caseData.basis_of_value) {
    findings.push({
      id: "TOE-003",
      severity: "critical",
      category: "terms",
      title: "Basis of value not stated",
      detail: "Valuers must ensure the basis of value is reproduced or clearly identified in both the terms of engagement and the report.",
      standard: "VPS 2 para 3.4",
      evidence: "Basis of value field is empty",
      action: "Set the basis of value in Case Details (Step 1)",
    });
  } else {
    findings.push({
      id: "TOE-003",
      severity: "pass",
      category: "terms",
      title: "Basis of value stated",
      detail: "",
      standard: "VPS 2 para 3.4",
      evidence: `Basis: ${caseData.basis_of_value}`,
      action: "",
    });
  }

  // VPS 6 para 2.2(a) — Valuer name
  if (!valuation?.valuer_name) {
    findings.push({
      id: "RPT-001",
      severity: "critical",
      category: "report",
      title: "Valuer name not recorded",
      detail: "The report must include the signature of the individual responsible for the valuation assignment.",
      standard: "VPS 6 para 2.2(a)",
      evidence: "Valuer name field is empty",
      action: "Enter valuer name in the Valuation step (Step 4)",
    });
  } else {
    findings.push({
      id: "RPT-001",
      severity: "pass",
      category: "report",
      title: "Responsible valuer identified",
      detail: "",
      standard: "VPS 6 para 2.2(a)",
      evidence: `Valuer: ${valuation.valuer_name}`,
      action: "",
    });
  }

  // --- COMPARABLE CHECKS ---

  // VPGA 8 — Minimum comparable evidence
  const compCount = comparables.length;
  if (compCount === 0) {
    findings.push({
      id: "COMP-001",
      severity: "critical",
      category: "comparables",
      title: "No comparable evidence provided",
      detail: "The market approach requires comparable evidence. A valuation cannot be defensible without transaction evidence.",
      standard: "VPS 3 para 2 / VPGA 8",
      evidence: "No comparables added",
      action: "Add at least 3 comparable transactions (Step 3)",
    });
  } else if (compCount < 3) {
    findings.push({
      id: "COMP-001",
      severity: "warning",
      category: "comparables",
      title: "Limited comparable evidence",
      detail: "While 2 comparables meet the minimum system requirement, RICS best practice recommends at least 3 for a defensible valuation.",
      standard: "VPS 3 para 2 / VPGA 8",
      evidence: `${compCount} comparable(s) provided`,
      action: "Consider adding additional comparable evidence",
    });
  } else {
    findings.push({
      id: "COMP-001",
      severity: "pass",
      category: "comparables",
      title: "Sufficient comparable evidence provided",
      detail: "",
      standard: "VPS 3 para 2 / VPGA 8",
      evidence: `${compCount} comparables provided`,
      action: "",
    });
  }

  // Check comparable dates — within 24 months
  const valuationDate = caseData.valuation_date
    ? new Date(caseData.valuation_date as string)
    : new Date();
  const cutoff = new Date(valuationDate);
  cutoff.setMonth(cutoff.getMonth() - 24);

  const staleComparables = comparables.filter((c) => {
    if (!c.transaction_date) return false;
    return new Date(c.transaction_date as string) < cutoff;
  });

  if (staleComparables.length > 0) {
    findings.push({
      id: "COMP-002",
      severity: "warning",
      category: "comparables",
      title: `${staleComparables.length} comparable(s) older than 24 months`,
      detail: "Comparable evidence should reflect current market conditions. Transactions older than 24 months require commentary on market movement.",
      standard: "VPS 3 para 2 — market approach requires current evidence",
      evidence: staleComparables.map((c) => c.address).join(", "),
      action: "Add more recent comparable evidence or document market movement commentary in rationale",
    });
  } else if (comparables.length > 0) {
    findings.push({
      id: "COMP-002",
      severity: "pass",
      category: "comparables",
      title: "Comparable evidence is current",
      detail: "",
      standard: "VPS 3 para 2",
      evidence: "All comparables within 24 months of valuation date",
      action: "",
    });
  }

  // Check adopted rate is within comparable range
  if (valuation?.adopted_rate_per_sqm && comparables.length > 0) {
    const rates = comparables.map((c) =>
      Number(c.adjusted_rate_per_sqm ?? c.rate_per_sqm)
    );
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const adoptedRate = Number(valuation.adopted_rate_per_sqm);
    const tolerance = 0.1;

    if (
      adoptedRate < minRate * (1 - tolerance) ||
      adoptedRate > maxRate * (1 + tolerance)
    ) {
      findings.push({
        id: "COMP-003",
        severity: "warning",
        category: "comparables",
        title: "Adopted rate outside comparable range",
        detail: "The adopted rate falls outside the range of adjusted comparable evidence. This requires clear justification in the rationale.",
        standard: "VPS 6 para 2.2(l) — valuation approach and reasoning must be documented",
        evidence: `Adopted: €${adoptedRate.toFixed(2)}/m² | Range: €${minRate.toFixed(2)}–€${maxRate.toFixed(2)}/m²`,
        action: "Document the specific reasons for adopting a rate outside the comparable range in your rationale",
      });
    } else {
      findings.push({
        id: "COMP-003",
        severity: "pass",
        category: "comparables",
        title: "Adopted rate within comparable range",
        detail: "",
        standard: "VPS 6 para 2.2(l)",
        evidence: `Adopted: €${adoptedRate.toFixed(2)}/m² | Range: €${minRate.toFixed(2)}–€${maxRate.toFixed(2)}/m²`,
        action: "",
      });
    }
  }

  // --- VALUATION CHECKS ---

  // VPS 6 para 2.2(l) — Rationale
  const rationale = (valuation?.adopted_rate_rationale as string) ?? "";
  if (!rationale || rationale.trim().length < 50) {
    findings.push({
      id: "VAL-001",
      severity: "critical",
      category: "valuation",
      title: "Valuation rationale insufficient",
      detail: "The report must make reference to the approach adopted, methods applied, key inputs used and principal reasons for conclusions reached.",
      standard: "VPS 6 para 2.2(l)",
      evidence: rationale
        ? `Current rationale: "${rationale}" (${rationale.length} characters — insufficient)`
        : "Rationale field is empty",
      action: "Expand rationale to reference specific comparables, explain adjustments, and justify the adopted rate",
    });
  } else {
    findings.push({
      id: "VAL-001",
      severity: "pass",
      category: "valuation",
      title: "Valuation rationale provided",
      detail: "",
      standard: "VPS 6 para 2.2(l)",
      evidence: `Rationale length: ${rationale.length} characters`,
      action: "",
    });
  }

  // VPS 6 para 2.2(i) — Assumptions
  if (
    !valuation?.assumptions ||
    (valuation.assumptions as string).trim().length < 20
  ) {
    findings.push({
      id: "VAL-002",
      severity: "warning",
      category: "valuation",
      title: "Assumptions not documented",
      detail: "All assumptions must be clearly stated in the report.",
      standard: "VPS 6 para 2.2(i)",
      evidence: "Assumptions field is empty or insufficient",
      action: "Document the assumptions underpinning this valuation (Step 4)",
    });
  } else {
    findings.push({
      id: "VAL-002",
      severity: "pass",
      category: "valuation",
      title: "Assumptions documented",
      detail: "",
      standard: "VPS 6 para 2.2(i)",
      evidence: "Assumptions recorded",
      action: "",
    });
  }

  // VPS 6 para 2.2(p) — Limiting conditions
  if (
    !valuation?.limiting_conditions ||
    (valuation.limiting_conditions as string).trim().length < 10
  ) {
    findings.push({
      id: "VAL-003",
      severity: "warning",
      category: "valuation",
      title: "Limiting conditions not stated",
      detail: "A statement setting out any limitations on liability or limiting conditions must be included.",
      standard: "VPS 6 para 2.2(p)",
      evidence: "Limiting conditions field is empty",
      action: "Document any limiting conditions in the Valuation step (Step 4)",
    });
  } else {
    findings.push({
      id: "VAL-003",
      severity: "pass",
      category: "valuation",
      title: "Limiting conditions stated",
      detail: "",
      standard: "VPS 6 para 2.2(p)",
      evidence: "Limiting conditions recorded",
      action: "",
    });
  }

  // VPS 1 para 3.2(s) — ESG consideration (mandatory from Jan 2025)
  findings.push({
    id: "TOE-004",
    severity: "warning",
    category: "terms",
    title: "ESG factors not explicitly considered",
    detail: "From January 2025, consideration of significant ESG factors is mandatory in terms of engagement and valuation report.",
    standard: "VPS 1 para 3.2(s) / VPS 6 para 2.2(q) — Red Book 2024",
    evidence: "No ESG commentary present in this valuation",
    action: "Add ESG commentary to assumptions or rationale — note any relevant environmental or sustainability factors",
  });

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const passCount = findings.filter((f) => f.severity === "pass").length;

  return {
    findings,
    criticalCount,
    warningCount,
    passCount,
    canProceedToAI: criticalCount === 0,
  };
}
